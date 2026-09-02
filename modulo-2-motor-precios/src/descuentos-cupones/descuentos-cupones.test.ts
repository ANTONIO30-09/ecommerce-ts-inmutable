import {
  aplicarCupon,
  Cupon,
} from "./cupones.js";

const verificar = (
  condicion: boolean,
  mensaje: string
): void => {
  if (!condicion) {
    throw new Error(`Prueba fallida: ${mensaje}`);
  }
};

const cupon: Cupon = Object.freeze({
  codigo: "TEST10",
  vigente: true,
  usosActuales: 0,
  limiteUsos: 10,
  compraMinima: 1000n,
  tipo: "PORCENTAJE",
  valor: 10n,
});

const resultado = aplicarCupon(5000n, cupon);

verificar(
  resultado.ok && resultado.valor === 4500n,
  "Un cupón del 10% sobre 5000 debe dejar 4500"
);

console.log("✓ Pruebas de cupones superadas.");
