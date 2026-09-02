/**
 * prorrateo.test.ts — Suite de Pruebas Unitarias del Motor de Prorrateo
 * Módulo 3 · Facturación · Persona 2
 *
 * Compatible con Vitest (recomendado) y Jest.
 * Todos los montos están en CENTAVOS como bigint.
 * Convención: $50.00 = 5000n | $150.00 = 15000n | $15.00 = 1500n
 */

import { describe, it, expect } from "vitest";

import {
  calcularProporcion,
  prorratearDescuento,
  calcularReembolsoNeto,
  calcularProrrateoProducto,
  calcularProrrateoDesdeFactura,
  centavosAString,
} from "./prorrateo";

import type { Factura } from "./types";

// =============================================================================
// FIXTURE DE FACTURA INMUTABLE REUTILIZABLE
// =============================================================================

const facturaBase: Factura = Object.freeze({
  id: 1,
  numeroFactura: "FAC-0001",
  subtotal: 15000n,        // $150.00
  descuentoGlobal: 1500n,  // $15.00
  detalles: Object.freeze([
    Object.freeze({ productoId: 5, precioUnitario: 5000n, cantidad: 1 }), // $50.00
    Object.freeze({ productoId: 6, precioUnitario: 10000n, cantidad: 1 }), // $100.00
  ]),
});

// =============================================================================
// 1. calcularProporcion — Fracción inmutable precio/subtotal
// =============================================================================

describe("calcularProporcion", () => {
  it("devuelve la fracción correcta para el caso principal (50/150)", () => {
    const prop = calcularProporcion(5000n, 15000n);
    expect(prop.numerador).toBe(5000n);
    expect(prop.denominador).toBe(15000n);
  });

  it("acepta precio igual a subtotal (proporción = 1)", () => {
    const prop = calcularProporcion(10000n, 10000n);
    expect(prop.numerador).toBe(10000n);
    expect(prop.denominador).toBe(10000n);
  });

  it("acepta precio de 1 centavo sobre subtotal grande", () => {
    const prop = calcularProporcion(1n, 10000n);
    expect(prop.numerador).toBe(1n);
    expect(prop.denominador).toBe(10000n);
  });

  it("lanza RangeError si el precio es negativo", () => {
    expect(() => calcularProporcion(-1n, 10000n)).toThrowError(
      "El precio del producto no puede ser negativo."
    );
  });

  it("lanza RangeError si el subtotal es 0", () => {
    expect(() => calcularProporcion(5000n, 0n)).toThrowError(
      "El subtotal debe ser mayor que 0."
    );
  });

  it("lanza RangeError si el precio excede el subtotal", () => {
    expect(() => calcularProporcion(20000n, 10000n)).toThrowError(
      "El precio del producto no puede ser mayor que el subtotal."
    );
  });

  it("devuelve un objeto frozen (inmutable)", () => {
    const prop = calcularProporcion(5000n, 15000n);
    expect(Object.isFrozen(prop)).toBe(true);
  });
});

// =============================================================================
// 2. prorratearDescuento — Aritmética bigint con ROUND_HALF_UP
// =============================================================================

describe("prorratearDescuento", () => {
  it("caso 1 — ejemplo principal: (15·50)/150 = $5.00 (500n)", () => {
    const prop = calcularProporcion(5000n, 15000n);
    expect(prorratearDescuento(1500n, prop)).toBe(500n);
  });

  it("caso 2 — producto representa la mitad: (20·50)/100 = $10.00 (1000n)", () => {
    const prop = calcularProporcion(5000n, 10000n);
    expect(prorratearDescuento(2000n, prop)).toBe(1000n);
  });

  it("caso 3 — producto representa todo: (20·100)/100 = $20.00 (2000n)", () => {
    const prop = calcularProporcion(10000n, 10000n);
    expect(prorratearDescuento(2000n, prop)).toBe(2000n);
  });

  it("caso 4 — descuento cero: cualquier proporción → 0", () => {
    const prop = calcularProporcion(5000n, 10000n);
    expect(prorratearDescuento(0n, prop)).toBe(0n);
  });

  it("caso 5 — valores decimales con ROUND_HALF_UP: (10·33.33)/100 = 333n ($3.33)", () => {
    // precioProducto = $33.33 = 3333n, subtotal = $100 = 10000n, descuento = $10 = 1000n
    // numeradorTotal = 1000 * 3333 = 3333000
    // cociente = 3333000 / 10000 = 333 | residuo = 3000
    // 3000 * 2 = 6000 < 10000 → sin redondeo → 333n
    const prop = calcularProporcion(3333n, 10000n);
    expect(prorratearDescuento(1000n, prop)).toBe(333n);
  });

  it("redondea hacia arriba cuando el residuo es exactamente la mitad (ROUND_HALF_UP)", () => {
    // descuento=1n, precio=1n, subtotal=2n → numeradorTotal=1, cociente=0, residuo=1
    // 1*2 = 2 >= 2 → redondear arriba → 1n
    const prop = calcularProporcion(1n, 2n);
    expect(prorratearDescuento(1n, prop)).toBe(1n);
  });

  it("lanza RangeError si el descuento es negativo", () => {
    const prop = calcularProporcion(5000n, 10000n);
    expect(() => prorratearDescuento(-100n, prop)).toThrowError(
      "El descuento global no puede ser negativo."
    );
  });
});

