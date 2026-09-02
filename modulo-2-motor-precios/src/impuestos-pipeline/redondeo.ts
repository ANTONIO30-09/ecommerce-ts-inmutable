export interface Racional {
  readonly numerador: bigint;
  readonly denominador: bigint;
}

export const redondearHalfEven = (
  valor: Racional
): bigint => {
  const { numerador, denominador } = valor;

  if (denominador <= 0n) {
    return 0n;
  }

  const cociente = numerador / denominador;
  const resto = numerador % denominador;
  const dobleResto = resto * 2n;

  if (dobleResto < denominador) {
    return cociente;
  }

  if (dobleResto > denominador) {
    return cociente + 1n;
  }

  return cociente % 2n === 0n
    ? cociente
    : cociente + 1n;
};
