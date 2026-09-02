/**
 * types.ts — Interfaces inmutables del Motor de Prorrateo
 * Módulo 3 · Facturación · Persona 2
 *
 * Todos los montos monetarios se representan en CENTAVOS como bigint
 * para garantizar aritmética exacta sin errores de punto flotante.
 * Ejemplo: $50.00 → 5000n | $150.00 → 15000n
 */

/** Alias semántico: centavos representados como bigint */
export type Centavos = bigint;

/** Producto del catálogo */
export interface Producto {
  readonly id: number;
  readonly nombre: string;
  readonly precio: Centavos;
}

/** Renglón de un producto dentro de una factura */
export interface DetalleFactura {
  readonly productoId: number;
  readonly precioUnitario: Centavos; // precio vigente al momento de la compra
  readonly cantidad: number;
}

/** Documento de venta con descuento global */
export interface Factura {
  readonly id: number;
  readonly numeroFactura: string;
  readonly subtotal: Centavos;
  readonly descuentoGlobal: Centavos;
  readonly detalles: readonly DetalleFactura[];
}

/**
 * Fracción inmutable que representa precio/subtotal sin pérdida de precisión.
 * Se mantiene como fracción exacta en lugar de un decimal aproximado.
 */
export interface ProporcionFraccion {
  readonly numerador: Centavos;   // = precioProducto
  readonly denominador: Centavos; // = subtotal
}

/** Resultado completo e inmutable del cálculo de prorrateo */
export interface ResultadoProrrateo {
  readonly precioProducto: Centavos;
  readonly subtotal: Centavos;
  readonly descuentoGlobal: Centavos;
  readonly proporcion: ProporcionFraccion;
  readonly descuentoProrrateado: Centavos;
  readonly reembolsoNeto: Centavos;
}
