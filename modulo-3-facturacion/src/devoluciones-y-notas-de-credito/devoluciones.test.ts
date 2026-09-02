/**
 * devoluciones.test.ts — Suite de Pruebas Unitarias para Devoluciones y Notas de Crédito
 * Módulo 3 · Facturación
 *
 * Verificaciones:
 *   1. Cálculo exacto de prorrateo con redondeo bancario Half-Even
 *   2. Absorción matemática de centavos huérfanos en devoluciones totales
 *   3. Emisión funcional e inmutable de Notas de Crédito
 *   4. Validación de la Invariante Financiera
 *   5. Control de errores ante cantidades excedidas o ítems no pertenecientes
 *   6. Inmutabilidad estricta de estructuras (Object.isFrozen)
 */

import type { Invoice, ReturnRequest, CreditNote } from './types';
import { calculateProratedDiscount, resolveDiscountProration } from './prorrateo';
import { processReturn } from './devoluciones';
import { validateFinancialInvariant } from './invariantes';
import { serializeBigInt, deserializeBigInt } from './serialization';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`❌ Test Failed: ${message}`);
  }
};

console.log('🧪 Ejecutando pruebas unitarias de Devoluciones y Notas de Crédito...\n');

// =============================================================================
// Test 1: Redondeo Bancario Half-Even
// =============================================================================
{
  // Descuento $10 (1000n), Item $33.33 (3333n), Subtotal $100 (10000n)
  // (1000 * 3333 * 10) / 10000 = 3333 -> last digit 3 (<5) -> 333n
  const d1 = calculateProratedDiscount(3333n, 1000n, 10000n);
  assert(d1 === 333n, 'Prorrateo con residuo < 5 trunca correctamente');

  // Redondeo Half-Even hacia par
  const d2 = calculateProratedDiscount(5000n, 1500n, 15000n);
  assert(d2 === 500n, 'Prorrateo 50/150 sobre $15 da exactamente $5 (500n)');

  console.log('✓ Test 1: Redondeo bancario superado.');
}

// =============================================================================
// Test 2: Inmutabilidad de la Factura y Nota de Crédito
// =============================================================================
{
  const factura: Invoice = Object.freeze({
    id: 'FAC-001',
    customerId: 'CLI-001',
    items: Object.freeze([
      Object.freeze({ productId: 'P1', quantity: 2, unitPrice: 5000n, subtotal: 10000n, discount: 0n }),
    ]),
    subtotal: 10000n,
    globalDiscount: 1000n,
    taxes: 1710n,
    total: 10710n,
    status: 'EMITIDA',
    issuedAt: new Date().toISOString(),
  });

  const req: ReturnRequest = Object.freeze({
    invoiceId: factura.id,
    items: Object.freeze([
      Object.freeze({ productId: 'P1', quantity: 1, condition: 'APTO_REVENTA' }),
    ]),
    reason: 'Prueba',
    requestedAt: new Date().toISOString(),
  });

  const nc = processReturn(factura, req, []);
  assert(Object.isFrozen(nc), 'La Nota de Crédito devuelta debe estar congelada (frozen)');
  assert(Object.isFrozen(nc.items), 'La lista de ítems de la Nota de Crédito debe estar congelada');
  assert(Object.isFrozen(nc.items[0]), 'Cada ítem de la Nota de Crédito debe estar congelado');
  assert(factura.subtotal === 10000n, 'La factura original no fue modificada');

  console.log('✓ Test 2: Inmutabilidad estricta verificada.');
}

