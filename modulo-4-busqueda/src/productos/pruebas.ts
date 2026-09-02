import { crearProducto } from '../../../modulo-1-dominio-inmutable/src/producto/producto';
import { porCategoria, precioEntre, conStockDisponible } from './filtros';
import { buscarProductos } from './busqueda';

const productos = [
  crearProducto('1', 'Laptop', 500000n, 'Electrónica', 10),
  crearProducto('2', 'Mouse', 5000n, 'Electrónica', 0),
  crearProducto('3', 'Camisa', 8000n, 'Ropa', 20),
];

const resultado = buscarProductos(
  productos,
  porCategoria('Electrónica'),
  conStockDisponible(1),
  precioEntre(0n, 1000000n)
);

console.log('Resultado esperado: solo "Laptop" (Mouse no tiene stock)');
console.log(resultado.map((p) => p.nombre));

if (resultado.length === 1 && resultado[0]?.nombre === 'Laptop') {
  console.log('Prueba pasó');
} else {
  console.log('Prueba falló');
}