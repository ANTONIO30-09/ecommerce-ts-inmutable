/**
 * devoluciones.ts — Motor de Devoluciones y Generación de Notas de Crédito
 * Módulo 3 · Facturación
 *
 * Principios Funcionales Estrictos:
 *   ✓ 100% Funcional Puro: Solo `const`, sin `let`, sin bucles imperativos `for`/`while`
 *   ✓ Estructuras congeladas e inmutables (`Object.freeze`)
 *   ✓ Aritmética de precisión exacta con `bigint` (centavos)
 *   ✓ Sin mutación de facturas ni notas de crédito previas
 */

import type {
  Invoice,
  CreditNote,
  CreditNoteItem,
  ReturnRequest,
  ReturnRequestItem,
  Centavos,
  InvoiceItem,
} from './types';
import { resolveDiscountProration } from './prorrateo';

/**
 * Generador determinista/puro de IDs
 */
export const generateId = (prefix: string = 'CN'): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

/**
 * Procesa una solicitud de devolución y emite una Nota de Crédito inmutable.
 *
 * @param invoice - Factura original sobre la cual se realiza la devolución
 * @param returnRequest - Solicitud de devolución con los productos y cantidades
 * @param previousCreditNotes - Historial de notas de crédito emitidas previamente
 * @param issuedAt - Marca de tiempo ISO opcional (por defecto la fecha actual)
 * @returns Nota de Crédito congelada
 */
export const processReturn = (
  invoice: Invoice,
  returnRequest: ReturnRequest,
  previousCreditNotes: ReadonlyArray<CreditNote>,
  issuedAt: string = new Date().toISOString()
): CreditNote => {
  if (invoice.status !== 'EMITIDA' && invoice.status !== 'PAGADA') {
    throw new Error('La factura no es elegible para devolución.');
  }

  // 1. Calcular mapa de cantidades ya devueltas por producto funcionalmente
  const previouslyReturnedQuantities: Readonly<Record<string, number>> = previousCreditNotes.reduce(
    (acc, cn) =>
      cn.items.reduce(
        (subAcc, cnItem) => ({
          ...subAcc,
          [cnItem.productId]: (subAcc[cnItem.productId] ?? 0) + cnItem.quantity,
        }),
        acc
      ),
    {} as Record<string, number>
  );

  // 2. Calcular total de descuentos ya prorrateados funcionalmente
  const previouslyProratedDiscountTotal: Centavos = previousCreditNotes.reduce(
    (sum, cn) => sum + cn.items.reduce((itemSum, item) => itemSum + item.proratedDiscount, 0n),
    0n
  );

  // 3. Total de unidades de producto devueltas en el historial
  const totalItemsReturnedSoFar: number = previousCreditNotes.reduce(
    (sum, cn) => sum + cn.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  // 4. Validar existencia y stock disponible de cada ítem a devolver
  returnRequest.items.forEach((reqItem: ReturnRequestItem) => {
    const invoiceItem = invoice.items.find((i: InvoiceItem) => i.productId === reqItem.productId);
    if (!invoiceItem) {
      throw new Error(`Ítem ${reqItem.productId} no encontrado en la factura.`);
    }

    const previouslyReturnedQty: number = previouslyReturnedQuantities[reqItem.productId] ?? 0;
    const availableQty: number = invoiceItem.quantity - previouslyReturnedQty;

    if (reqItem.quantity <= 0) {
      throw new Error(`Cantidad a devolver de ${reqItem.productId} debe ser mayor a 0.`);
    }

    if (reqItem.quantity > availableQty) {
      throw new Error(`Cantidad a devolver de ${reqItem.productId} excede el límite permitido.`);
    }
  });

  const totalInvoiceItems: number = invoice.items.reduce(
    (sum: number, item: InvoiceItem) => sum + item.quantity,
    0
  );

  const currentReturnItemsCount: number = returnRequest.items.reduce(
    (sum: number, reqItem: ReturnRequestItem) => sum + reqItem.quantity,
    0
  );

  const isFinalReturn: boolean =
    (totalItemsReturnedSoFar + currentReturnItemsCount) === totalInvoiceItems;

  // 5. Reducción funcional para construir los CreditNoteItems preservando el acumulador del descuento
  interface AccCalculo {
    readonly items: ReadonlyArray<CreditNoteItem>;
    readonly totalRefund: Centavos;
    readonly runningDiscount: Centavos;
  }

  const initialAcc: AccCalculo = Object.freeze({
    items: Object.freeze([]),
    totalRefund: 0n,
    runningDiscount: previouslyProratedDiscountTotal,
  });

  const calculationResult = returnRequest.items.reduce<AccCalculo>(
    (acc: AccCalculo, reqItem: ReturnRequestItem, index: number): AccCalculo => {
      const invoiceItem = invoice.items.find((i: InvoiceItem) => i.productId === reqItem.productId)!;
      const returnSubtotal: Centavos = invoiceItem.unitPrice * BigInt(reqItem.quantity);
      
      const isVeryLastItem: boolean =
        isFinalReturn && (index === returnRequest.items.length - 1);

      const proratedDiscount: Centavos = resolveDiscountProration(
        returnSubtotal,
        invoice.globalDiscount,
        invoice.subtotal,
        isVeryLastItem,
        acc.runningDiscount
      );

      const refundAmount: Centavos = returnSubtotal - proratedDiscount;

      const newItem: CreditNoteItem = Object.freeze({
        productId: reqItem.productId,
        quantity: reqItem.quantity,
        unitPrice: invoiceItem.unitPrice,
        subtotal: returnSubtotal,
        proratedDiscount,
        refundAmount,
        condition: reqItem.condition,
      });

      return Object.freeze({
        items: Object.freeze([...acc.items, newItem]),
        totalRefund: acc.totalRefund + refundAmount,
        runningDiscount: acc.runningDiscount + proratedDiscount,
      });
    },
    initialAcc
  );

  return Object.freeze({
    id: generateId('NC'),
    invoiceId: invoice.id,
    items: calculationResult.items,
    totalRefund: calculationResult.totalRefund,
    issuedAt,
  });
};