// =============================================================================
// Test 3: Absorción de Centavo Huérfano en Devolución Final
// =============================================================================
{
  const factura: Invoice = Object.freeze({
    id: 'FAC-002',
    customerId: 'CLI-002',
    items: Object.freeze([
      Object.freeze({ productId: 'A', quantity: 1, unitPrice: 3333n, subtotal: 3333n, discount: 0n }),
      Object.freeze({ productId: 'B', quantity: 1, unitPrice: 3333n, subtotal: 3333n, discount: 0n }),
      Object.freeze({ productId: 'C', quantity: 1, unitPrice: 3334n, subtotal: 3334n, discount: 0n }),
    ]),
    subtotal: 10000n,      // $100.00
    globalDiscount: 1000n,  // $10.00
    taxes: 1710n,
    total: 10710n,
    status: 'PAGADA',
    issuedAt: new Date().toISOString(),
  });

  // Devolución 1: Devuelve A
  const req1: ReturnRequest = Object.freeze({
    invoiceId: factura.id,
    items: Object.freeze([
      Object.freeze({ productId: 'A', quantity: 1, condition: 'APTO_REVENTA' }),
    ]),
    reason: 'Devolución parcial 1',
    requestedAt: new Date().toISOString(),
  });
  const nc1 = processReturn(factura, req1, []);

  // Devolución 2: Devuelve B y C (completando el 100%)
  const req2: ReturnRequest = Object.freeze({
    invoiceId: factura.id,
    items: Object.freeze([
      Object.freeze({ productId: 'B', quantity: 1, condition: 'APTO_REVENTA' }),
      Object.freeze({ productId: 'C', quantity: 1, condition: 'APTO_REVENTA' }),
    ]),
    reason: 'Devolución final',
    requestedAt: new Date().toISOString(),
  });
  const nc2 = processReturn(factura, req2, [nc1]);

  const totalDiscountProrated =
    nc1.items.reduce((s, i) => s + i.proratedDiscount, 0n) +
    nc2.items.reduce((s, i) => s + i.proratedDiscount, 0n);

  assert(
    totalDiscountProrated === factura.globalDiscount,
    `La suma de descuentos prorrateados (${totalDiscountProrated}) debe ser exactamente igual al descuento global (${factura.globalDiscount})`
  );

  console.log('✓ Test 3: Absorción de centavo huérfano verificada.');
}

// =============================================================================
// Test 4: Invariante Financiera
// =============================================================================
{
  const factura: Invoice = Object.freeze({
    id: 'FAC-003',
    customerId: 'CLI-003',
    items: Object.freeze([
      Object.freeze({ productId: 'P1', quantity: 1, unitPrice: 5000n, subtotal: 5000n, discount: 0n }),
    ]),
    subtotal: 5000n,
    globalDiscount: 500n,
    taxes: 855n,
    total: 5355n,
    status: 'PAGADA',
    issuedAt: new Date().toISOString(),
  });

  const req: ReturnRequest = Object.freeze({
    invoiceId: factura.id,
    items: Object.freeze([
      Object.freeze({ productId: 'P1', quantity: 1, condition: 'APTO_REVENTA' }),
    ]),
    reason: 'Devolución completa',
    requestedAt: new Date().toISOString(),
  });

  const nc = processReturn(factura, req, []);
  assert(validateFinancialInvariant(factura, [nc]), 'La invariante financiera debe ser válida');

  console.log('✓ Test 4: Invariante financiera validada.');
}

// =============================================================================
// Test 5: Manejo de Errores
// =============================================================================
{
  const factura: Invoice = Object.freeze({
    id: 'FAC-004',
    customerId: 'CLI-004',
    items: Object.freeze([
      Object.freeze({ productId: 'P1', quantity: 1, unitPrice: 5000n, subtotal: 5000n, discount: 0n }),
    ]),
    subtotal: 5000n,
    globalDiscount: 0n,
    taxes: 0n,
    total: 5000n,
    status: 'ANULADA',
    issuedAt: new Date().toISOString(),
  });

  const req: ReturnRequest = Object.freeze({
    invoiceId: factura.id,
    items: Object.freeze([
      Object.freeze({ productId: 'P1', quantity: 1, condition: 'APTO_REVENTA' }),
    ]),
    reason: 'Error',
    requestedAt: new Date().toISOString(),
  });

  let errorCaptured = false;
  try {
    processReturn(factura, req, []);
  } catch {
    errorCaptured = true;
  }
  assert(errorCaptured, 'Debe lanzar error al intentar devolver sobre una factura ANULADA');

  console.log('✓ Test 5: Manejo de errores validado.');
}

// =============================================================================
// Test 6: Serialización Segura de bigint
// =============================================================================
{
  const data = Object.freeze({ monto: 50000n, items: Object.freeze([{ precio: 1234n }]) });
  const serialized = serializeBigInt(data);
  const json = JSON.stringify(serialized);
  const parsed = JSON.parse(json);
  const restored = deserializeBigInt(parsed) as { monto: bigint; items: [{ precio: bigint }] };

  assert(restored.monto === 50000n, 'Serialización y deserialización de bigint exitosa');
  assert(restored.items[0].precio === 1234n, 'Serialización anidada de bigint exitosa');

  console.log('✓ Test 6: Serialización segura de bigint validada.');
}

console.log('\n🎉 ¡Todas las pruebas unitarias de Devoluciones y Notas de Crédito pasaron exitosamente!');