// =============================================================================
// 3. calcularReembolsoNeto — Sustracción con guardas
// =============================================================================

describe("calcularReembolsoNeto", () => {
  it("caso 1 — $50 - $5 = $45 (4500n)", () => {
    expect(calcularReembolsoNeto(5000n, 500n)).toBe(4500n);
  });

  it("caso 4 — descuento cero: reembolso == precio original", () => {
    expect(calcularReembolsoNeto(5000n, 0n)).toBe(5000n);
  });

  it("caso 3 — precio == descuento: reembolso = 0", () => {
    expect(calcularReembolsoNeto(2000n, 2000n)).toBe(0n);
  });

  it("lanza RangeError si el precio es negativo", () => {
    expect(() => calcularReembolsoNeto(-100n, 0n)).toThrowError(
      "El precio del producto no puede ser negativo."
    );
  });

  it("lanza RangeError si el descuento prorrateado es negativo", () => {
    expect(() => calcularReembolsoNeto(5000n, -100n)).toThrowError(
      "El descuento prorrateado no puede ser negativo."
    );
  });

  it("lanza RangeError si el reembolso resultaría negativo", () => {
    expect(() => calcularReembolsoNeto(1000n, 9999n)).toThrowError(
      "El reembolso neto no puede ser negativo."
    );
  });
});

// =============================================================================
// 4. calcularProrrateoProducto — Orquestador completo con montos directos
// =============================================================================

describe("calcularProrrateoProducto", () => {
  it("caso 1 — resultado principal: 50/150/15 → $5 desc, $45 reembolso", () => {
    const res = calcularProrrateoProducto(5000n, 15000n, 1500n);
    expect(res.descuentoProrrateado).toBe(500n);
    expect(res.reembolsoNeto).toBe(4500n);
    expect(res.precioProducto).toBe(5000n);
    expect(res.subtotal).toBe(15000n);
    expect(res.descuentoGlobal).toBe(1500n);
  });

  it("caso 2 — producto representa la mitad", () => {
    const res = calcularProrrateoProducto(5000n, 10000n, 2000n);
    expect(res.descuentoProrrateado).toBe(1000n);
    expect(res.reembolsoNeto).toBe(4000n);
  });

  it("caso 3 — producto representa todo", () => {
    const res = calcularProrrateoProducto(10000n, 10000n, 2000n);
    expect(res.descuentoProrrateado).toBe(2000n);
    expect(res.reembolsoNeto).toBe(8000n);
  });

  it("caso 4 — descuento cero", () => {
    const res = calcularProrrateoProducto(5000n, 10000n, 0n);
    expect(res.descuentoProrrateado).toBe(0n);
    expect(res.reembolsoNeto).toBe(5000n);
  });

  it("caso 5 — valores decimales: $33.33 / $100 / $10", () => {
    const res = calcularProrrateoProducto(3333n, 10000n, 1000n);
    expect(res.descuentoProrrateado).toBe(333n);
    expect(res.reembolsoNeto).toBe(3000n); // $30.00
  });

  it("caso 6 — subtotal cero lanza RangeError", () => {
    expect(() => calcularProrrateoProducto(5000n, 0n, 1000n)).toThrowError(
      "El subtotal debe ser mayor que 0."
    );
  });

  it("caso 7 — precio negativo lanza RangeError", () => {
    expect(() => calcularProrrateoProducto(-1n, 10000n, 1000n)).toThrowError(
      "El precio del producto no puede ser negativo."
    );
  });

  it("caso 8 — descuento negativo lanza RangeError", () => {
    expect(() => calcularProrrateoProducto(5000n, 10000n, -1n)).toThrowError(
      "El descuento global no puede ser negativo."
    );
  });

  it("caso 9 — descuento mayor que subtotal lanza RangeError", () => {
    expect(() => calcularProrrateoProducto(5000n, 10000n, 15000n)).toThrowError(
      "El descuento no puede ser mayor que el subtotal."
    );
  });

  it("caso 10 — producto igual al subtotal", () => {
    // $75.50 producto en factura de $75.50, descuento $15.50
    const res = calcularProrrateoProducto(7550n, 7550n, 1550n);
    expect(res.descuentoProrrateado).toBe(1550n);
    expect(res.reembolsoNeto).toBe(6000n); // $60.00
  });

  it("caso 11 — producto mínimo ($0.01 = 1n)", () => {
    // (1000 * 1) / 10000 = 0 residuo=1000 → 1000*2=2000 < 10000 → 0n
    const res = calcularProrrateoProducto(1n, 10000n, 1000n);
    expect(res.descuentoProrrateado).toBe(0n);
    expect(res.reembolsoNeto).toBe(1n);
  });

  it("caso 12 — valores grandes ($999999.99 / $1500000.00 / $50000.00)", () => {
    // precioProducto = 99999999n, subtotal = 150000000n, descuento = 5000000n
    // numeradorTotal = 5000000 * 99999999 = 499999995000000
    // cociente = 499999995000000 / 150000000 = 3333333n
    // residuo  = 499999995000000 % 150000000 = 45000000
    // 45000000 * 2 = 90000000 < 150000000 → sin redondeo → 3333333n ($33333.33)
    // reembolso = 99999999 - 3333333 = 96666666n ($966666.66)
    const res = calcularProrrateoProducto(99999999n, 150000000n, 5000000n);
    expect(res.descuentoProrrateado).toBe(3333333n);
    expect(res.reembolsoNeto).toBe(96666666n);
  });

  it("devuelve un ResultadoProrrateo congelado (inmutable)", () => {
    const res = calcularProrrateoProducto(5000n, 15000n, 1500n);
    expect(Object.isFrozen(res)).toBe(true);
    expect(Object.isFrozen(res.proporcion)).toBe(true);
  });
});

