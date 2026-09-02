import {
  AND_ALL,
  OR_ANY,
  NOT,
  type Predicado
} from '../predicados';

type ProductoPrueba = Readonly<{
  categoria: string;
  precioCentavos: bigint;
  stock: number;
}>;

const afirmar = (
  condicion: boolean,
  mensaje: string
): void => {
  if (!condicion) {
    throw new Error(`Prueba fallida: ${mensaje}`);
  }
};

const producto: ProductoPrueba = Object.freeze({
  categoria: 'Electronica',
  precioCentavos: 12000n,
  stock: 5
});

const esCategoria = (
  categoria: string
): Predicado<ProductoPrueba> =>
  (elemento: ProductoPrueba): boolean =>
    elemento.categoria === categoria;

const precioMenorIgualA = (
  precioMaximo: bigint
): Predicado<ProductoPrueba> =>
  (elemento: ProductoPrueba): boolean =>
    elemento.precioCentavos <= precioMaximo;

const tieneStock: Predicado<ProductoPrueba> =
  (elemento: ProductoPrueba): boolean =>
    elemento.stock > 0;

const productoValido = AND_ALL(
  esCategoria('Electronica'),
  precioMenorIgualA(15000n),
  tieneStock
);

afirmar(
  productoValido(producto),
  'AND_ALL debería devolver true'
);

const productoCoincide = OR_ANY(
  esCategoria('Ropa'),
  esCategoria('Electronica')
);

afirmar(
  productoCoincide(producto),
  'OR_ANY debería devolver true'
);

const noEsRopa = NOT(esCategoria('Ropa'));

afirmar(
  noEsRopa(producto),
  'NOT debería invertir el resultado'
);

const siempreFalso: Predicado<ProductoPrueba> =
  (): boolean => false;

const nuncaDebeEjecutarse: Predicado<ProductoPrueba> =
  (): boolean => {
    throw new Error('El cortocircuito no funcionó');
  };

afirmar(
  AND_ALL(
    siempreFalso,
    nuncaDebeEjecutarse
  )(producto) === false,
  'AND_ALL debe detenerse después del primer false'
);

const siempreVerdadero: Predicado<ProductoPrueba> =
  (): boolean => true;

afirmar(
  OR_ANY(
    siempreVerdadero,
    nuncaDebeEjecutarse
  )(producto) === true,
  'OR_ANY debe detenerse después del primer true'
);

afirmar(
  AND_ALL<ProductoPrueba>()(producto) === true,
  'AND_ALL vacío debe devolver true'
);

afirmar(
  OR_ANY<ProductoPrueba>()(producto) === false,
  'OR_ANY vacío debe devolver false'
);

console.log(
  'Todas las pruebas de predicados pasaron correctamente.'
);