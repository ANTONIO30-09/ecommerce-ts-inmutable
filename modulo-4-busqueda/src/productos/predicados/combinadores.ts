import type { Predicado } from './predicado';

/**
 * Devuelve true cuando todos los predicados se cumplen.
 */
export const AND_ALL = <T>(
  ...predicados: ReadonlyArray<Predicado<T>>
): Predicado<T> =>
  (elemento: T): boolean =>
    predicados.every(
      (predicado: Predicado<T>): boolean => predicado(elemento)
    );

/**
 * Devuelve true cuando al menos un predicado se cumple.
 */
export const OR_ANY = <T>(
  ...predicados: ReadonlyArray<Predicado<T>>
): Predicado<T> =>
  (elemento: T): boolean =>
    predicados.some(
      (predicado: Predicado<T>): boolean => predicado(elemento)
    );

/**
 * Invierte el resultado de un predicado.
 */
export const NOT = <T>(
  predicado: Predicado<T>
): Predicado<T> =>
  (elemento: T): boolean =>
    !predicado(elemento);