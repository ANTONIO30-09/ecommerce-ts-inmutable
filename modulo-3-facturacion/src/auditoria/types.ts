/**
 * types.ts — Definiciones de tipos e interfaces inmutables para Auditoría y Notas de Débito
 * Ubicación: modulo-3-facturacion/src/auditoria/types.ts
 *
 * Reglas de Proyecto:
 *   ✓ Inmutabilidad: 'readonly' en todas las propiedades.
 *   ✓ Financiero: 'bigint' para montos de dinero (centavos).
 */

/**
 * Representa una Nota de Débito inmutable.
 */
export interface NotaDebito {
    readonly id: string;
    readonly facturaId: string;
    readonly concepto: string;
    readonly monto: bigint; // Centavos
    readonly fecha: Date;
}

/**
 * Representa un registro individual e inmutable dentro de la auditoría.
 */
export interface RegistroAuditoria {
    readonly id: string;
    readonly timestamp: Date;
    readonly tipoEvento: string;
    readonly facturaId: string;
    readonly detalle: Record<string, unknown>;
}

/**
 * Contenedor del historial completo de eventos de auditoría.
 */
export interface HistorialAuditoria {
    readonly eventos: readonly RegistroAuditoria[];
}
