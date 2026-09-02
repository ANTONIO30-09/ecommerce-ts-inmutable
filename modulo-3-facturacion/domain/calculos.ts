import { createHash } from "node:crypto";
import { DineroDecimal } from "./decimal.ts";
import type { FacturaItem, TotalesFactura } from "./models.ts";

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
    let subtotalBruto = DineroDecimal.cero();
    let totalDescuentos = DineroDecimal.cero();
    let baseImponible = DineroDecimal.cero();
    let totalIva = DineroDecimal.cero();
    let totalPagar = DineroDecimal.cero();

    for (const item of items) {
        subtotalBruto = subtotalBruto.sumar(item.subtotalBruto);
        totalDescuentos = totalDescuentos.sumar(item.montoDescuento);
        baseImponible = baseImponible.sumar(item.baseImponible);
        totalIva = totalIva.sumar(item.montoIva);
        totalPagar = totalPagar.sumar(item.totalLinea);
    }

    return Object.freeze({
        subtotalBruto,
        totalDescuentos,
        baseImponible,
        totalIva,
        totalPagar,
    });
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
    let cadena = `${params.folio}|${params.fechaEmision}|${params.rfcCliente}|${params.totalPagar}|${params.estado}|${params.version}|`;
    for (const item of params.items) {
        cadena += `${item.codigoProducto}:${item.cantidad.valor}:${item.precioUnitario.valor}:${item.totalLinea.valor};`;
    }
    return createHash("sha256").update(cadena, "utf8").digest("hex");
}
