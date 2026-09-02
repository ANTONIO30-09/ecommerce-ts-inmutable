import {
  ReglaDescuento,
  ContextoAplicacion,
  calcularDescuento,
  esAplicable,
} from "../../../modulo-1-dominio-inmutable/src/reglaDescuento/reglaDescuento.js";

export type DineroCentavos = bigint;

export interface ResultadoDescuento {
  readonly subtotal: DineroCentavos;
  readonly descuentoTotal: DineroCentavos;
  readonly totalTrasDescuentos: DineroCentavos;
}

export const aplicarReglasDescuento = (
  contexto: ContextoAplicacion,
  reglas: readonly ReglaDescuento[]
): ResultadoDescuento => {
  const descuentoTotal = reglas
    .filter((regla) => esAplicable(regla, contexto))
    .reduce(
      (acumulado, regla) =>
        acumulado + calcularDescuento(regla, contexto),
      0n
    );

  const descuentoLimitado =
    descuentoTotal > contexto.subtotal
      ? contexto.subtotal
      : descuentoTotal;

  return Object.freeze({
    subtotal: contexto.subtotal,
    descuentoTotal: descuentoLimitado,
    totalTrasDescuentos:
      contexto.subtotal - descuentoLimitado,
  });
};
