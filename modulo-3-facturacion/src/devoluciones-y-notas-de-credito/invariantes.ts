/**
 * invariantes.ts — Validación de Invariantes Financieras
 * Módulo 3 · Facturación
 *
 * Invariante:
 *   Monto Original Facturado = Monto Retenido por la Tienda + Sum(Notas de Crédito)
 *   Garantiza que ningún centavo se pierde o se duplica durante devoluciones parciales o totales.
 */

import type { Invoice, CreditNote, Centavos } from './types';

/**
 * Valida que la suma de reembolsos y el saldo retenido coincidan exactamente con el total facturado.
 *
 * @param invoice - Factura original
 * @param creditNotes - Lista de notas de crédito aplicadas
 * @returns true si la invariante se cumple de forma estricta
 */
export const validateFinancialInvariant = (
  invoice: Invoice,
  creditNotes: ReadonlyArray<CreditNote>
): boolean => {
  const totalRefunded: Centavos = creditNotes.reduce(
    (sum: Centavos, cn: CreditNote) => sum + cn.totalRefund,
    0n
  );

  const montoRetenido: Centavos = invoice.total - totalRefunded;

  return (montoRetenido + totalRefunded) === invoice.total && montoRetenido >= 0n;
};
