/**
 * prorrateo.ts — Motor de Prorrateo del Descuento
 * Módulo 3 · Facturación · Persona 2
 *
 * Implementación funcional pura e inmutable.
 *
 * ESTRATEGIA MATEMÁTICA CON bigint:
 * Para evitar pérdida de precisión al dividir, se utiliza la fórmula:
 *
 *   descuentoProrrateado = (descuentoGlobal × precioProducto) / subtotal
 *
 * Multiplicando primero y dividiendo después se mantienen los centavos exactos.
 * El redondeo financiero (ROUND_HALF_UP) se implementa inspeccionando el residuo:
 *   si (residuo × 2 ≥ denominador) → incrementar en 1n
 *
 * Restricciones del proyecto:
 *   ✓ Solo const — prohibido let, for, while
 *   ✓ Object.freeze() en todos los objetos devueltos
 *   ✓ Solo bigint para montos (prohibido number para dinero)
 *   ✓ Funciones puras sin efectos secundarios
 */

import type {
  Centavos,
  Factura,
  DetalleFactura,
  ProporcionFraccion,
  ResultadoProrrateo,
} from "./types";

// =============================================================================
// FUNCIONES MATEMÁTICAS PURAS
// =============================================================================

/**
 * Calcula la proporción de un producto respecto al subtotal de la factura.
 * Devuelve la fracción exacta en bigint para evitar divisiones prematuras.
 *
 * @param precioProducto - Precio unitario del producto (en centavos)
 * @param subtotal       - Subtotal de la factura antes del descuento (en centavos)
 * @returns ProporcionFraccion inmutable { numerador, denominador }
 */
const calcularProporcion = (
  precioProducto: Centavos,
  subtotal: Centavos,
): ProporcionFraccion => {
  if (precioProducto < 0n)
    throw new RangeError("El precio del producto no puede ser negativo.");
  if (subtotal <= 0n)
    throw new RangeError("El subtotal debe ser mayor que 0.");
  if (precioProducto > subtotal)
    throw new RangeError("El precio del producto no puede ser mayor que el subtotal.");

  return Object.freeze<ProporcionFraccion>({ numerador: precioProducto, denominador: subtotal });
};

/**
 * Calcula el descuento correspondiente al producto usando su proporción.
 * Aplica ROUND_HALF_UP inspeccionando el residuo de la división entera.
 *
 * Fórmula: (descuentoGlobal × proporcion.numerador) / proporcion.denominador
 *
 * @param descuentoGlobal - Descuento total de la factura (en centavos)
 * @param proporcion      - Fracción precio/subtotal
 * @returns Centavos: descuento prorrateado redondeado
 */
const prorratearDescuento = (
  descuentoGlobal: Centavos,
  proporcion: ProporcionFraccion,
): Centavos => {
  if (descuentoGlobal < 0n)
    throw new RangeError("El descuento global no puede ser negativo.");

  // Multiplicar primero para preservar precisión total antes de la división
  const numeradorTotal: Centavos = descuentoGlobal * proporcion.numerador;
  const cociente: Centavos       = numeradorTotal / proporcion.denominador;
  const residuo: Centavos        = numeradorTotal % proporcion.denominador;

  // ROUND_HALF_UP: si el residuo es ≥ la mitad del denominador → redondear arriba
  return residuo * 2n >= proporcion.denominador ? cociente + 1n : cociente;
};

/**
 * Calcula el reembolso neto al cliente restando el descuento prorrateado.
 *
 * Fórmula: reembolsoNeto = precioProducto - descuentoProrrateado
 *
 * @param precioProducto       - Precio del producto (en centavos)
 * @param descuentoProrrateado - Porción del descuento asignada (en centavos)
 * @returns Centavos: monto neto a devolver
 */
const calcularReembolsoNeto = (
  precioProducto: Centavos,
  descuentoProrrateado: Centavos,
): Centavos => {
  if (precioProducto < 0n)
    throw new RangeError("El precio del producto no puede ser negativo.");
  if (descuentoProrrateado < 0n)
    throw new RangeError("El descuento prorrateado no puede ser negativo.");

  const reembolso: Centavos = precioProducto - descuentoProrrateado;

  if (reembolso < 0n)
    throw new RangeError("El reembolso neto no puede ser negativo.");

  return reembolso;
};

// =============================================================================
// FUNCIÓN ORQUESTADORA (montos directos)
// =============================================================================

/**
 * Ejecuta el flujo completo de prorrateo dados los montos directamente.
 *
 * @param precioProducto  - Precio del producto (en centavos)
 * @param subtotal        - Subtotal de la factura (en centavos)
 * @param descuentoGlobal - Descuento global de la factura (en centavos)
 * @returns ResultadoProrrateo inmutable con todos los valores calculados
 */
const calcularProrrateoProducto = (
  precioProducto: Centavos,
  subtotal: Centavos,
  descuentoGlobal: Centavos,
): ResultadoProrrateo => {
  if (descuentoGlobal < 0n)
    throw new RangeError("El descuento global no puede ser negativo.");
  if (descuentoGlobal > subtotal)
    throw new RangeError("El descuento no puede ser mayor que el subtotal.");

  const proporcion           = calcularProporcion(precioProducto, subtotal);
  const descuentoProrrateado = prorratearDescuento(descuentoGlobal, proporcion);
  const reembolsoNeto        = calcularReembolsoNeto(precioProducto, descuentoProrrateado);

  return Object.freeze<ResultadoProrrateo>({
    precioProducto,
    subtotal,
    descuentoGlobal,
    proporcion,
    descuentoProrrateado,
    reembolsoNeto,
  });
};

// =============================================================================
// FUNCIÓN ORQUESTADORA (desde modelo Factura)
// =============================================================================

/**
 * Busca funcionalmente el detalle de un producto dentro de una factura.
 * Devuelve undefined si no pertenece (sin mutación, sin bucles imperativos).
 */
const buscarDetalleEnFactura = (
  factura: Factura,
  productoId: number,
): DetalleFactura | undefined =>
  factura.detalles.find((detalle) => detalle.productoId === productoId);

/**
 * Calcula el prorrateo extrayendo los datos directamente del modelo Factura.
 * La función no muta la factura ni ningún objeto interno.
 *
 * @param factura    - Documento de factura inmutable
 * @param productoId - ID del producto a devolver
 * @returns ResultadoProrrateo inmutable
 */
const calcularProrrateoDesdeFactura = (
  factura: Factura,
  productoId: number,
): ResultadoProrrateo => {
  const detalle = buscarDetalleEnFactura(factura, productoId);

  if (detalle === undefined)
    throw new Error(
      `El producto con ID ${productoId} no pertenece a la factura con ID ${factura.id}.`,
    );

  return calcularProrrateoProducto(
    detalle.precioUnitario,
    factura.subtotal,
    factura.descuentoGlobal,
  );
};

// =============================================================================
// UTILIDADES DE FORMATO (sin lógica de negocio)
// =============================================================================

/**
 * Convierte centavos en bigint a string con formato de moneda legible.
 * Ejemplo: 4500n → "$45.00"
 */
const centavosAString = (centavos: Centavos): string => {
  const signo    = centavos < 0n ? "-" : "";
  const absoluto = centavos < 0n ? -centavos : centavos;
  const entero   = absoluto / 100n;
  const decimal  = (absoluto % 100n).toString().padStart(2, "0");
  return `${signo}$${entero}.${decimal}`;
};

export {
  calcularProporcion,
  prorratearDescuento,
  calcularReembolsoNeto,
  calcularProrrateoProducto,
  calcularProrrateoDesdeFactura,
  centavosAString,
};
