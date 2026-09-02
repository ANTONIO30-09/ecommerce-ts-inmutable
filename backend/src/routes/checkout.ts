import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { obtenerCarritoActual } from '../repositorios/carritoRepo.ts';
import { aplicarCupon, type Cupon } from '../../../modulo-2-motor-precios/src/descuentos-cupones/cupones.ts';
import { db } from '../db.ts';

export const checkoutRouter = Router();

const cuponBienvenida: Cupon = {
  codigo: 'BIENVENIDA10',
  vigente: true,
  usosActuales: 0,
  limiteUsos: 100,
  compraMinima: 500n,
  tipo: 'PORCENTAJE',
  valor: 10n,
};

const TASA_IVA = 13n;
const ESCALA_IVA = 100n;

checkoutRouter.post('/', (req, res) => {
  try {
    const { carritoId, codigoCupon } = req.body as { carritoId: string; codigoCupon?: string };
    if (!carritoId) return res.status(400).json({ error: 'carritoId es obligatorio' });

    const carrito = obtenerCarritoActual(carritoId);
    if (!carrito) return res.status(404).json({ error: 'Carrito no encontrado o ya cerrado' });
    if (carrito.items.length === 0) return res.status(400).json({ error: 'El carrito está vacío' });

    const subtotal = carrito.totalCentavos;

    let descuento = 0n;
    let totalTrasDescuento = subtotal;
    if (codigoCupon) {
      if (codigoCupon !== cuponBienvenida.codigo) {
        return res.status(400).json({ error: 'CUPON_NO_ENCONTRADO' });
      }
      const resultado = aplicarCupon(subtotal, cuponBienvenida);
      if (!resultado.ok) {
        return res.status(400).json({ error: resultado.error });
      }
      descuento = subtotal - resultado.valor;
      totalTrasDescuento = resultado.valor;
    }

    const impuestos = (totalTrasDescuento * TASA_IVA) / ESCALA_IVA;
    const total = totalTrasDescuento + impuestos;

    const facturaId = randomUUID();
    const version = 1;
    const carritoUltimaVersion = carrito.version;

    const insertarFactura = db.prepare(
      'INSERT INTO facturas (id, version, carrito_id, carrito_version, estado, subtotal_centavos, descuento_centavos, total_centavos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insertarFactura.run(
      facturaId,
      version,
      carritoId,
      carritoUltimaVersion,
      'Emitida',
      Number(subtotal),
      Number(descuento),
      Number(total)
    );

    const insertarItemFactura = db.prepare(
      'INSERT INTO items_factura (factura_id, factura_version, producto_id, cantidad, precio_unitario_centavos, subtotal_centavos) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertarEvento = db.prepare(
      'INSERT INTO eventos_inventario (producto_id, tipo, cantidad) VALUES (?, ?, ?)'
    );

    const transaccion = db.transaction(() => {
      for (const item of carrito.items) {
        const productoId = Number(item.producto.id);
        const subtotalItem = Number(item.precioUnitario * BigInt(item.cantidad));
        insertarItemFactura.run(facturaId, version, productoId, item.cantidad, Number(item.precioUnitario), subtotalItem);
        // StockVendido consume la reserva existente
        insertarEvento.run(productoId, 'StockVendido', item.cantidad);
      }

      db.prepare('INSERT INTO carritos (id, version, estado) VALUES (?, ?, ?)')
        .run(carritoId, carritoUltimaVersion + 1, 'cerrado');
    });

    transaccion();

    res.status(201).json({
      facturaId,
      estado: 'Emitida',
      version,
      subtotalCentavos: Number(subtotal),
      descuentoCentavos: Number(descuento),
      impuestosCentavos: Number(impuestos),
      totalCentavos: Number(total),
      items: carrito.items.map((item) => ({
        productoId: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitarioCentavos: Number(item.precioUnitario),
        subtotalCentavos: Number(item.precioUnitario * BigInt(item.cantidad)),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error en el checkout' });
  }
});
