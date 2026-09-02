/**
 * facturacion.test.ts — Pruebas Unitarias del Submódulo de Facturación
 * Ubicación: modulo-3-facturacion/src/facturacion/facturacion.test.ts
 *
 * Verificaciones:
 *   ✓ Precisión monetaria exacta con DineroDecimal y redondeo contable ROUND_HALF_UP
 *   ✓ Cálculos puros de partidas (subtotal bruto, descuento, base imponible, IVA 16%, total)
 *   ✓ Inmutabilidad estricta (Object.isFrozen) y prevención de mutación en runtime
 *   ✓ Transiciones puras de estado contable (EMITIDA -> PAGADA, EMITIDA -> ANULADA)
 *   ✓ Sellado criptográfico SHA-256 e incremento de versión en cada transición
 *   ✓ Generación del documento imprimible
 */

import { DineroDecimal } from "./decimal";
import { crearCliente } from "./models";
import { calcularLineaItem, calcularTotales, calcularHashIntegridad } from "./calculos";
import { emitirFactura, anularFactura, marcarComoPagada, generarDocumentoFacturaTexto } from "./facturacion";

const assert = (condition: boolean, message: string): void => {
    if (!condition) {
        throw new Error(`❌ Test Failed: ${message}`);
    }
};

console.log("🧪 Ejecutando pruebas unitarias del submódulo facturacion/...\n");

// =========================================================================
// Test 1: Precisión Monetaria y Redondeo Decimal (ROUND_HALF_UP)
// =========================================================================
{
    const d1 = DineroDecimal.desde("0.10");
    const d2 = DineroDecimal.desde("0.20");
    const suma = d1.sumar(d2);
    assert(suma.valor === "0.30", "0.10 + 0.20 debe ser exactamente 0.30 sin error IEEE-754");

    // Redondeo ROUND_HALF_UP
    const r1 = DineroDecimal.desde("10.345");
    assert(r1.valor === "10.35", "10.345 debe redondearse a 10.35");

    const r2 = DineroDecimal.desde("10.344");
    assert(r2.valor === "10.34", "10.344 debe redondearse a 10.34");

    // Multiplicación exacta
    const p1 = DineroDecimal.desde("150.00");
    const mult = p1.multiplicar(2);
    assert(mult.valor === "300.00", "150.00 * 2 = 300.00");

    // Conversión a centavos interoperable
    assert(p1.aCentavos() === 15000n, "150.00 son 15000n centavos");

    console.log("✓ Test 1: Precisión monetaria y redondeo contable superados.");
}

// =========================================================================
// Test 2: Cálculos de Partidas y Totales
// =========================================================================
{
    const item1 = calcularLineaItem({
        id: "ITM-1",
        codigoProducto: "PROD-01",
        descripcion: "Laptop Gamer",
        cantidad: 2,
        precioUnitario: "150.00",
        tasaDescuento: "0.10",
        tasaIva: "0.16",
    });

    assert(item1.subtotalBruto.valor === "300.00", "Subtotal bruto: 2 * 150 = 300.00");
    assert(item1.montoDescuento.valor === "30.00", "Descuento 10% de 300 = 30.00");
    assert(item1.baseImponible.valor === "270.00", "Base imponible: 300 - 30 = 270.00");
    assert(item1.montoIva.valor === "43.20", "IVA 16% de 270 = 43.20");
    assert(item1.totalLinea.valor === "313.20", "Total línea: 270 + 43.20 = 313.20");

    const item2 = calcularLineaItem({
        id: "ITM-2",
        codigoProducto: "PROD-02",
        descripcion: "Mouse Inalámbrico",
        cantidad: 1,
        precioUnitario: "50.00",
        tasaDescuento: "0.00",
        tasaIva: "0.16",
    });

    const totales = calcularTotales([item1, item2]);
    assert(totales.subtotalBruto.valor === "350.00", "Subtotal bruto total: 300 + 50 = 350.00");
    assert(totales.totalDescuentos.valor === "30.00", "Total descuentos: 30.00");
    assert(totales.baseImponible.valor === "320.00", "Base imponible total: 270 + 50 = 320.00");
    assert(totales.totalIva.valor === "51.20", "Total IVA: 43.20 + 8.00 = 51.20");
    assert(totales.totalPagar.valor === "371.20", "Total a pagar: 313.20 + 58.00 = 371.20");

    console.log("✓ Test 2: Cálculos de partidas y totales superados.");
}

