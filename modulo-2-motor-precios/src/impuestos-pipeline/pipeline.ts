import {
  Carrito,
} from "../../../modulo-1-dominio-inmutable/src/carrito/carrito.js";

import {
  calcularSubtotal,
} from "../subtotal/subtotal.js";

export interface ResultadoMotorPrecios {
  readonly subtotal: bigint;
  readonly descuentos: bigint;
  readonly impuestos: bigint;
  readonly total: bigint;
}

export const crearResultadoMotorPrecios = (
  carrito: Carrito,
  descuentos: bigint,
  impuestos: bigint
): ResultadoMotorPrecios => {
  const subtotal = calcularSubtotal(carrito);

  const descuentosLimitados =
    descuentos > subtotal ? subtotal : descuentos;

  const total =
    subtotal - descuentosLimitados + impuestos;

  return Object.freeze({
    subtotal,
    descuentos: descuentosLimitados,
    impuestos,
    total,
  });
};
