
export type Predicado<T> = (item: T) => boolean;

export const AND_ALL = <T>(...predicados: ReadonlyArray<Predicado<T>>): Predicado<T> =>
  (item: T) => predicados.every((p) => p(item));

export const OR_ANY = <T>(...predicados: ReadonlyArray<Predicado<T>>): Predicado<T> =>
  (item: T) => predicados.some((p) => p(item));

export const NOT = <T>(predicado: Predicado<T>): Predicado<T> =>
  (item: T) => !predicado(item);