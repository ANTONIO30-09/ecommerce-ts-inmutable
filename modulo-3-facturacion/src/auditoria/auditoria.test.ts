/**
 * auditoria.test.ts — Pruebas Unitarias del Submódulo de Auditoría y Notas de Débito
 * Ubicación: modulo-3-facturacion/src/auditoria/auditoria.test.ts
 *
 * Verificaciones:
 *   ✓ Inmutabilidad (Object.isFrozen) en objetos y arrays
 *   ✓ Validación de montos estrictamente en bigint (centavos > 0n)
 *   ✓ Preservación del historial previo sin mutación (Event Sourcing)
 *   ✓ Filtrado correcto por facturaId
 *   ✓ Generación de resumen de trazabilidad del ciclo de vida
 */

import { crearNotaDebito } from './notaDebito';
import {
    crearHistorialVacio,
    registrarEvento,
    obtenerTrazabilidadFactura,
    resumenTrazabilidad,
} from './auditoria';

const assert = (condition: boolean, message: string): void => {
    if (!condition) {
        throw new Error(` Test Failed: ${message}`);
    }
};

console.log('Ejecutando pruebas unitarias del submódulo auditoria/...\n');

// =========================================================================
// Test 1: Inmutabilidad y validación de montos bigint en crearNotaDebito
// =========================================================================
{
    const facturaId = 'FAC-2026-101';
    const concepto = 'Gastos de gestión de cobro';
    const monto = 3500n; // $35.00 en centavos

    const nota = crearNotaDebito(facturaId, concepto, monto);

    // 1. Inmutabilidad y congelamiento
    assert(Object.isFrozen(nota), 'La NotaDebito debe estar congelada (frozen)');

    // 2. Verificación de propiedades y tipo bigint
    assert(nota.facturaId === facturaId, 'facturaId coincide');
    assert(nota.concepto === concepto, 'concepto coincide');
    assert(nota.monto === 3500n, 'monto coincide');
    assert(typeof nota.monto === 'bigint', 'monto es de tipo bigint');
    assert(nota.fecha instanceof Date, 'fecha es instancia de Date');
    assert(typeof nota.id === 'string' && nota.id.length > 0, 'id es un string no vacío');

    // 3. Validar rechazo de monto igual a 0n
    let errorCapturado = false;
    try {
        crearNotaDebito(facturaId, concepto, 0n);
    } catch {
        errorCapturado = true;
    }
    assert(errorCapturado, 'Debe lanzar error si el monto es 0n');

    // 4. Validar rechazo de monto negativo
    errorCapturado = false;
    try {
        crearNotaDebito(facturaId, concepto, -500n);
    } catch {
        errorCapturado = true;
    }
    assert(errorCapturado, 'Debe lanzar error si el monto es negativo');

    // 5. Validar rechazo de tipos no-bigint
    errorCapturado = false;
    try {
        crearNotaDebito(facturaId, concepto, 1000 as unknown as bigint);
    } catch {
        errorCapturado = true;
    }
    assert(errorCapturado, 'Debe lanzar error si el monto no es bigint');

    console.log('✓ Test 1: Inmutabilidad y validaciones de crearNotaDebito superadas.');
}

// =========================================================================
// Test 2: Inmutabilidad de la historia en registrarEvento
// =========================================================================
{
    const h0 = crearHistorialVacio();

    assert(Object.isFrozen(h0), 'Historial inicial debe estar congelado');
    assert(Object.isFrozen(h0.eventos), 'Array de eventos inicial debe estar congelado');
    assert(h0.eventos.length === 0, 'Historial inicial tiene 0 eventos');

    const evento1 = {
        tipoEvento: 'Factura Creada',
        facturaId: 'FAC-001',
        detalle: { cliente: 'Cliente A', subtotal: 10000n },
    };

    const h1 = registrarEvento(h0, evento1);

    // El historial inicial NO debió cambiar
    assert(h0.eventos.length === 0, 'El historial inicial h0 no debió cambiar');
    assert(h1 !== h0, 'h1 es una nueva referencia de objeto');
    assert(h1.eventos.length === 1, 'h1 contiene 1 evento');

    // Instancia y array de eventos congelados
    assert(Object.isFrozen(h1), 'h1 está congelado');
    assert(Object.isFrozen(h1.eventos), 'h1.eventos está congelado');

    const primerEvento = h1.eventos[0];
    assert(primerEvento !== undefined, 'El primer evento debe existir');
    if (primerEvento) {
        assert(Object.isFrozen(primerEvento), 'h1.eventos[0] está congelado');
        assert(Object.isFrozen(primerEvento.detalle), 'h1.eventos[0].detalle está congelado');
    }

    const evento2 = {
        tipoEvento: 'Nota Débito',
        facturaId: 'FAC-001',
        detalle: { monto: 1200n, concepto: 'Recargo' },
    };

    const h2 = registrarEvento(h1, evento2);

    assert(h1.eventos.length === 1, 'h1 no fue modificado');
    assert(h2.eventos.length === 2, 'h2 contiene 2 eventos');
    assert(Object.isFrozen(h2), 'h2 está congelado');

    console.log('✓ Test 2: Inmutabilidad de registrarEvento superada.');
}

