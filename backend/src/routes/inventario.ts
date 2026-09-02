import { Router } from 'express';
import { db } from '../db.ts';
import { calcularStockActual, type EstadoStock } from '../../../modulo-5-inventario/src/logic/stockReducer.ts';
import type { EventoStock } from '../../../modulo-5-inventario/src/types/events.ts';

export const inventarioRouter = Router();

const mapearEventosDesdeDb = (productoId?: number): EventoStock[] => {
  const filas = productoId
    ? db.prepare('SELECT id, producto_id, tipo, cantidad, fecha FROM eventos_inventario WHERE producto_id = ? ORDER BY id').all(productoId)
    : db.prepare('SELECT id, producto_id, tipo, cantidad, fecha FROM eventos_inventario ORDER BY id').all();

  return (filas as Array<{
    id: number;
    producto_id: number;
    tipo: string;
    cantidad: number;
    fecha: string;
  }>).map((fila) => ({
    id: String(fila.id),
    productoId: String(fila.producto_id),
    tipo: fila.tipo as EventoStock['tipo'],
    cantidad: fila.cantidad,
    timestamp: new Date(fila.fecha).getTime(),
  }));
};

// GET /api/inventario/stock -> stock actual de todos los productos
inventarioRouter.get('/stock', (_req, res) => {
  try {
    const productos = db.prepare('SELECT id, nombre, categoria FROM productos WHERE activo = 1').all() as Array<{
      id: number;
      nombre: string;
      categoria: string;
    }>;

    const resultado = productos.map((producto) => {
      const productoId = String(producto.id);
      const eventos = mapearEventosDesdeDb(producto.id);
      const estado = calcularStockActual(productoId, eventos);
      return {
        productoId,
        nombre: producto.nombre,
        categoria: producto.categoria,
        stockTotal: estado.stockTotal,
        stockReservado: estado.stockReservado,
        stockDisponible: estado.stockDisponible,
      };
    });

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error al obtener stock' });
  }
});

// GET /api/inventario/eventos/:productoId -> historial de eventos de un producto
inventarioRouter.get('/eventos/:productoId', (req, res) => {
  try {
    const productoId = Number(req.params.productoId);
    if (!Number.isInteger(productoId)) {
      return res.status(400).json({ error: 'productoId debe ser un entero' });
    }
    const eventos = mapearEventosDesdeDb(productoId);
    res.json(eventos.map((e) => ({
      id: e.id,
      productoId: e.productoId,
      tipo: e.tipo,
      cantidad: e.cantidad,
      timestamp: e.timestamp,
    })));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error al obtener eventos' });
  }
});
