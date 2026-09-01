/**
 * ============================================================================
 * MÓDULO 1 — Dominio Inmutable y Estructuras de Datos
 * Entidad: Regla_Descuento
 * Autor: Antonio
 * ----------------------------------------------------------------------------
 * Reto: representar funcionalmente las promociones (Porcentaje, Monto Fijo,
 * 2x1) y su validación (Condición_Aplicación) dentro de estructuras congeladas,
 * sin código imperativo ni mutación. Usa el patrón base de inmutabilidad
 * definido por David en src/shared/inmutable.ts (crearInmutable + DeepReadonly)
 * en vez de Object.freeze directo, para que todo el equipo use un único
 * mecanismo estándar.
 * ============================================================================
 */

import { DeepReadonly, crearInmutable } from '../shared/inmutable';

// ----------------------------------------------------------------------------
// 1. TIPO DE DINERO SIN PUNTO FLOTANTE
// ----------------------------------------------------------------------------

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

interface ItemCarritoContextoBase {
  productoId: string;
  categoria: string;
  cantidad: number;
  precioUnitario: Dinero;
}

export type ItemCarritoContexto = DeepReadonly<ItemCarritoContextoBase>;

interface ContextoAplicacionBase {
  items: ItemCarritoContextoBase[];
  subtotal: Dinero;
  clienteEsFrecuente: boolean;
}

export type ContextoAplicacion = DeepReadonly<ContextoAplicacionBase>;

export const crearContextoAplicacion = (
  items: ReadonlyArray<ItemCarritoContextoBase>,
  clienteEsFrecuente: boolean = false
): ContextoAplicacion => {
  const subtotal = items.reduce(
    (acc, item) => sumarDinero(acc, item.precioUnitario * BigInt(item.cantidad)),
    0n
  );

  return crearInmutable({
    items: [...items],
    subtotal,
    clienteEsFrecuente,
  });
};

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

interface ReglaPorcentajeBase {
  tipo: "PORCENTAJE";
  valorPorcentaje: number;
  condicion: CondicionAplicacion;
}

interface ReglaMontoFijoBase {
  tipo: "MONTO_FIJO";
  valorDescuento: Dinero;
  condicion: CondicionAplicacion;
}

interface Regla2x1Base {
  tipo: "DOS_POR_UNO";
  categoriaAplicable: string;
  condicion: CondicionAplicacion;
}

export type ReglaPorcentaje = DeepReadonly<ReglaPorcentajeBase>;
export type ReglaMontoFijo = DeepReadonly<ReglaMontoFijoBase>;
export type Regla2x1 = DeepReadonly<Regla2x1Base>;

export type ReglaDescuento = ReglaPorcentaje | ReglaMontoFijo | Regla2x1;

// ----------------------------------------------------------------------------
// 5. FÁBRICAS (constructores puros que retornan objetos congelados
//    usando el patrón base crearInmutable de David)
// ----------------------------------------------------------------------------

export const crearReglaPorcentaje = (
  valorPorcentaje: number,
  condicion: CondicionAplicacion
): ReglaPorcentaje =>
  crearInmutable({ tipo: "PORCENTAJE", valorPorcentaje, condicion });

export const crearReglaMontoFijo = (
  valorDescuento: Dinero,
  condicion: CondicionAplicacion
): ReglaMontoFijo =>
  crearInmutable({ tipo: "MONTO_FIJO", valorDescuento, condicion });

export const crearRegla2x1 = (
  categoriaAplicable: string,
  condicion: CondicionAplicacion
): Regla2x1 =>
  crearInmutable({ tipo: "DOS_POR_UNO", categoriaAplicable, condicion });

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
        const descuentoItem = item.precioUnitario * BigInt(paresGratis);
        return sumarDinero(totalDescuento, descuentoItem);
      }, 0n);
    }

    default: {
      const _exhaustivo: never = regla;
      return _exhaustivo;
    }
  }
};
