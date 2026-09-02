import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import {
  crearCarritoNuevo,
  obtenerCarritoActual,
  agregarProductoAlCarrito,
  quitarProductoDelCarrito,
} from '../repositorios/carritoRepo.ts';

export const carritosRouter = Router();

// POST /api/carritos -> crea un carrito nuevo vacío
carritosRouter.post('/', (_req, res) => {
  const id = randomUUID();
  const carrito = crearCarritoNuevo(id);
  res.status(201).json({
    id: carrito.id,
    version: carrito.version,
    estado: 'abierto',
    items: carrito.items.map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      precioUnitarioCentavos: Number(item.precioUnitario),
      subtotalCentavos: Number(item.precioUnitario * BigInt(item.cantidad)),
    })),
    totalCentavos: Number(carrito.totalCentavos),
  });
});

// GET /api/carritos/:id -> obtiene el carrito actual (versión vigente)
carritosRouter.get('/:id', (req, res) => {
  try {
    const carrito = obtenerCarritoActual(req.params.id);
    if (!carrito) {
      return res.status(404).json({ error: 'Carrito no encontrado o cerrado' });
    }
    res.json({
      id: carrito.id,
      version: carrito.version,
      items: carrito.items.map((item) => ({
        productoId: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitarioCentavos: Number(item.precioUnitario),
        subtotalCentavos: Number(item.precioUnitario * BigInt(item.cantidad)),
      })),
      totalCentavos: Number(carrito.totalCentavos),
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Error al obtener carrito' });
  }
});

// POST /api/carritos/:id/items -> agrega un producto al carrito
carritosRouter.post('/:id/items', (req, res) => {
  try {
    const { productoId, cantidad } = req.body as { productoId: number; cantidad: number };
    if (!Number.isInteger(productoId) || !Number.isInteger(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'productoId y cantidad deben ser enteros positivos' });
    }
    const carrito = agregarProductoAlCarrito(req.params.id, productoId, cantidad);
    res.status(200).json({
      id: carrito.id,
      version: carrito.version,
      items: carrito.items.map((item) => ({
        productoId: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitarioCentavos: Number(item.precioUnitario),
        subtotalCentavos: Number(item.precioUnitario * BigInt(item.cantidad)),
      })),
      totalCentavos: Number(carrito.totalCentavos),
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Error al agregar producto' });
  }
});

// DELETE /api/carritos/:id/items/:productoId -> quita un producto del carrito
carritosRouter.delete('/:id/items/:productoId', (req, res) => {
  try {
    const productoId = Number(req.params.productoId);
    if (!Number.isInteger(productoId)) {
      return res.status(400).json({ error: 'productoId debe ser un entero' });
    }
    const carrito = quitarProductoDelCarrito(req.params.id, productoId);
    res.json({
      id: carrito.id,
      version: carrito.version,
      items: carrito.items.map((item) => ({
        productoId: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitarioCentavos: Number(item.precioUnitario),
        subtotalCentavos: Number(item.precioUnitario * BigInt(item.cantidad)),
      })),
      totalCentavos: Number(carrito.totalCentavos),
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Error al quitar producto' });
  }
});
