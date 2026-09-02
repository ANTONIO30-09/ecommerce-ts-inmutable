/**
 * serialization.ts — Serialización y Deserialización Segura para bigint
 * Módulo 3 · Facturación
 *
 * Convierte estructuras con bigint a JSON y viceversa sin mutación ni errores de tipo TypeError.
 */

export const serializeBigInt = (obj: unknown): unknown => {
  if (typeof obj === 'bigint') {
    return `${obj.toString()}n`;
  }
  if (Array.isArray(obj)) {
    return Object.freeze(obj.map(serializeBigInt));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.freeze(
      Object.entries(obj).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: serializeBigInt(value),
      }), {})
    );
  }
  return obj;
};

export const deserializeBigInt = (obj: unknown): unknown => {
  if (typeof obj === 'string' && /^-?\d+n$/.test(obj)) {
    return BigInt(obj.slice(0, -1));
  }
  if (Array.isArray(obj)) {
    return Object.freeze(obj.map(deserializeBigInt));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.freeze(
      Object.entries(obj).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: deserializeBigInt(value),
      }), {})
    );
  }
  return obj;
};
