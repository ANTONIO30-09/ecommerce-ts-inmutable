/**
 * ============================================================================
 * MÓDULO 1 — Dominio Inmutable y Estructuras de Datos
 * Entidad: Regla_Descuento
 * Autor: Antonio
 * ----------------------------------------------------------------------------
 * Reto: representar funcionalmente las promociones (Porcentaje, Monto Fijo,
 * 2x1) y su validación (Condición_Aplicación) dentro de estructuras congeladas,
 * sin código imperativo (sin for/while con mutación de variables) ni mutación
 * de ningún objeto tras su creación.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. TIPO DE DINERO SIN PUNTO FLOTANTE
// ----------------------------------------------------------------------------
// Se usa bigint para representar CENTAVOS exactos. Nunca number/float, porque
// el sistema completo (ver Módulo 2 del proyecto) prohíbe imprecisiones de
// coma flotante en cálculos financieros.

export type Dinero = bigint; // valor en centavos. Ej: $10.50 => 1050n

export const crearDinero = (centavos: bigint): Dinero => centavos;

export const sumarDinero = (a: Dinero, b: Dinero): Dinero => a + b;

export const multiplicarDineroPorPorcentaje = (
  monto: Dinero,
  porcentaje: number // 0-100
): Dinero => {
  const porcentajeEscalado = BigInt(Math.round(porcentaje * 100));
  return (monto * porcentajeEscalado) / 10000n;
};

// ----------------------------------------------------------------------------
// 2. CONTEXTO DE APLICACIÓN
// ----------------------------------------------------------------------------

export interface ItemCarritoContexto {
  readonly productoId: string;
  readonly categoria: string;
  readonly cantidad: number;
  readonly precioUnitario: Dinero;
}

export interface ContextoAplicacion {
  readonly items: ReadonlyArray<ItemCarritoContexto>;
  readonly subtotal: Dinero;
  readonly clienteEsFrecuente: boolean;
}

export const crearContextoAplicacion = (
  items: ReadonlyArray<ItemCarritoContexto>,
  clienteEsFrecuente: boolean = false
): Readonly<ContextoAplicacion> =>
  Object.freeze({
    items: Object.freeze([...items]),
    subtotal: items.reduce(
      (acc, item) =>
        sumarDinero(acc, item.precioUnitario * BigInt(item.cantidad)),
      0n
    ),
    clienteEsFrecuente,
  });

// ----------------------------------------------------------------------------
// 3. CONDICIÓN_APLICACIÓN — función pura de validación
// ----------------------------------------------------------------------------

export type CondicionAplicacion = (contexto: ContextoAplicacion) => boolean;

export const condicionSubtotalMinimo = (
  minimo: Dinero
): CondicionAplicacion => (contexto) => contexto.subtotal >= minimo;

export const condicionCategoriaPresente = (
  categoria: string
): CondicionAplicacion => (contexto) =>
  contexto.items.some((item) => item.categoria === categoria);

export const condicionClienteFrecuente = (): CondicionAplicacion => (
  contexto
) => contexto.clienteEsFrecuente;

export const Y = (
  ...condiciones: ReadonlyArray<CondicionAplicacion>
): CondicionAplicacion => (contexto) =>
  condiciones.every((cond) => cond(contexto));

export const O = (
  ...condiciones: ReadonlyArray<CondicionAplicacion>
): CondicionAplicacion => (contexto) =>
  condiciones.some((cond) => cond(contexto));

export const NO = (condicion: CondicionAplicacion): CondicionAplicacion => (
  contexto
) => !condicion(contexto);

// ----------------------------------------------------------------------------
// 4. REPRESENTACIÓN FUNCIONAL DE LAS PROMOCIONES (Union Discriminada)
// ----------------------------------------------------------------------------

export interface ReglaPorcentaje {
  readonly tipo: "PORCENTAJE";
  readonly valorPorcentaje: number;
  readonly condicion: CondicionAplicacion;
}

export interface ReglaMontoFijo {
  readonly tipo: "MONTO_FIJO";
  readonly valorDescuento: Dinero;
  readonly condicion: CondicionAplicacion;
}

export interface Regla2x1 {
  readonly tipo: "DOS_POR_UNO";
  readonly categoriaAplicable: string;
  readonly condicion: CondicionAplicacion;
}

export type ReglaDescuento = ReglaPorcentaje | ReglaMontoFijo | Regla2x1;

// ----------------------------------------------------------------------------
// 5. FÁBRICAS (constructores puros que retornan objetos congelados)
// ----------------------------------------------------------------------------

export const crearReglaPorcentaje = (
  valorPorcentaje: number,
  condicion: CondicionAplicacion
): Readonly<ReglaPorcentaje> =>
  Object.freeze({ tipo: "PORCENTAJE", valorPorcentaje, condicion });

export const crearReglaMontoFijo = (
  valorDescuento: Dinero,
  condicion: CondicionAplicacion
): Readonly<ReglaMontoFijo> =>
  Object.freeze({ tipo: "MONTO_FIJO", valorDescuento, condicion });

export const crearRegla2x1 = (
  categoriaAplicable: string,
  condicion: CondicionAplicacion
): Readonly<Regla2x1> =>
  Object.freeze({ tipo: "DOS_POR_UNO", categoriaAplicable, condicion });

// ----------------------------------------------------------------------------
// 6. VALIDACIÓN: ¿la regla aplica en este contexto?
// ----------------------------------------------------------------------------

export const esAplicable = (
  regla: ReglaDescuento,
  contexto: ContextoAplicacion
): boolean => regla.condicion(contexto);

// ----------------------------------------------------------------------------
// 7. CÁLCULO DEL DESCUENTO — pattern matching exhaustivo, sin mutación
// ----------------------------------------------------------------------------

export const calcularDescuento = (
  regla: ReglaDescuento,
  contexto: ContextoAplicacion
): Dinero => {
  if (!esAplicable(regla, contexto)) {
    return 0n;
  }

  switch (regla.tipo) {
    case "PORCENTAJE":
      return multiplicarDineroPorPorcentaje(
        contexto.subtotal,
        regla.valorPorcentaje
      );

    case "MONTO_FIJO":
      return regla.valorDescuento < contexto.subtotal
        ? regla.valorDescuento
        : contexto.subtotal;

    case "DOS_POR_UNO": {
      const itemsCategoria = contexto.items.filter(
        (item) => item.categoria === regla.categoriaAplicable
      );

      return itemsCategoria.reduce((totalDescuento, item) => {
        const paresGratis = Math.floor(item.cantidad / 2);
        const descuentoItem =
          item.precioUnitario * BigInt(paresGratis);
        return sumarDinero(totalDescuento, descuentoItem);
      }, 0n);
    }

    default: {
      const _exhaustivo: never = regla;
      return _exhaustivo;
    }
  }
};
