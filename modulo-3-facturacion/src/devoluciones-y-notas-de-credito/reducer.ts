/**
 * reducer.ts — Reducer de Event Sourcing para Facturación y Devoluciones
 * Módulo 3 · Facturación
 *
 * Principio:
 *   El estado actual es el resultado de reducir la secuencia histórica de eventos de dominio (foldLeft).
 *   Ningún estado se sobreescribe ni muta.
 */

import type { BillingState, DomainEvent } from './types';

export const initialBillingState: BillingState = Object.freeze({
  invoices: Object.freeze({}),
  returnRequests: Object.freeze([]),
  creditNotes: Object.freeze([]),
});

/**
 * Reduce un evento de dominio produciendo una nueva versión congelada del estado.
 */
export const billingReducer = (
  state: BillingState = initialBillingState,
  event: DomainEvent
): BillingState => {
  switch (event.type) {
    case 'InvoiceIssued':
      return Object.freeze({
        ...state,
        invoices: Object.freeze({
          ...state.invoices,
          [event.payload.id]: event.payload,
        }),
      });

    case 'ReturnRequested':
      return Object.freeze({
        ...state,
        returnRequests: Object.freeze([...state.returnRequests, event.payload]),
      });

    case 'CreditNoteIssued':
      return state;

    default:
      return state;
  }
};
