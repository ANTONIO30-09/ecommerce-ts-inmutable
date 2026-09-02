/**
 * models.ts — Interfaces y modelos inmutables del dominio de Facturación
 * Módulo 3 · Facturación
 *
 * Principios:
 *   ✓ Inmutabilidad estricta (readonly en todas las interfaces)
 *   ✓ Congelamiento en tiempo de ejecución con Object.freeze
 *   ✓ Transiciones puras de estado contable
 */

import { DineroDecimal } from "./decimal";

export type EstadoFactura = "EMITIDA" | "PAGADA" | "ANULADA";

export interface Cliente {
    readonly id: string;
    readonly nombre: string;
    readonly rfcIdentificacion: string;
    readonly email: string;
    readonly telefono?: string;
    readonly direccion?: string;
}

export interface FacturaItem {
    readonly id: string;
    readonly codigoProducto: string;
    readonly descripcion: string;
    readonly cantidad: DineroDecimal;
    readonly precioUnitario: DineroDecimal;
    readonly tasaDescuento: DineroDecimal;
    readonly tasaIva: DineroDecimal;
    readonly subtotalBruto: DineroDecimal;
    readonly montoDescuento: DineroDecimal;
    readonly baseImponible: DineroDecimal;
    readonly montoIva: DineroDecimal;
    readonly totalLinea: DineroDecimal;
}

export interface TotalesFactura {
    readonly subtotalBruto: DineroDecimal;
    readonly totalDescuentos: DineroDecimal;
    readonly baseImponible: DineroDecimal;
    readonly totalIva: DineroDecimal;
    readonly totalPagar: DineroDecimal;
}

export interface Factura {
    readonly id: string;
    readonly folio: string;
    readonly fechaEmision: string;
    readonly cliente: Cliente;
    readonly items: ReadonlyArray<FacturaItem>;
    readonly totales: TotalesFactura;
    readonly estado: EstadoFactura;
    readonly metodoPago: string;
    readonly moneda: string;
    readonly version: number;
    readonly hashIntegridad: string;
    readonly motivoAnulacion?: string;
}

export function crearCliente(datos: {
    id?: string;
    nombre: string;
    rfcIdentificacion: string;
    email: string;
    telefono?: string;
    direccion?: string;
}): Cliente {
    const cliente: {
        id: string;
        nombre: string;
        rfcIdentificacion: string;
        email: string;
        telefono?: string;
        direccion?: string;
    } = {
        id: datos.id || `CLI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        nombre: datos.nombre.trim(),
        rfcIdentificacion: datos.rfcIdentificacion.trim().toUpperCase(),
        email: datos.email.trim().toLowerCase(),
    };

    if (datos.telefono !== undefined) {
        cliente.telefono = datos.telefono.trim();
    }
    if (datos.direccion !== undefined) {
        cliente.direccion = datos.direccion.trim();
    }

    return Object.freeze(cliente);
}
