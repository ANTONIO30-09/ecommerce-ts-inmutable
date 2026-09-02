import { randomUUID } from "node:crypto";
import { DineroDecimal } from "./decimal.ts";
import type { Cliente, Factura, FacturaItem, EstadoFactura } from "./models.ts";
import { calcularTotales, calcularHashIntegridad } from "./calculos.ts";

export function emitirFactura(params: {
    cliente: Cliente;
    items: ReadonlyArray<FacturaItem>;
    folio: string;
    metodoPago?: string;
    moneda?: string;
    idFactura?: string;
    fechaEmision?: string;
}): Factura {
    if (!params.items || params.items.length === 0) {
        throw new Error("La factura debe contener al menos una partida de producto o servicio.");
    }

    const id = params.idFactura || randomUUID();
    const fechaEmision = params.fechaEmision || new Date().toISOString().replace("T", " ").substring(0, 10);
    const metodoPago = params.metodoPago || "Transferencia Electrónica";
    const moneda = params.moneda || "Bs.";
    const estado: EstadoFactura = "EMITIDA";
    const version = 1;

    const totales = calcularTotales(params.items);

    const hashIntegridad = calcularHashIntegridad({
        folio: params.folio,
        fechaEmision,
        rfcCliente: params.cliente.rfcIdentificacion,
        totalPagar: totales.totalPagar.valor,
        items: params.items,
        estado,
        version,
    });

    return Object.freeze({
        id,
        folio: params.folio,
        fechaEmision,
        cliente: params.cliente,
        items: Object.freeze([...params.items]),
        totales,
        estado,
        metodoPago,
        moneda,
        version,
        hashIntegridad,
    });
}

export function anularFactura(facturaAnterior: Factura, motivo: string): Factura {
    if (facturaAnterior.estado === "ANULADA") {
        throw new Error("La factura ya se encuentra en estado ANULADA.");
    }

    const nuevaVersion = facturaAnterior.version + 1;
    const nuevoEstado: EstadoFactura = "ANULADA";
    const motivoLimpio = motivo.trim() || "Anulación solicitada";

    const nuevoHash = calcularHashIntegridad({
        folio: facturaAnterior.folio,
        fechaEmision: facturaAnterior.fechaEmision,
        rfcCliente: facturaAnterior.cliente.rfcIdentificacion,
        totalPagar: facturaAnterior.totales.totalPagar.valor,
        items: facturaAnterior.items,
        estado: nuevoEstado,
        version: nuevaVersion,
    });

    return Object.freeze({
        ...facturaAnterior,
        estado: nuevoEstado,
        motivoAnulacion: motivoLimpio,
        version: nuevaVersion,
        hashIntegridad: nuevoHash,
    });
}

export function marcarComoPagada(facturaAnterior: Factura): Factura {
    if (facturaAnterior.estado === "ANULADA") {
        throw new Error("No es posible marcar como pagada una factura anulada.");
    }
    if (facturaAnterior.estado === "PAGADA") {
        return facturaAnterior;
    }

    const nuevaVersion = facturaAnterior.version + 1;
    const nuevoEstado: EstadoFactura = "PAGADA";

    const nuevoHash = calcularHashIntegridad({
        folio: facturaAnterior.folio,
        fechaEmision: facturaAnterior.fechaEmision,
        rfcCliente: facturaAnterior.cliente.rfcIdentificacion,
        totalPagar: facturaAnterior.totales.totalPagar.valor,
        items: facturaAnterior.items,
        estado: nuevoEstado,
        version: nuevaVersion,
    });

    return Object.freeze({
        ...facturaAnterior,
        estado: nuevoEstado,
        version: nuevaVersion,
        hashIntegridad: nuevoHash,
    });
}

