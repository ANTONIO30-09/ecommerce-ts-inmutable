/**
 * types.ts — Definiciones de tipos inmutables para Devoluciones y Notas de Crédito
 * Módulo 3 · Facturación
 *
 * Lineamientos del proyecto:
 *   ✓ Inmutabilidad estricta (readonly, Object.freeze)
 *   ✓ Sin flotantes para dinero (solo bigint centavos)
 *   ✓ Modelado de eventos para Event Sourcing
 */

export type Centavos = bigint;

export type InvoiceStatus = 'EMITIDA' | 'PAGADA' | 'ANULADA';

export interface InvoiceItem {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: Centavos; // En centavos
  readonly subtotal: Centavos;  // quantity * unitPrice
  readonly discount: Centavos;  // Descuento asignado
}

export interface Invoice {
  readonly id: string;
  readonly customerId: string;
  readonly items: ReadonlyArray<InvoiceItem>;
  readonly subtotal: Centavos;       // Suma de subtotales
  readonly globalDiscount: Centavos; // Descuento global aplicado
  readonly taxes: Centavos;          // Impuestos calculados
  readonly total: Centavos;          // subtotal - globalDiscount + taxes
  readonly status: InvoiceStatus;
  readonly issuedAt: string;         // ISO date string
}

export type ReturnItemCondition = 'APTO_REVENTA' | 'DEFECTUOSO';

export interface ReturnRequestItem {
  readonly productId: string;
  readonly quantity: number;
  readonly condition: ReturnItemCondition;
}

export interface ReturnRequest {
  readonly invoiceId: string;
  readonly items: ReadonlyArray<ReturnRequestItem>;
  readonly reason: string;
  readonly requestedAt: string; // ISO date string
}

export interface CreditNoteItem {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: Centavos;
  readonly subtotal: Centavos;
  readonly proratedDiscount: Centavos;
  readonly refundAmount: Centavos; // subtotal - proratedDiscount
  readonly condition: ReturnItemCondition;
}

export interface CreditNote {
  readonly id: string;
  readonly invoiceId: string;
  readonly items: ReadonlyArray<CreditNoteItem>;
  readonly totalRefund: Centavos;
  readonly issuedAt: string; // ISO date string
}

export interface DebitNote {
  readonly id: string;
  readonly invoiceId: string;
  readonly amount: Centavos;
  readonly reason: string;
  readonly issuedAt: string;
}

export type EventType = 
  | 'InvoiceIssued'
  | 'ReturnRequested'
  | 'CreditNoteIssued'
  | 'DebitNoteIssued';

export interface BaseEvent {
  readonly id: string;
  readonly type: EventType;
  readonly timestamp: string;
}

export interface InvoiceIssued extends BaseEvent {
  readonly type: 'InvoiceIssued';
  readonly payload: Invoice;
}

export interface ReturnRequested extends BaseEvent {
  readonly type: 'ReturnRequested';
  readonly payload: ReturnRequest;
}

export interface CreditNoteIssued extends BaseEvent {
  readonly type: 'CreditNoteIssued';
  readonly payload: {
    readonly creditNoteId: string;
    readonly invoiceId: string;
    readonly totalRefund: Centavos;
    readonly items: ReadonlyArray<{
      readonly productId: string;
      readonly quantity: number;
      readonly condition: ReturnItemCondition;
    }>;
  };
}

export type DomainEvent = InvoiceIssued | ReturnRequested | CreditNoteIssued;

export interface BillingState {
  readonly invoices: Readonly<Record<string, Invoice>>;
  readonly returnRequests: ReadonlyArray<ReturnRequest>;
  readonly creditNotes: ReadonlyArray<CreditNote>;
}