// =========================================================================
// Test 3: Filtrado de trazabilidad por facturaId en obtenerTrazabilidadFactura
// =========================================================================
{
    const h0 = crearHistorialVacio();

    const h1 = registrarEvento(h0, {
        tipoEvento: 'Factura Creada',
        facturaId: 'FAC-A',
        detalle: { total: 5000n },
    });

    const h2 = registrarEvento(h1, {
        tipoEvento: 'Factura Creada',
        facturaId: 'FAC-B',
        detalle: { total: 7500n },
    });

    const h3 = registrarEvento(h2, {
        tipoEvento: 'Prorrateo',
        facturaId: 'FAC-A',
        detalle: { descuento: 500n },
    });

    const h4 = registrarEvento(h3, {
        tipoEvento: 'Nota Débito',
        facturaId: 'FAC-A',
        detalle: { recargo: 300n },
    });

    const trazabilidadA = obtenerTrazabilidadFactura(h4, 'FAC-A');
    assert(Object.isFrozen(trazabilidadA), 'Lista filtrada está congelada');
    assert(trazabilidadA.length === 3, 'FAC-A tiene exactamente 3 eventos');
    assert(trazabilidadA.every((reg) => reg.facturaId === 'FAC-A'), 'Todos los eventos corresponden a FAC-A');

    const trazabilidadB = obtenerTrazabilidadFactura(h4, 'FAC-B');
    assert(trazabilidadB.length === 1, 'FAC-B tiene 1 evento');
    assert(trazabilidadB[0]?.facturaId === 'FAC-B', 'Evento corresponde a FAC-B');

    const trazabilidadC = obtenerTrazabilidadFactura(h4, 'FAC-C');
    assert(trazabilidadC.length === 0, 'Factura inexistente retorna 0 eventos');
    assert(Object.isFrozen(trazabilidadC), 'Array vacío retornado está congelado');

    console.log('✓ Test 3: Filtrado de trazabilidad por facturaId superado.');
}

// =========================================================================
// Test 4: Generación de resumen de trazabilidad del ciclo de vida
// =========================================================================
{
    const h0 = crearHistorialVacio();

    const h1 = registrarEvento(h0, {
        tipoEvento: 'Factura Creada',
        facturaId: 'FAC-CYCLE',
        detalle: { total: 15000n },
    });

    const h2 = registrarEvento(h1, {
        tipoEvento: 'Prorrateo',
        facturaId: 'FAC-CYCLE',
        detalle: { descuento: 1500n },
    });

    const h3 = registrarEvento(h2, {
        tipoEvento: 'Devolución/Nota Crédito',
        facturaId: 'FAC-CYCLE',
        detalle: { reembolso: 4500n },
    });

    const h4 = registrarEvento(h3, {
        tipoEvento: 'Nota Débito',
        facturaId: 'FAC-CYCLE',
        detalle: { monto: 800n },
    });

    const resumen = resumenTrazabilidad(h4, 'FAC-CYCLE');
    assert(resumen.includes('FAC-CYCLE'), 'El resumen contiene el facturaId');
    assert(resumen.includes('Factura Creada'), 'El resumen contiene el evento Factura Creada');
    assert(resumen.includes('Prorrateo'), 'El resumen contiene el evento Prorrateo');
    assert(resumen.includes('Devolución/Nota Crédito'), 'El resumen contiene el evento Devolución');
    assert(resumen.includes('Nota Débito'), 'El resumen contiene el evento Nota Débito');

    console.log('Test 4: Generación de resumen de trazabilidad superada.');
}

console.log('¡Todas las pruebas unitarias del submódulo auditoria/ se ejecutaron exitosamente!');
