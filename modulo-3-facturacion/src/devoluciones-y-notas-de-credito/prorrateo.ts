/**
 * prorrateo.ts — Motor de Prorrateo de Descuentos con Redondeo Bancario y Manejo de Centavos Huérfanos
 * Módulo 3 · Facturación
 *
 * Restricciones del proyecto:
 *   ✓ Solo const — prohibido let, for, while
 *   ✓ Inmutabilidad estricta
 *   ✓ Solo bigint para montos financieros (centavos)
 *   ✓ Funciones puras sin efectos secundarios
 */

import type { Centavos } from './types';

/**
 * Calcula el descuento prorrateado para un ítem devuelto usando la fórmula:
 *   Descuento Asignado = (Descuento Global × Subtotal Ítem) / Subtotal Factura Original
 * 
 * Aplica Redondeo Bancario (Half-Even):
 *   Si el primer dígito fraccionario es < 5, trunca hacia abajo.
 *   Si es > 5, redondea hacia arriba (+1).
 *   Si es == 5 exacto, redondea hacia el entero par más cercano.
 */
export const calculateProratedDiscount = (
  itemSubtotal: Centavos,
  globalDiscount: Centavos,
  originalSubtotal: Centavos
): Centavos => {
  if (originalSubtotal === 0n || globalDiscount === 0n || itemSubtotal === 0n) {
    return 0n;
  }

  // Multiplicamos por 10 para inspeccionar el residuo decimal en bigint
  const unroundedProrationTimes10: Centavos = (globalDiscount * itemSubtotal * 10n) / originalSubtotal;
  const lastDigit: number = Number(unroundedProrationTimes10 % 10n);
  const baseValue: Centavos = unroundedProrationTimes10 / 10n;

  if (lastDigit < 5) {
    return baseValue;
  }
  if (lastDigit > 5) {
    return baseValue + 1n;
  }

  // Si termina exactamente en 5 -> Half-Even (redondeo al par más cercano)
  return baseValue % 2n === 0n ? baseValue : baseValue + 1n;
};

/**
 * Resuelve el descuento prorrateado considerando la absorción del residuo impartible (centavo huérfano).
 * 
 * Regla de Oro Financiera:
 * Si es el último ítem de una devolución que completa el 100% de la orden facturada,
 * el descuento se calcula por resta directa para garantizar que:
 *   Sum(Descuentos Prorrateados) === Descuento Global Original
 */
export const resolveDiscountProration = (
  itemSubtotal: Centavos,
  globalDiscount: Centavos,
  originalSubtotal: Centavos,
  isLastItem: boolean,
  previouslyProratedDiscount: Centavos
): Centavos => {
  if (isLastItem) {
    const maxDiscount: Centavos = globalDiscount - previouslyProratedDiscount;
    return maxDiscount > 0n ? maxDiscount : 0n;
  }

  return calculateProratedDiscount(itemSubtotal, globalDiscount, originalSubtotal);
};
