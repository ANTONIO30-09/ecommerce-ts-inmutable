import { db } from '../db.ts';
import {
  crearCarrito,
  agregarProducto,
  quitarProducto,
  crearItemCarrito,
  type Carrito,
  type ItemCarrito,
} from '../../../modulo-1-dominio-inmutable/src/carrito/carrito.ts';
import { crearInmutable } from '../../../modulo-1-dominio-inmutable/src/shared/inmutable.ts';
import { obtenerProductosConStock } from './productoRepo.ts';

type FilaCarrito = {
  id: string;
  version: number;
  estado: string;
};

type FilaItem = {
  producto_id: number;
  cantidad: number;
};

const obtenerUltimaVersionCarrito = (id: string): FilaCarrito | undefined => {
  const fila = db
    .prepare('SELECT id, version, estado FROM carritos WHERE id = ? ORDER BY version DESC LIMIT 1')
    .get(id) as FilaCarrito | undefined;
  return fila;
};

const obtenerItemsDeVersion = (carritoId: string, version: number): FilaItem[] => {
  return db
    .prepare('SELECT producto_id, cantidad FROM items_carrito WHERE carrito_id = ? AND carrito_version = ?')
    .all(carritoId, version) as FilaItem[];
};

export const obtenerCarritoActual = (id: string): Carrito | undefined => {
  const fila = obtenerUltimaVersionCarrito(id);
  if (!fila || fila.estado !== 'abierto') return undefined;

  const itemsFila = obtenerItemsDeVersion(fila.id, fila.version);
  const todosProductos = obtenerProductosConStock();

  const items = itemsFila.map((itemFila) => {
    const producto = todosProductos.find((p) => p.id === String(itemFila.producto_id));
    if (!producto) throw new Error(`Producto ${itemFila.producto_id} no encontrado`);
    return crearItemCarrito(producto, itemFila.cantidad);
  });

  const carritoBase = {
    id: fila.id,
    version: fila.version,
    items: items.map((item) => ({
      producto: item.producto,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
    })),
    totalCentavos: items.reduce(
      (total, item) => total + item.precioUnitario * BigInt(item.cantidad),
      0n
    ),
  };

  return crearInmutable(carritoBase);
};

export const crearCarritoNuevo = (id: string): Carrito => {
  const carrito = crearCarrito(id);
  const insertar = db.prepare('INSERT INTO carritos (id, version, estado) VALUES (?, ?, ?)');
  insertar.run(id, 1, 'abierto');
  return carrito;
};

export const agregarProductoAlCarrito = (id: string, productoId: number, cantidad: number): Carrito => {
  const actual = obtenerCarritoActual(id);
  if (!actual) throw new Error('Carrito no encontrado o no está abierto');

  const todosProductos = obtenerProductosConStock();
  const producto = todosProductos.find((p) => p.id === String(productoId));
  if (!producto) throw new Error('Producto no encontrado');

  const item = crearItemCarrito(producto, cantidad);
  const nuevo = agregarProducto(actual, item);

  const version = nuevo.version;
  const insertarCarrito = db.prepare('INSERT INTO carritos (id, version, estado) VALUES (?, ?, ?)');
  insertarCarrito.run(id, version, 'abierto');

  const insertarItem = db.prepare('INSERT INTO items_carrito (carrito_id, carrito_version, producto_id, cantidad) VALUES (?, ?, ?, ?)');
  for (const it of nuevo.items) {
    insertarItem.run(id, version, Number(it.producto.id), it.cantidad);
  }

  // Emitir evento StockReservadoEnCarrito
  const insertarEvento = db.prepare(
    'INSERT INTO eventos_inventario (producto_id, tipo, cantidad) VALUES (?, ?, ?)'
  );
  insertarEvento.run(productoId, 'StockReservadoEnCarrito', cantidad);

  return nuevo;
};

export const quitarProductoDelCarrito = (id: string, productoId: number): Carrito => {
  const actual = obtenerCarritoActual(id);
  if (!actual) throw new Error('Carrito no encontrado o no está abierto');

  const cantidadPrev = actual.items.find((it) => it.producto.id === String(productoId))?.cantidad ?? 0;
  const nuevo = quitarProducto(actual, String(productoId));
  if (nuevo.version === actual.version) {
    return actual; // no cambió
  }

  const version = nuevo.version;
  const insertarCarrito = db.prepare('INSERT INTO carritos (id, version, estado) VALUES (?, ?, ?)');
  insertarCarrito.run(id, version, 'abierto');

  const insertarItem = db.prepare('INSERT INTO items_carrito (carrito_id, carrito_version, producto_id, cantidad) VALUES (?, ?, ?, ?)');
  for (const it of nuevo.items) {
    insertarItem.run(id, version, Number(it.producto.id), it.cantidad);
  }

  // Emitir StockReservaLiberada por la cantidad quitada
  if (cantidadPrev > 0) {
    const insertarEvento = db.prepare(
      'INSERT INTO eventos_inventario (producto_id, tipo, cantidad) VALUES (?, ?, ?)'
    );
    insertarEvento.run(productoId, 'StockReservaLiberada', cantidadPrev);
  }

  return nuevo;
};
