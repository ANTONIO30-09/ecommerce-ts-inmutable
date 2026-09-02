export type DineroCentavos = bigint;

export type Resultado<T, E> =
  | Readonly<{ ok: true; valor: T }>
  | Readonly<{ ok: false; error: E }>;

export type ErrorCupon =
  | "CUPON_NO_VIGENTE"
  | "LIMITE_DE_USOS_ALCANZADO"
  | "COMPRA_MINIMA_NO_ALCANZADA";

export interface Cupon {
  readonly codigo: string;
  readonly vigente: boolean;
  readonly usosActuales: number;
  readonly limiteUsos: number;
  readonly compraMinima: DineroCentavos;
  readonly tipo: "MONTO_FIJO" | "PORCENTAJE";
  readonly valor: bigint;
}

export const validarCupon = (
  cupon: Cupon,
  total: DineroCentavos
): Resultado<Cupon, ErrorCupon> => {
  if (!cupon.vigente) {
    return Object.freeze({ ok: false, error: "CUPON_NO_VIGENTE" });
  }

  if (cupon.usosActuales >= cupon.limiteUsos) {
    return Object.freeze({
      ok: false,
      error: "LIMITE_DE_USOS_ALCANZADO",
    });
  }

  if (total < cupon.compraMinima) {
    return Object.freeze({
      ok: false,
      error: "COMPRA_MINIMA_NO_ALCANZADA",
    });
  }

  return Object.freeze({ ok: true, valor: cupon });
};

export const aplicarCupon = (
  total: DineroCentavos,
  cupon: Cupon
): Resultado<DineroCentavos, ErrorCupon> => {
  const validacion = validarCupon(cupon, total);

  if (!validacion.ok) {
    return validacion;
  }

  const descuento =
    cupon.tipo === "MONTO_FIJO"
      ? cupon.valor
      : (total * cupon.valor) / 100n;

  const descuentoLimitado =
    descuento > total ? total : descuento;

  return Object.freeze({
    ok: true,
    valor: total - descuentoLimitado,
  });
};
