/**
 * notaDebito.ts — Lógica Pura y Creación de Notas de Débito
 * Ubicación: modulo-3-facturacion/src/auditoria/notaDebito.ts
 *
 * Reglas de Proyecto:
 *   ✓ Programación Funcional Pura
 *   ✓ Inmutabilidad estricta con Object.freeze
 *   ✓ Manejo de dinero estrictamente con bigint (centavos)
 */

import type { NotaDebito } from './types';

/**
 * Generador puro de ID único para Notas de Débito
 */
export const generarIdNotaDebito = (prefix: string = 'ND'): string =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

/**
 * Función pura que crea y valida una Nota de Débito inmutable y congelada.
 *
 * @param facturaId - ID de la factura a la que se le aplica la nota de débito
 * @param concepto - Razón o detalle del cobro adicional
 * @param monto - Monto en centavos (tipo bigint mayor a 0n)
 * @returns Readonly<NotaDebito> congelada
 */
export const crearNotaDebito = (
    facturaId: string,
    concepto: string,
    monto: bigint
): Readonly<NotaDebito> => {
    if (!facturaId || facturaId.trim() === '') {
        throw new Error('El facturaId es obligatorio para crear una Nota de Débito.');
    }

    if (!concepto || concepto.trim() === '') {
        throw new Error('El concepto es obligatorio para crear una Nota de Débito.');
    }

    if (typeof monto !== 'bigint') {
        throw new Error('El monto de la Nota de Débito debe ser estrictamente de tipo bigint (centavos).');
    }

    if (monto <= 0n) {
        throw new Error('El monto de la Nota de Débito debe ser mayor a 0n centavos.');
    }

    const notaDebito: NotaDebito = {
        id: generarIdNotaDebito(),
        facturaId: facturaId.trim(),
        concepto: concepto.trim(),
        monto,
        fecha: new Date(),
    };

    return Object.freeze(notaDebito);
};
