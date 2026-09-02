import { db } from '../db.ts';
import { crearProducto } from '../../../modulo-1-dominio-inmutable/src/producto/producto.ts';
import { calcularStockActual } from '../../../modulo-5-inventario/src/logic/stockReducer.ts';
import type { EventoStock } from '../../../modulo-5-inventario/src/types/events.ts';
import type { Producto } from '../../../modulo-1-dominio-inmutable/src/producto/producto.ts';

export const obtenerProductosConStock = (): Producto[] => {
  const filasProductos = db
    .prepare('SELECT id, nombre, categoria, precio_centavos FROM productos WHERE activo = 1')
    .all() as Array<{
      id: number;
      nombre: string;
      categoria: string;
      precio_centavos: number;
    }>;

  return filasProductos.map((fila) => {
    const productoId = String(fila.id);

    const eventosFilas = db
      .prepare('SELECT id, producto_id, tipo, cantidad, fecha FROM eventos_inventario WHERE producto_id = ? ORDER BY id')
      .all(fila.id) as Array<{
        id: number;
        producto_id: number;
        tipo: string;
        cantidad: number;
        fecha: string;
      }>;

    const eventos: EventoStock[] = eventosFilas.map((ev) => ({
      id: String(ev.id),
      productoId: String(ev.producto_id),
      cantidad: ev.cantidad,
      timestamp: new Date(ev.fecha).getTime(),
      tipo: ev.tipo as EventoStock['tipo'],
    }));

    const estadoStock = calcularStockActual(productoId, eventos);

    return crearProducto(
      productoId,
      fila.nombre,
      BigInt(fila.precio_centavos),
      fila.categoria,
      estadoStock.stockDisponible
    );
  });
};
