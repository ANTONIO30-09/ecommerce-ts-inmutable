import type { Producto } from '../../../modulo-1-dominio-inmutable/src/producto/producto';
import type { Predicado } from './predicado.temporal';

/** categoría exacta */
export const porCategoria = (categoria: string): Predicado<Producto> =>
  (producto) => producto.categoria === categoria;

/** rango de precio (en centavos, bigint) */
export const precioEntre = (minCentavos: bigint, maxCentavos: bigint): Predicado<Producto> =>
  (producto) => producto.precioCentavos >= minCentavos && producto.precioCentavos <= maxCentavos;

/** stock disponible (por defecto, al menos 1) */
export const conStockDisponible = (cantidadMinima: number = 1): Predicado<Producto> =>
  (producto) => producto.stock >= cantidadMinima;

/**productos activos */
export const activos = (): Predicado<Producto> =>
  (producto) => producto.activo === true;