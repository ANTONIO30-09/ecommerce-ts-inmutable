/**
 * ============================================================================
 * MÓDULO 2 — MOTOR DE PRECIOS
 *
 * RF2.1 — Cálculo del subtotal
 *
 * Principios:
 * - Función pura.
 * - Inmutabilidad.
 * - Dinero representado mediante bigint.
 * - Reducción funcional mediante reduce.
 * ============================================================================
 */

import { Carrito } from "../../../modulo-1-dominio-inmutable/src/carrito/carrito.js";

export type DineroCentavos = bigint;

/**
 * Calcula el importe correspondiente a una línea del carrito.
 *
 * precio unitario × cantidad
 */
export const calcularSubtotalItem = (
  precioUnitario: DineroCentavos,
  cantidad: number
): DineroCentavos => {
  return precioUnitario * BigInt(cantidad);
};

/**
 * Calcula el subtotal completo del carrito.
 *
 * La función no modifica el carrito original.
 */
export const calcularSubtotal = (
  carrito: Carrito
): DineroCentavos => {
  return carrito.items.reduce(
    (subtotal, item) =>
      subtotal +
      calcularSubtotalItem(
        item.precioUnitario,
        item.cantidad
      ),
    0n
  );
};