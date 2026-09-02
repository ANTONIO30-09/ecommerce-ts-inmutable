/**
 * demo.ts — Demostración Ejecutable de Devoluciones y Notas de Crédito
 * Módulo 3 · Facturación
 *
 * Ejecutable mediante: npx tsx modulo-3-facturacion/src/devoluciones-y-notas-de-credito/demo.ts
 */

import type { Invoice, ReturnRequest, CreditNote } from './types';
import { processReturn } from './devoluciones';
import { validateFinancialInvariant } from './invariantes';
import { serializeBigInt } from './serialization';

console.log('=================================================================');
console.log('📦 MÓDULO 3: MOTOR DE DEVOLUCIONES Y NOTAS DE CRÉDITO');
console.log('=================================================================\n');

// 1. Factura inmutable emitida
const factura: Invoice = Object.freeze({
  id: 'FAC-2026-001',
  customerId: 'CLI-VIP-777',
  items: Object.freeze([
    Object.freeze({ productId: 'TV-4K', quantity: 2, unitPrice: 50000n, subtotal: 100000n, discount: 0n }),
    Object.freeze({ productId: 'CABLE-HDMI', quantity: 3, unitPrice: 1500n, subtotal: 4500n, discount: 0n }),
  ]),
  subtotal: 104500n,      // $1,045.00
  globalDiscount: 5000n,  // $50.00 de descuento global
  taxes: 18905n,          // 19% IVA sobre base
  total: 118405n,         // $1,184.05
  status: 'PAGADA',
  issuedAt: new Date().toISOString(),
});

console.log('🧾 1. Factura Inmutable de Entrada:');
console.log(JSON.stringify(serializeBigInt(factura), null, 2));

// 2. Primera Devolución Parcial (1 TV y 1 Cable)
console.log('\n-----------------------------------------------------------------');
console.log('🔄 2. Procesando Primera Devolución Parcial (1 TV-4K + 1 CABLE-HDMI)...');

const solicitud1: ReturnRequest = Object.freeze({
  invoiceId: factura.id,
  items: Object.freeze([
    Object.freeze({ productId: 'TV-4K', quantity: 1, condition: 'APTO_REVENTA' }),
    Object.freeze({ productId: 'CABLE-HDMI', quantity: 1, condition: 'DEFECTUOSO' }),
  ]),
  reason: 'Producto defectuoso y cambio de opinión',
  requestedAt: new Date().toISOString(),
});

const notaCredito1: CreditNote = processReturn(factura, solicitud1, []);
console.log('📄 Nota de Crédito 1 Emitida:');
console.log(JSON.stringify(serializeBigInt(notaCredito1), null, 2));

// 3. Segunda Devolución del Resto (1 TV y 2 Cables) - Completa el 100%
console.log('\n-----------------------------------------------------------------');
console.log('🔄 3. Procesando Segunda Devolución (1 TV-4K + 2 CABLE-HDMI) - 100% Completado...');

const solicitud2: ReturnRequest = Object.freeze({
  invoiceId: factura.id,
  items: Object.freeze([
    Object.freeze({ productId: 'TV-4K', quantity: 1, condition: 'APTO_REVENTA' }),
    Object.freeze({ productId: 'CABLE-HDMI', quantity: 2, condition: 'APTO_REVENTA' }),
  ]),
  reason: 'Devolución del total restante',
  requestedAt: new Date().toISOString(),
});

const notaCredito2: CreditNote = processReturn(factura, solicitud2, [notaCredito1]);
console.log('📄 Nota de Crédito 2 Emitida (Absorbiendo centavos huérfanos por resta):');
console.log(JSON.stringify(serializeBigInt(notaCredito2), null, 2));

// 4. Verificación de Invariante Financiera
console.log('\n-----------------------------------------------------------------');
console.log('⚖️ 4. Verificación de Integridad Contable:');
const totalDescuentoProrrateado =
  notaCredito1.items.reduce((s, i) => s + i.proratedDiscount, 0n) +
  notaCredito2.items.reduce((s, i) => s + i.proratedDiscount, 0n);

console.log(`- Descuento Global Factura: ${factura.globalDiscount} centavos`);
console.log(`- Suma Descuentos Notas de Crédito: ${totalDescuentoProrrateado} centavos`);
console.log(`- ¿Cuadra 100% exacto?: ${totalDescuentoProrrateado === factura.globalDiscount ? 'SÍ ✅' : 'NO ❌'}`);

const invarianteValida = validateFinancialInvariant(factura, [notaCredito1, notaCredito2]);
console.log(`- Invariante Financiera: ${invarianteValida ? 'CUMPLIDA ✅' : 'FALLIDA ❌'}`);
console.log('=================================================================\n');