// =============================================================================
// 5. calcularProrrateoDesdeFactura — Integración con modelo Factura
// =============================================================================

describe("calcularProrrateoDesdeFactura", () => {
  it("calcula correctamente desde el modelo Factura para productoId=5 ($50)", () => {
    const res = calcularProrrateoDesdeFactura(facturaBase, 5);
    expect(res.descuentoProrrateado).toBe(500n);   // $5.00
    expect(res.reembolsoNeto).toBe(4500n);          // $45.00
  });

  it("calcula correctamente para el segundo producto (productoId=6, $100)", () => {
    // proporcion = 10000/15000 = 2/3
    // descuento = (1500 * 10000) / 15000 = 1000n ($10.00)
    // reembolso = 10000 - 1000 = 9000n ($90.00)
    const res = calcularProrrateoDesdeFactura(facturaBase, 6);
    expect(res.descuentoProrrateado).toBe(1000n);
    expect(res.reembolsoNeto).toBe(9000n);
  });

  it("lanza Error si el productoId no pertenece a la factura", () => {
    expect(() => calcularProrrateoDesdeFactura(facturaBase, 99)).toThrowError(
      "El producto con ID 99 no pertenece a la factura con ID 1."
    );
  });

  it("la factura de entrada no es mutada (inmutabilidad verificada)", () => {
    const subtotalOriginal = facturaBase.subtotal;
    calcularProrrateoDesdeFactura(facturaBase, 5);
    expect(facturaBase.subtotal).toBe(subtotalOriginal);
  });
});

// =============================================================================
// 6. centavosAString — Utilidad de formateo
// =============================================================================

describe("centavosAString", () => {
  it("convierte 4500n a '$45.00'", () => {
    expect(centavosAString(4500n)).toBe("$45.00");
  });

  it("convierte 500n a '$5.00'", () => {
    expect(centavosAString(500n)).toBe("$5.00");
  });

  it("convierte 100n a '$1.00'", () => {
    expect(centavosAString(100n)).toBe("$1.00");
  });

  it("convierte 1n a '$0.01'", () => {
    expect(centavosAString(1n)).toBe("$0.01");
  });

  it("convierte 0n a '$0.00'", () => {
    expect(centavosAString(0n)).toBe("$0.00");
  });

  it("convierte 96666666n a '$966666.66'", () => {
    expect(centavosAString(96666666n)).toBe("$966666.66");
  });
});
