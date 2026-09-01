/**
 * Tipo recursivo que bloquea la mutación en todos los niveles de anidamiento en tiempo de compilación (TS).
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends Function
  ? T
  : T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

/**
 * Función pura: Aplica `Object.freeze` recursivamente para bloquear mutaciones en tiempo de ejecución (JS),
 * garantizando la auditabilidad del Event Sourcing.
 */
export const crearInmutable = <T>(datos: T): DeepReadonly<T> => {
  // Caso base: primitivos o nulos ya son inmutables.
  if (datos === null || typeof datos !== 'object') {
    return datos as DeepReadonly<T>;
  }

  // Evita reprocesar objetos ya congelados.
  if (Object.isFrozen(datos)) {
    return datos as DeepReadonly<T>;
  }

  // Recorre y congela propiedades anidadas recursivamente de forma pura.
  Object.keys(datos).reduce((_, key) => {
    const valor = (datos as Record<string, unknown>)[key];
    if (typeof valor === 'object' && valor !== null) {
      crearInmutable(valor);
    }
    return null;
  }, null);

  // Sella el objeto actual bloqueando modificaciones.
  return Object.freeze(datos) as DeepReadonly<T>;
};