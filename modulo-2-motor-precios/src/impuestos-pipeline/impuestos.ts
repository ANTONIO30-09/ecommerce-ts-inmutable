export type DineroCentavos = bigint;

export interface ReglaImpuesto {
  readonly jurisdiccion: string;
  readonly categoria: string;
  readonly tasaEscalada: bigint;
  readonly escala: bigint;
}

export interface ItemFiscal {
  readonly categoria: string;
  readonly baseImponible: DineroCentavos;
}

export const calcularImpuesto = (
  item: ItemFiscal,
  jurisdiccion: string,
  reglas: readonly ReglaImpuesto[]
): bigint =>
  reglas
    .filter(
      (regla) =>
        regla.jurisdiccion === jurisdiccion &&
        regla.categoria === item.categoria
    )
    .reduce(
      (total, regla) =>
        total +
        (item.baseImponible * regla.tasaEscalada) /
          regla.escala,
      0n
    );