export function generarDocumentoFacturaTexto(factura: Factura): string {
    const W = 88;
    const bordeSuperior = "┌" + "─".repeat(W - 2) + "┐";
    const bordeInferior = "└" + "─".repeat(W - 2) + "┘";
    const lineaDivisoria = "├" + "─".repeat(W - 2) + "┤";

    const pad = (texto: string, len: number) => texto.padEnd(len).substring(0, len);
    const padIzq = (texto: string, len: number) => texto.padStart(len);
    const m = factura.moneda;

    let doc = "";
    doc += `${bordeSuperior}\n`;
    doc += `│ ${pad("Nombre de su compañía", 54)}${padIzq("FACTURA", 30)} │\n`;
    doc += `│ ${pad("Lema de su compañía", 54)}${padIzq("", 30)} │\n`;
    doc += `│ ${pad("Dirección", 44)}${padIzq(`FECHA:   ${factura.fechaEmision}`, 40)} │\n`;
    doc += `│ ${pad("Ciudad, Código postal", 44)}${padIzq(`FACTURA: ${factura.folio}`, 40)} │\n`;
    doc += `│ ${pad("Teléfono (503) 555-0190  Fax (503) 555-0191", 44)}${padIzq(`ESTADO:  [ ${factura.estado} v${factura.version} ]`, 40)} │\n`;
    doc += `│ ${pad("", 84)} │\n`;

    doc += `│ ${pad("FACTURAR A:", 44)}${pad("POR: Descripción del proyecto o servicio", 40)} │\n`;
    doc += `│ ${pad(`Nombre:     ${factura.cliente.nombre}`, 84)} │\n`;
    doc += `│ ${pad(`Compañía:   ${factura.cliente.nombre}`, 84)} │\n`;
    doc += `│ ${pad(`Dirección:  ${factura.cliente.direccion || "Ciudad, Código postal"}`, 84)} │\n`;
    doc += `│ ${pad(`Teléfono:   ${factura.cliente.telefono || "(503) 555-0190"}`, 84)} │\n`;
    doc += `│ ${pad(`RFC / ID:   ${factura.cliente.rfcIdentificacion}`, 84)} │\n`;
    doc += `${lineaDivisoria}\n`;

    doc += `│ ${pad("DESCRIPCIÓN", 44)}│ ${pad("HORAS", 8)}│ ${pad("TASA", 12)}│ ${padIzq("CANTIDAD", 16)} │\n`;
    doc += `${lineaDivisoria}\n`;

    for (const item of factura.items) {
        const desc = pad(item.descripcion, 44);
        const cant = pad(item.cantidad.valor, 8);
        const tasa = pad(`${m} ${item.precioUnitario.valor}`, 12);
        const total = padIzq(`${m} ${item.subtotalBruto.valor}`, 16);
        doc += `│ ${desc}│ ${cant}│ ${tasa}│ ${total} │\n`;
    }

    doc += `${lineaDivisoria}\n`;
    doc += `│ ${pad("", 48)} SUBTOTAL:          │ ${padIzq(`${m} ${factura.totales.subtotalBruto.valor}`, 19)} │\n`;
    doc += `│ ${pad("", 48)} TIPO IMPOSITIVO:   │ ${padIzq("16%", 19)} │\n`;
    doc += `│ ${pad("", 48)} IMPUESTO S/ VENTAS:│ ${padIzq(`${m} ${factura.totales.totalIva.valor}`, 19)} │\n`;
    doc += `│ ${pad("", 48)} OTROS:             │ ${padIzq(`-${m} ${factura.totales.totalDescuentos.valor}`, 19)} │\n`;
    doc += `│ ${pad("", 48)} TOTAL:             │ ${padIzq(`${m} ${factura.totales.totalPagar.valor}`, 19)} │\n`;
    doc += `${lineaDivisoria}\n`;

    doc += `│ ${pad("Extienda todos los cheques pagaderos a Nombre de su compañía", 84)} │\n`;
    doc += `│ ${pad("Total a pagar en 15 días. Las cantidades vencidas tendrán un cargo de 1% por mes.", 84)} │\n`;
    doc += `│ Sello SHA-256: ${pad(factura.hashIntegridad, 69)} │\n`;
    doc += `${bordeInferior}\n`;

    return doc;
}
