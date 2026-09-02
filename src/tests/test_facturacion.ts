import process from "node:process";
import { DineroDecimal } from "../domain/decimal.ts";
import { crearCliente } from "../domain/models.ts";
import { calcularLineaItem, calcularTotales, calcularHashIntegridad } from "../domain/calculos.ts";
import { emitirFactura, anularFactura, marcarComoPagada, generarDocumentoFacturaTexto } from "../domain/facturacion.ts";

let testsPasados = 0;
let testsFallidos = 0;

function assert(condicion: boolean, mensaje: string) {
    if (condicion) {
        console.log(`  ✓ ${mensaje}`);
        testsPasados++;
    } else {
        console.error(`  ✗ ERROR: ${mensaje}`);
        testsFallidos++;
    }
}

function assertThrows(fn: () => void, mensaje: string) {
    try {
        fn();
        console.error(`  ✗ ERROR: Se esperaba que lanzara error pero no lo hizo: ${mensaje}`);
        testsFallidos++;
    } catch (e) {
        console.log(`  ✓ ${mensaje}`);
        testsPasados++;
    }
}

console.log("[1] Pruebas de Precisión Monetaria y Redondeo Decimal:");
const d1 = DineroDecimal.desde("0.10");
const d2 = DineroDecimal.desde("0.20");
const suma = d1.sumar(d2);
assert(suma.valor === "0.30", "Suma exacta sin error float (0.10 + 0.20 = 0.30)");

const r1 = DineroDecimal.desde("12.345");
assert(r1.valor === "12.35", "Redondeo contable ROUND_HALF_UP (.345 -> .35)");

const r2 = DineroDecimal.desde("12.344");
assert(r2.valor === "12.34", "Redondeo contable ROUND_HALF_UP (.344 -> .34)");

console.log("\n[2] Pruebas de Cálculos de Partidas:");
const item1 = calcularLineaItem({
    id: "ITM-01",
    codigoProducto: "SRV-CLOUD",
    descripcion: "Suscripción Cloud Anual",
    cantidad: 2,
    precioUnitario: "150.00",
    tasaDescuento: "0.10",
    tasaIva: "0.16",
});

assert(item1.subtotalBruto.valor === "300.00", "Subtotal bruto exacto (2 * 150.00 = 300.00)");
assert(item1.montoDescuento.valor === "30.00", "Descuento 10% exacto (30.00)");
assert(item1.baseImponible.valor === "270.00", "Base imponible exacta (300.00 - 30.00 = 270.00)");
assert(item1.montoIva.valor === "43.20", "Monto IVA 16% exacto (270 * 0.16 = 43.20)");
assert(item1.totalLinea.valor === "313.20", "Total línea exacto (270 + 43.20 = 313.20)");

console.log("\n[3] Pruebas de Inmutabilidad Estricta:");
const cliente = crearCliente({
    nombre: "Tech Global Corp",
    rfcIdentificacion: "TGC200101XYZ",
    email: "facturas@techglobal.io",
    direccion: "Av. Financiera 100",
});

const factura = emitirFactura({
    cliente,
    items: [item1],
    folio: "FAC-2026-0001",
});

assert(Object.isFrozen(factura), "El objeto Factura está congelado con Object.freeze");
assert(Object.isFrozen(factura.items), "El array de items está congelado");
assert(Object.isFrozen(factura.totales), "El objeto Totales está congelado");
assert(Object.isFrozen(cliente), "El objeto Cliente está congelado");

assertThrows(() => {
    // @ts-ignore
    factura.estado = "ANULADA";
}, "Intentar mutar directamente factura.estado falla en tiempo de ejecución");

assertThrows(() => {
    // @ts-ignore
    factura.totales = null;
}, "Intentar mutar directamente factura.totales falla en tiempo de ejecución");

console.log("\n[4] Pruebas de Transición de Estados (ESTADO ANTERIOR -> ESTADO NUEVO):");
const motivo = "Cancelación por devolución parcial de servicio";
const facturaAnulada = anularFactura(factura, motivo);

assert(factura.estado === "EMITIDA", "La factura original PERMANECE INTACTA en estado EMITIDA");
assert(factura.version === 1, "La factura original mantiene versión 1");
assert(factura.motivoAnulacion === undefined, "La factura original no tiene motivo");

assert(facturaAnulada.estado === "ANULADA", "La nueva factura tiene estado ANULADA");
assert(facturaAnulada.version === 2, "La nueva factura tiene versión incrementada a 2");
assert(facturaAnulada.motivoAnulacion === motivo, "La nueva factura contiene el motivo");
assert(facturaAnulada.hashIntegridad !== factura.hashIntegridad, "El hash criptográfico se recalculó con la nueva versión");
assert(factura !== facturaAnulada, "Son referencias de memoria distintas");

const facturaPagada = marcarComoPagada(factura);
assert(facturaPagada.estado === "PAGADA", "Marcado como pagada genera nueva versión PAGADA");
assert(factura.estado === "EMITIDA", "Factura original continúa en EMITIDA");

console.log("\n[5] Pruebas de Generación del Documento Impreso:");
const docTexto = generarDocumentoFacturaTexto(factura);
assert(docTexto.includes("FAC-2026-0001"), "El documento generado incluye el Folio");
assert(docTexto.includes("TGC200101XYZ"), "El documento incluye el RFC");
assert(docTexto.includes("300.00"), "El documento incluye el importe de partida");
assert(docTexto.includes(factura.hashIntegridad), "El documento incluye el Sello Digital SHA-256");

console.log(`\nResultado: ${testsPasados} pruebas pasadas, ${testsFallidos} fallidas.\n`);

if (testsFallidos > 0) {
    process.exit(1);
}
