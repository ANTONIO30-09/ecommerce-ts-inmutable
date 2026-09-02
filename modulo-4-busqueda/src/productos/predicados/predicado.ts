/**
 * Representa una condición que recibe un elemento de tipo T
 * y devuelve verdadero o falso.
 */
export type Predicado<T> = (elemento: T) => boolean;