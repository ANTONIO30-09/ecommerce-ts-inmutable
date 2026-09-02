import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.ts';
import { calcularProrrateoProducto } from '../../../modulo-3-facturacion/src/prorrateo/prorrateo.ts';

export const facturasRouter = Router();

// GET /api/facturas/:id -> devuelve la factura con sus ítems
facturasRouter.get('/:id', (req, res) => {
  try {
    const facturaId = req.params.id;
    const factura = db
      .prepare('SELECT id, version, estado, subtotal_centavos, descuento_centavos, total_centavos FROM facturas WHERE id = ? ORDER BY version DESC LIMIT 1')
      .get(facturaId) as
        | { id: string; version: number; estado: string; subtotal_centavos: number; descuento_centavos: number; total_centavos: number }
        | undefined;

    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const items = db
      .prepare('SELECT producto_id, cantidad, precio_unitario_centavos, subtotal_centavos FROM items_factura WHERE factura_id = ? AND factura_version = ?')
      .all(factura.id, factura.version) as Array<{
        producto_id: number;
        cantidad: number;
        precio_unitario_centavos: number;
        subtotal_centavos: number;
      }>;

    res.json({
      id: factura.id,
      version: factura.version,
      estado: factura.estado,
      subtotalCentavos: factura.subtotal_centavos,
      descuentoCentavos: factura.descuento_centavos,
      totalCentavos: factura.total_centavos,
      items: items.map((item) => ({
        productoId: item.producto_id,
        cantidad: item.cantidad,
        precioUnitarioCentavos: item.precio_unitario_centavos,
        subtotalCentavos: item.subtotal_centavos,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error al obtener factura' });
  }
});

// Endpoint para marcar una factura Emitida como Pagada (insert-only)
facturasRouter.post('/:id/pagar', (req, res) => {
  try {
    const facturaId = req.params.id;
    const factura = db
      .prepare('SELECT id, version, estado, subtotal_centavos, descuento_centavos, total_centavos FROM facturas WHERE id = ? AND estado = ?')
      .get(facturaId, 'Emitida') as
        | { id: string; version: number; estado: string; subtotal_centavos: number; descuento_centavos: number; total_centavos: number }
        | undefined;

    if (!factura) {
      return res.status(404).json({ error: 'Factura Emitida no encontrada' });
    }

    const nuevaVersion = factura.version + 1;
    const nuevoId = `${facturaId}-v${nuevaVersion}`;

    const transaccion = db.transaction(() => {
      db.prepare(
        'INSERT INTO facturas (id, version, carrito_id, carrito_version, estado, subtotal_centavos, descuento_centavos, total_centavos, factura_origen_id, factura_origen_version) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)'
      ).run(nuevoId, nuevaVersion, 'Pagada', factura.subtotal_centavos, factura.descuento_centavos, factura.total_centavos, facturaId, factura.version);

      const items = db.prepare('SELECT producto_id, cantidad, precio_unitario_centavos, subtotal_centavos FROM items_factura WHERE factura_id = ? AND factura_version = ?').all(facturaId, factura.version) as Array<{
        producto_id: number;
        cantidad: number;
        precio_unitario_centavos: number;
        subtotal_centavos: number;
      }>;

      const insertarItem = db.prepare(
        'INSERT INTO items_factura (factura_id, factura_version, producto_id, cantidad, precio_unitario_centavos, subtotal_centavos) VALUES (?, ?, ?, ?, ?, ?)'
      );

      for (const item of items) {
        insertarItem.run(nuevoId, nuevaVersion, item.producto_id, item.cantidad, item.precio_unitario_centavos, item.subtotal_centavos);
      }
    });

    transaccion();

    res.status(201).json({ facturaId: nuevoId, estado: 'Pagada', version: nuevaVersion });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error al marcar como pagada' });
  }
});

// Endpoint de devolución parcial
facturasRouter.post('/devoluciones', (req, res) => {
  try {
    const { facturaId, productoId } = req.body as { facturaId: string; productoId: number };
    if (!facturaId || !productoId) {
      return res.status(400).json({ error: 'facturaId y productoId son obligatorios' });
    }

    const factura = db
      .prepare('SELECT id, version, estado, subtotal_centavos, descuento_centavos, total_centavos FROM facturas WHERE id = ? AND estado = ?')
      .get(facturaId, 'Pagada') as
        | { id: string; version: number; estado: string; subtotal_centavos: number; descuento_centavos: number; total_centavos: number }
        | undefined;

    if (!factura) {
      return res.status(404).json({ error: 'Factura Pagada no encontrada' });
    }

    const items = db
      .prepare('SELECT producto_id, cantidad, precio_unitario_centavos, subtotal_centavos FROM items_factura WHERE factura_id = ? AND factura_version = ?')
      .all(factura.id, factura.version) as Array<{
        producto_id: number;
        cantidad: number;
        precio_unitario_centavos: number;
        subtotal_centavos: number;
      }>;

    const item = items.find((i) => i.producto_id === productoId);
    if (!item) {
      return res.status(400).json({ error: 'El producto no está en la factura' });
    }

    const resultadoProrrateo = calcularProrrateoProducto(
      BigInt(item.precio_unitario_centavos),
      BigInt(factura.subtotal_centavos),
      BigInt(factura.descuento_centavos)
    );

    const montoReembolso = Number(resultadoProrrateo.reembolsoNeto);
    const nuevaVersion = factura.version + 1;
    const nuevoId = `${factura.id}-v${nuevaVersion}`;

    const transaccion = db.transaction(() => {
      db.prepare(
        'INSERT INTO facturas (id, version, carrito_id, carrito_version, estado, subtotal_centavos, descuento_centavos, total_centavos, factura_origen_id, factura_origen_version) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)'
      ).run(nuevoId, nuevaVersion, 'Nota_Credito', factura.subtotal_centavos, factura.descuento_centavos, montoReembolso, factura.id, factura.version);

      db.prepare(
        'INSERT INTO eventos_inventario (producto_id, tipo, cantidad) VALUES (?, ?, ?)'
      ).run(productoId, 'StockDevuelto', item.cantidad);
    });

    transaccion();

    res.status(201).json({
      facturaId: nuevoId,
      estado: 'Nota_Credito',
      version: nuevaVersion,
      montoReembolsoCentavos: montoReembolso,
      detalleProrrateo: {
        precioUnitarioCentavos: Number(resultadoProrrateo.precioProducto),
        subtotalCentavos: Number(resultadoProrrateo.subtotal),
        descuentoGlobalCentavos: Number(resultadoProrrateo.descuentoGlobal),
        descuentoProrrateadoCentavos: Number(resultadoProrrateo.descuentoProrrateado),
        reembolsoNetoCentavos: Number(resultadoProrrateo.reembolsoNeto),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error en la devolución' });
  }
});
