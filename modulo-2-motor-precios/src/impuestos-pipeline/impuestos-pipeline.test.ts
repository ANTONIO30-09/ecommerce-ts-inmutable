import {
  calcularImpuesto,
  ReglaImpuesto,
} from "./impuestos.js";

import {
  redondearHalfEven,
} from "./redondeo.js";

const verificar = (
  condicion: boolean,
  mensaje: string
): void => {
  if (!condicion) {
    throw new Error(`Prueba fallida: ${mensaje}`);
  }
};

const reglas: readonly ReglaImpuesto[] = Object.freeze([
  Object.freeze({
    jurisdiccion: "TEST",
    categoria: "GENERAL",
    tasaEscalada: 21n,
    escala: 100n,
  }),
]);

verificar(
  calcularImpuesto(
    { categoria: "GENERAL", baseImponible: 10000n },
    "TEST",
    reglas
  ) === 2100n,
  "El 21% de 10000 debe ser 2100"
);

verificar(
  redondearHalfEven({ numerador: 250n, denominador: 100n }) === 2n,
  "2.5 debe redondear a 2 con Half-Even"
);

verificar(
  redondearHalfEven({ numerador: 350n, denominador: 100n }) === 4n,
  "3.5 debe redondear a 4 con Half-Even"
);

console.log("✓ Pruebas de impuestos y redondeo superadas.");