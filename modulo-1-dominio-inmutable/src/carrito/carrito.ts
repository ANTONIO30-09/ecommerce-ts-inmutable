import { DeepReadonly, crearInmutable } from "../shared/inmutable";
import { Producto } from "../producto/producto";

export type DineroCentavos = bigint;

const subtotalItem = (
  precioUnitario: DineroCentavos,
  cantidad: number
): DineroCentavos => precioUnitario * BigInt(cantidad);

const sumarTotales = (
  items: ReadonlyArray<{
    readonly precioUnitario: DineroCentavos;
    readonly cantidad: number;
  }>
): DineroCentavos =>
  items.reduce(
    (acumulado, item) => acumulado + subtotalItem(item.precioUnitario, item.cantidad),
    0n
  );

interface ItemCarritoBase {
  producto: Producto;
  cantidad: number;
  precioUnitario: DineroCentavos;
}

export type ItemCarrito = DeepReadonly<ItemCarritoBase>;

const asegurarCantidadValida = (cantidad: number): void => {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad debe ser un entero positivo");
  }
};

export const crearItemCarrito = (
  producto: Producto,
  cantidad: number
): ItemCarrito => {
  asegurarCantidadValida(cantidad);

  if (!producto.activo) {
    throw new Error(`El producto ${producto.id} no está activo`);
  }

  return crearInmutable({
    producto,
    cantidad,
    precioUnitario: producto.precioCentavos,
  });
};

interface CarritoBase {
  id: string;
  version: number;
  items: ItemCarritoBase[];
  totalCentavos: DineroCentavos;
}

export type Carrito = DeepReadonly<CarritoBase>;

const sellarCarrito = (
  id: string,
  version: number,
  items: ReadonlyArray<ItemCarritoBase>
): Carrito =>
  crearInmutable({
    id,
    version,
    items: [...items],
    totalCentavos: sumarTotales(items),
  });

export const crearCarrito = (id: string): Carrito => sellarCarrito(id, 1, []);

export const agregarProducto = (
  carrito: Carrito,
  item: ItemCarrito
): Carrito => {
  asegurarCantidadValida(item.cantidad);

  const yaExiste = carrito.items.some(
    (actual) => actual.producto.id === item.producto.id
  );

  const itemsSiguiente: ReadonlyArray<ItemCarritoBase> = yaExiste
    ? carrito.items.map((actual) =>
        actual.producto.id === item.producto.id
          ? {
              producto: actual.producto,
              cantidad: actual.cantidad + item.cantidad,
              precioUnitario: item.precioUnitario,
            }
          : actual
      )
    : [...carrito.items, item];

  return sellarCarrito(carrito.id, carrito.version + 1, itemsSiguiente);
};

export const quitarProducto = (
  carrito: Carrito,
  productoId: string
): Carrito => {
  const estaEnCarrito = carrito.items.some(
    (item) => item.producto.id === productoId
  );

  if (!estaEnCarrito) {
    return carrito;
  }

  const itemsSiguiente = carrito.items.filter(
    (item) => item.producto.id !== productoId
  );

  return sellarCarrito(carrito.id, carrito.version + 1, itemsSiguiente);
};

export const cambiarCantidad = (
  carrito: Carrito,
  productoId: string,
  nuevaCantidad: number
): Carrito => {
  if (nuevaCantidad === 0) {
    return quitarProducto(carrito, productoId);
  }

  asegurarCantidadValida(nuevaCantidad);

  const estaEnCarrito = carrito.items.some(
    (item) => item.producto.id === productoId
  );

  if (!estaEnCarrito) {
    throw new Error(`El producto ${productoId} no está en el carrito`);
  }

  const itemsSiguiente = carrito.items.map((item) =>
    item.producto.id === productoId
      ? {
          producto: item.producto,
          cantidad: nuevaCantidad,
          precioUnitario: item.precioUnitario,
        }
      : item
  );

  return sellarCarrito(carrito.id, carrito.version + 1, itemsSiguiente);
};
