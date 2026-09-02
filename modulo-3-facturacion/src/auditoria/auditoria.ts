/**
 * auditoria.ts — Motor de Auditoría Inmutable y Event Sourcing
 * Ubicación: modulo-3-facturacion/src/auditoria/auditoria.ts
 *
 * Reglas de Proyecto:
 *   ✓ Inmutabilidad de Historia (no modifiación/eliminación de eventos)
 *   ✓ Programación Funcional Pura (.map, .filter, .reduce, spread operators, sin let)
 *   ✓ Retornos congelados con Object.freeze
 */

import type { HistorialAuditoria, RegistroAuditoria } from './types';


/**
 * Generador puro de ID para registros de auditoría
 */
export const generarIdRegistroAuditoria = (prefix: string = 'AUD'): string =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

/**
 * Crea una nueva instancia vacía e inmutable de HistorialAuditoria.
 *
 * @returns Readonly<HistorialAuditoria> congelado con 0 eventos.
 */
export const crearHistorialVacio = (): Readonly<HistorialAuditoria> =>
    Object.freeze({
        eventos: Object.freeze([]),
    });

/**
 * Función pura que agrega un nuevo evento al historial de auditoría
 * produciendo un nuevo estado congelado sin mutar el historial previo.
 *
 * @param historial - Historial de auditoría previo inmutable
 * @param evento - Datos del evento a registrar (sin id ni timestamp)
 * @returns Nuevo HistorialAuditoria congelado
 */
export const registrarEvento = (
    historial: Readonly<HistorialAuditoria>,
    evento: Omit<RegistroAuditoria, 'id' | 'timestamp'>
): Readonly<HistorialAuditoria> => {
    if (!evento.tipoEvento || evento.tipoEvento.trim() === '') {
        throw new Error('El tipoEvento es obligatorio para registrar un evento de auditoría.');
    }

    if (!evento.facturaId || evento.facturaId.trim() === '') {
        throw new Error('El facturaId es obligatorio para registrar un evento de auditoría.');
    }

    const nuevoRegistro: RegistroAuditoria = Object.freeze({
        id: generarIdRegistroAuditoria(),
        timestamp: new Date(),
        tipoEvento: evento.tipoEvento.trim(),
        facturaId: evento.facturaId.trim(),
        detalle: Object.freeze({ ...(evento.detalle ?? {}) }),
    });

    const nuevosEventos = Object.freeze([...historial.eventos, nuevoRegistro]);

    return Object.freeze({
        eventos: nuevosEventos,
    });
};

/**
 * Obtiene la secuencia de registros de auditoría asociados a un facturaId específico
 * mediante programación funcional pura (.filter).
 *
 * @param historial - Historial de auditoría
 * @param facturaId - Identificador de la factura a filtrar
 * @returns Array congelado con los registros de la factura
 */
export const obtenerTrazabilidadFactura = (
    historial: Readonly<HistorialAuditoria>,
    facturaId: string
): readonly RegistroAuditoria[] => {
    if (!facturaId) return Object.freeze([]);

    const eventosFactura = historial.eventos.filter(
        (registro) => registro.facturaId === facturaId
    );

    return Object.freeze(eventosFactura);
};

/**
 * Formatea valores de detalle de auditoría manejando bigint de forma segura
 */
const formatearValorDetalle = (valor: unknown): string => {
    if (typeof valor === 'bigint') {
        return `$${(Number(valor) / 100).toFixed(2)} (${valor.toString()}n centavos)`;
    }
    if (typeof valor === 'object' && valor !== null) {
        return JSON.stringify(valor, (_, v) => (typeof v === 'bigint' ? `${v.toString()}n` : v));
    }
    return String(valor);
};

/**
 * Formatea el objeto detalle en texto legible
 */
const formatearDetalleAuditoria = (detalle: Record<string, unknown>): string => {
    const entradas = Object.entries(detalle);
    if (entradas.length === 0) return 'Sin detalle registrado';

    return entradas
        .map(([clave, valor]) => `${clave}: ${formatearValorDetalle(valor)}`)
        .join(', ');
};

/**
 * Genera un resumen narrativo y estructurado del ciclo de vida de la factura.
 * Ejemplo de flujo: Factura Creada -> Prorrateo -> Devolución/Nota Crédito -> Nota Débito.
 *
 * @param historial - Historial de auditoría
 * @param facturaId - Identificador de la factura
 * @returns Cadena explicativa con la trazabilidad completa
 */
export const resumenTrazabilidad = (
    historial: Readonly<HistorialAuditoria>,
    facturaId: string
): string => {
    const trazabilidad = obtenerTrazabilidadFactura(historial, facturaId);

    if (trazabilidad.length === 0) {
        return `No se registraron eventos de auditoría para la factura [${facturaId}].`;
    }

    const titulo = `=== CICLO DE VIDA Y TRAZABILIDAD DE AUDITORÍA (Factura: ${facturaId}) ===\n`;

    const pasos = trazabilidad
        .map((reg, idx) => {
            const fechaISO = reg.timestamp.toISOString();
            const detalleStr = formatearDetalleAuditoria(reg.detalle);
            return `Paso ${idx + 1} [${fechaISO}] - ${reg.tipoEvento} | ${detalleStr}`;
        })
        .join('\n');

    const flujoTipos = trazabilidad.map((r) => r.tipoEvento).join(' -> ');
    const resumenFlujo = `\nSecuencia Histórica: ${flujoTipos}`;

    return `${titulo}${pasos}\n${resumenFlujo}`;
};
