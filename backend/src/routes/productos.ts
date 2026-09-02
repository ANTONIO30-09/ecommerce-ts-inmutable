import { Router } from 'express';
import { obtenerProductosConStock } from '../repositorios/productoRepo.ts';
import { buscarProductos } from '../../../modulo-4-busqueda/src/productos/busqueda.ts';
import { porCategoria, precioEntre, conStockDisponible, activos } from '../../../modulo-4-busqueda/src/productos/filtros.ts';
import type { Predicado } from '../../../modulo-4-busqueda/src/productos/predicado.temporal.ts';
import type { Producto } from '../../../modulo-1-dominio-inmutable/src/producto/producto.ts';

export const productosRouter = Router();

productosRouter.get('/', (req, res) => {
  try {
    const productos = obtenerProductosConStock();
    const predicados: Predicado<Producto>[] = [];

    if (typeof req.query.categoria === 'string' && req.query.categoria.trim() !== '') {
      predicados.push(porCategoria(req.query.categoria.trim()));
    }

    if (typeof req.query.precioMin === 'string' && req.query.precioMin.trim() !== '') {
      const min = BigInt(req.query.precioMin);
      const max = typeof req.query.precioMax === 'string' && req.query.precioMax.trim() !== ''
        ? BigInt(req.query.precioMax)
        : 1000000000n; // valor alto por defecto
      predicados.push(precioEntre(min, max));
    } else if (typeof req.query.precioMax === 'string' && req.query.precioMax.trim() !== '') {
      const max = BigInt(req.query.precioMax);
      predicados.push(precioEntre(0n, max));
    }

    if (typeof req.query.stockMin === 'string' && req.query.stockMin.trim() !== '') {
      const stockMin = Number(req.query.stockMin);
      if (!Number.isInteger(stockMin) || stockMin < 0) {
        throw new Error('stockMin debe ser entero no negativo');
      }
      predicados.push(conStockDisponible(stockMin));
    }

    // Por defecto solo productos activos
    predicados.push(activos());

    const resultado = buscarProductos(productos, ...predicados);

    const dto = resultado.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      precioCentavos: Number(p.precioCentavos),
      stock: p.stock,
      activo: p.activo,
    }));

    res.json(dto);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Error al filtrar productos' });
  }
});
