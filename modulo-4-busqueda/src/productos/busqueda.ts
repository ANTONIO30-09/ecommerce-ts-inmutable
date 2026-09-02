import type { Producto } from '../../../modulo-1-dominio-inmutable/src/producto/producto';
import type { Predicado } from './predicado.temporal';
import { AND_ALL } from './predicado.temporal';


export const buscarProductos = (
  productos: ReadonlyArray<Producto>,
  ...filtros: ReadonlyArray<Predicado<Producto>>
): ReadonlyArray<Producto> => {
  const filtroCombinado = AND_ALL(...filtros);
  return productos.filter(filtroCombinado);
};