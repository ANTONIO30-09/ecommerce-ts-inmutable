/**
 * calculos.ts — Funciones puras de cálculo contable y sellado criptográfico
 * Módulo 3 · Facturación
 *
 * Principios:
 *   ✓ 100% Funcional Puro: sin variables mutables, sin bucles imperativos
 *   ✓ Precisión monetaria exacta usando DineroDecimal
 *   ✓ Sellado criptográfico SHA-256 para integridad de la factura
 */

import { createHash } from "crypto";
import { DineroDecimal } from "./decimal";
import type { FacturaItem, TotalesFactura } from "./models";

export function calcularLineaItem(params: {
    id: string;
    codigoProducto: string;
    descripcion: string;
    cantidad: string | number | DineroDecimal;
    precioUnitario: string | number | DineroDecimal;
    tasaDescuento?: string | number | DineroDecimal;
    tasaIva?: string | number | DineroDecimal;
}): FacturaItem {
    const cantidad = DineroDecimal.desde(params.cantidad);
    const precioUnitario = DineroDecimal.desde(params.precioUnitario);
    const tasaDescuento = params.tasaDescuento !== undefined ? DineroDecimal.desde(params.tasaDescuento) : DineroDecimal.cero();
    const tasaIva = params.tasaIva !== undefined ? DineroDecimal.desde(params.tasaIva) : DineroDecimal.desde("0.16");

    const subtotalBruto = precioUnitario.multiplicar(cantidad.valor);
    const montoDescuento = subtotalBruto.aplicarTasa(tasaDescuento);
    const baseImponible = subtotalBruto.restar(montoDescuento);
    const montoIva = baseImponible.aplicarTasa(tasaIva);
    const totalLinea = baseImponible.sumar(montoIva);

    return Object.freeze({
        id: params.id,
        codigoProducto: params.codigoProducto,
        descripcion: params.descripcion,
        cantidad,
        precioUnitario,
        tasaDescuento,
        tasaIva,
        subtotalBruto,
        montoDescuento,
        baseImponible,
        montoIva,
        totalLinea,
    });
}

export function calcularTotales(items: ReadonlyArray<FacturaItem>): TotalesFactura {
    const totales = items.reduce(
        (acc, item) => ({
            subtotalBruto: acc.subtotalBruto.sumar(item.subtotalBruto),
            totalDescuentos: acc.totalDescuentos.sumar(item.montoDescuento),
            baseImponible: acc.baseImponible.sumar(item.baseImponible),
            totalIva: acc.totalIva.sumar(item.montoIva),
            totalPagar: acc.totalPagar.sumar(item.totalLinea),
        }),
        {
            subtotalBruto: DineroDecimal.cero(),
            totalDescuentos: DineroDecimal.cero(),
            baseImponible: DineroDecimal.cero(),
            totalIva: DineroDecimal.cero(),
            totalPagar: DineroDecimal.cero(),
        }
    );

    return Object.freeze(totales);
}

export function calcularHashIntegridad(params: {
    folio: string;
    fechaEmision: string;
    rfcCliente: string;
    totalPagar: string;
    items: ReadonlyArray<FacturaItem>;
    estado: string;
    version: number;
}): string {
    const itemsCadena = params.items
        .map((item) => `${item.codigoProducto}:${item.cantidad.valor}:${item.precioUnitario.valor}:${item.totalLinea.valor};`)
        .join("");
    const cadena = `${params.folio}|${params.fechaEmision}|${params.rfcCliente}|${params.totalPagar}|${params.estado}|${params.version}|${itemsCadena}`;
    return createHash("sha256").update(cadena, "utf8").digest("hex");
}