// =========================================================================
// Test 3: Inmutabilidad Estricta (Object.freeze)
// =========================================================================
{
    const cliente = crearCliente({
        nombre: "Empresa XYZ",
        rfcIdentificacion: "XYZ990101ABC",
        email: "contacto@xyz.com",
    });

    const item = calcularLineaItem({
        id: "ITM-01",
        codigoProducto: "SRV-01",
        descripcion: "Consultoría",
        cantidad: 1,
        precioUnitario: "100.00",
    });

    const factura = emitirFactura({
        cliente,
        items: [item],
        folio: "FAC-001",
    });

    assert(Object.isFrozen(factura), "La Factura debe estar congelada");
    assert(Object.isFrozen(factura.items), "El array de items debe estar congelado");
    assert(Object.isFrozen(factura.totales), "El objeto de totales debe estar congelado");
    assert(Object.isFrozen(factura.cliente), "El cliente debe estar congelado");

    let mutacionFallida = false;
    try {
        (factura as unknown as Record<string, unknown>).estado = "ANULADA";
    } catch {
        mutacionFallida = true;
    }
    // En strict mode o con Object.freeze lanza TypeError o no muta
    assert(factura.estado === "EMITIDA", "factura.estado no debe mutar");

    console.log("✓ Test 3: Inmutabilidad estricta verificada.");
}

// =========================================================================
// Test 4: Transiciones Puras de Estado Contable y Sellado Criptográfico
// =========================================================================
{
    const cliente = crearCliente({
        nombre: "Cliente Corporativo",
        rfcIdentificacion: "CORP12345678",
        email: "corp@mail.com",
    });

    const item = calcularLineaItem({
        id: "ITM-10",
        codigoProducto: "SRV-10",
        descripcion: "Soporte Anual",
        cantidad: 1,
        precioUnitario: "1000.00",
    });

    const facturaOriginal = emitirFactura({
        cliente,
        items: [item],
        folio: "FAC-2026-001",
        moneda: "Bs.",
    });

    assert(facturaOriginal.estado === "EMITIDA", "Estado inicial EMITIDA");
    assert(facturaOriginal.version === 1, "Versión inicial 1");
    assert(facturaOriginal.hashIntegridad.length === 64, "Hash SHA-256 válido");

    // Transición pura: Marcar como pagada
    const facturaPagada = marcarComoPagada(facturaOriginal);

    assert(facturaOriginal.estado === "EMITIDA", "Factura original permanece en EMITIDA");
    assert(facturaOriginal.version === 1, "Factura original mantiene versión 1");
    assert(facturaPagada.estado === "PAGADA", "Nueva factura tiene estado PAGADA");
    assert(facturaPagada.version === 2, "Nueva factura incrementó versión a 2");
    assert(facturaPagada !== facturaOriginal, "Son referencias de memoria distintas");
    assert(facturaPagada.hashIntegridad !== facturaOriginal.hashIntegridad, "Hash recalculado en versión 2");

    // Transición pura: Anular factura emitida
    const facturaAnulada = anularFactura(facturaOriginal, "Error en datos del cliente");

    assert(facturaOriginal.estado === "EMITIDA", "Factura original permanece intacta");
    assert(facturaAnulada.estado === "ANULADA", "Nueva factura está ANULADA");
    assert(facturaAnulada.version === 2, "Versión incrementada a 2");
    assert(facturaAnulada.motivoAnulacion === "Error en datos del cliente", "Motivo registrado");

    // Validar rechazo de pagar factura anulada
    let errorPagarAnulada = false;
    try {
        marcarComoPagada(facturaAnulada);
    } catch {
        errorPagarAnulada = true;
    }
    assert(errorPagarAnulada, "No se puede pagar una factura anulada");

    // Validar rechazo de anular factura ya anulada
    let errorReAnular = false;
    try {
        anularFactura(facturaAnulada, "Re-anular");
    } catch {
        errorReAnular = true;
    }
    assert(errorReAnular, "No se puede anular una factura ya anulada");

    console.log("✓ Test 4: Transiciones de estado y versionado criptográfico superados.");
}

// =========================================================================
// Test 5: Formato de Documento Impreso
// =========================================================================
{
    const cliente = crearCliente({
        nombre: "Juan Pérez",
        rfcIdentificacion: "PEJU800101ABC",
        email: "juan@ejemplo.com",
    });

    const item = calcularLineaItem({
        id: "ITM-01",
        codigoProducto: "SRV-01",
        descripcion: "Desarrollo de Software",
        cantidad: 10,
        precioUnitario: "100.00",
    });

    const factura = emitirFactura({
        cliente,
        items: [item],
        folio: "FOL-100",
    });

    const doc = generarDocumentoFacturaTexto(factura);
    assert(doc.includes("FOL-100"), "El documento incluye el Folio");
    assert(doc.includes("PEJU800101ABC"), "El documento incluye el RFC");
    assert(doc.includes("Sello SHA-256:"), "El documento incluye el sello criptográfico");
    assert(doc.includes(factura.hashIntegridad), "El documento incluye el hash de integridad");

    console.log("✓ Test 5: Generación del documento impreso superada.");
}

console.log("\n🎉 ¡Todas las pruebas unitarias del submódulo facturacion/ pasaron exitosamente!");
