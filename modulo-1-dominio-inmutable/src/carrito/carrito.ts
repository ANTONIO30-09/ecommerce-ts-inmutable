/**
 * ============================================================================
 * MÓDULO 1 — Dominio Inmutable y Estructuras de Datos
 * Entidad: Carrito
 * Autor: Grisly
 * ----------------------------------------------------------------------------
 * Cada cambio produce una NUEVA versión del carrito (Carrito_V1, Carrito_V2, …).
 * La versión anterior permanece intacta en memoria (Event Sourcing / auditabilidad).
 * Las versiones sucesivas comparten referencias internas de los ítems que no
 * cambiaron (estructura persistente): solo se construye un objeto nuevo para el
 * ítem modificado y un arreglo nuevo; el resto se reutiliza.
 *
 * Usa el patrón base de David en src/shared/inmutable.ts
 * (DeepReadonly + crearInmutable) y el tipo Producto de src/producto/producto.ts.
 * El dinero NUNCA usa number/float: precio y total van en bigint (centavos).
 * ============================================================================
 */

import { DeepReadonly, crearInmutable } from "../shared/inmutable";
import { Producto } from "../producto/producto";

// ----------------------------------------------------------------------------
// 1. DINERO EN CENTAVOS (bigint) — sin punto flotante
// ----------------------------------------------------------------------------

/** Monto en centavos. Ejemplo: $12.99 => 1299n */
export type DineroCentavos = bigint;

/**
 * Función pura: subtotal de una línea = precio unitario × cantidad.
 * bigint es inmutable por naturaleza; el operador * no muta operandos,
 * retorna un valor nuevo.
 */
const subtotalItem = (
  precioUnitario: DineroCentavos,
  cantidad: number
): DineroCentavos => precioUnitario * BigInt(cantidad);

/**
 * Función pura: suma de subtotales con reduce.
 * El acumulador es un bigint nuevo en cada paso; nunca se reasigna un campo
 * de un objeto existente.
 */
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

// ----------------------------------------------------------------------------
// 2. ÍTEM DEL CARRITO (solo lectura)
// ----------------------------------------------------------------------------

/**
 * Estado base de un ítem. El Producto se guarda por referencia: varias
 * versiones del carrito pueden apuntar al MISMO objeto Producto congelado
 * (compartir estructura) sin copiarlo.
 *
 * precioUnitario es una FOTO del precio al momento de agregar: si más tarde
 * se crea un Producto con otro precio, este ítem (y las versiones viejas del
 * carrito) no se alteran.
 */
interface ItemCarritoBase {
  producto: Producto;
  cantidad: number;
  precioUnitario: DineroCentavos;
}

/** Ítem de solo lectura en todos los niveles (compilación). */
export type ItemCarrito = DeepReadonly<ItemCarritoBase>;

const asegurarCantidadValida = (cantidad: number): void => {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad debe ser un entero positivo");
  }
};

/**
 * Función pura: construye un ítem nuevo y lo sella.
 * No existe un ítem "en construcción" que luego se mute; nace ya congelado.
 */
export const crearItemCarrito = (
  producto: Producto,
  cantidad: number
): ItemCarrito => {
  asegurarCantidadValida(cantidad);

  if (!producto.activo) {
    throw new Error(`El producto ${producto.id} no está activo`);
  }

  // crearInmutable aplica Object.freeze en profundidad. El Producto ya viene
  // congelado: se reutiliza la misma referencia (no se clona el catálogo).
  return crearInmutable({
    producto,
    cantidad,
    precioUnitario: producto.precioCentavos,
  });
};

// ----------------------------------------------------------------------------
// 3. CARRITO (identidad estable + versión incremental)
// ----------------------------------------------------------------------------

interface CarritoBase {
  /** Identidad del carrito a lo largo de sus versiones. */
  id: string;
  /** Número de versión: 1, 2, 3… Cada operación pura incrementa este valor. */
  version: number;
  items: ItemCarritoBase[];
  /** Total derivado; se recalcula en cada versión, nunca se edita "en sitio". */
  totalCentavos: DineroCentavos;
}

/** Carrito de solo lectura en todos los niveles (compilación). */
export type Carrito = DeepReadonly<CarritoBase>;

/**
 * Función interna pura: ensambla una versión nueva y la congela.
 * Spread + arreglo nuevo ⇒ el objeto anterior no se toca.
 * crearInmutable sella el resultado en tiempo de ejecución.
 */
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

/**
 * Función pura: carrito vacío versión 1.
 * El arreglo de ítems es una copia nueva ([]), no un singleton mutable global.
 */
export const crearCarrito = (id: string): Carrito => sellarCarrito(id, 1, []);

// ----------------------------------------------------------------------------
// 4. OPERACIONES PURAS — siempre retornan Carrito_V(n+1)
// ----------------------------------------------------------------------------

/**
 * Función pura: agrega un ítem o, si el producto ya está, combina cantidades
 * en un ÍTEM NUEVO dentro de un ARREGLO NUEVO.
 *
 * Por qué no muta:
 * - No usa push/splice ni asignación a índices.
 * - map produce un arreglo distinto; los ítems no afectados se reutilizan
 *   por referencia (estructura persistente: Carrito_V2 comparte esos objetos
 *   con Carrito_V1).
 * - El carrito de entrada no se modifica; el llamador conserva V1 intacto.
 */
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
              // Objeto ítem NUEVO: cantidad combinada. El Producto se comparte.
              producto: actual.producto,
              cantidad: actual.cantidad + item.cantidad,
              precioUnitario: item.precioUnitario,
            }
          : actual
      )
    : [...carrito.items, item];

  return sellarCarrito(carrito.id, carrito.version + 1, itemsSiguiente);
};

/**
 * Función pura: quita todas las líneas de un producto.
 * filter retorna un arreglo nuevo; el original de V1 sigue con sus ítems.
 * Si el producto no está, se devuelve la MISMA referencia (no hay evento de
 * cambio: no se fabrica una versión vacía de significado).
 */
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

/**
 * Función pura: cambia la cantidad de un producto sin tocar el arreglo original.
 *
 * Cómo se actualiza sin mutar:
 * - map recorre el arreglo de V1 y, para el ítem objetivo, construye un
 *   objeto nuevo con spread conceptual (campos explícitos) y cantidad nueva.
 * - Los demás elementos del map son la MISMA referencia que en V1.
 * - El arreglo resultante es otro objeto; V1.items permanece igual.
 * - cantidad === 0 se trata como quitarProducto (nueva versión sin esa línea).
 */
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
