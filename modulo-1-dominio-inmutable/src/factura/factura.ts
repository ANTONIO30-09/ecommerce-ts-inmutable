/**
 * ============================================================================
 * MÓDULO 1 — Dominio Inmutable y Estructuras de Datos
 * Entidad: Factura
 * ----------------------------------------------------------------------------
 * Una factura nunca cambia después de ser creada. Cada transición genera una
 * versión nueva, enlazada con su versión anterior para conservar la auditoría.
 * ============================================================================
 */

import {
  crearInmutable,
  type DeepReadonly,
} from '../shared/inmutable';
import type { Dinero } from '../reglaDescuento/reglaDescuento';

// Se vuelve a exportar el tipo compartido para que los consumidores de Factura
// no tengan que conocer qué entidad declaró originalmente el alias monetario.
export type { Dinero } from '../reglaDescuento/reglaDescuento';

/**
 * Los únicos estados válidos del documento forman una unión cerrada. Esto
 * impide asignar estados arbitrarios incluso antes de ejecutar el programa.
 */
export type EstadoFactura =
  | 'Emitida'
  | 'Pagada'
  | 'Anulada'
  | 'Nota_Credito';

/**
 * La factura conserva una instantánea pequeña del producto. No guarda una
 * referencia mutable ni depende de que el nombre del producto siga igual.
 */
interface ProductoFacturadoBase {
  readonly id: string;
  readonly nombre: string;
}

export type ProductoFacturado = DeepReadonly<ProductoFacturadoBase>;

/**
 * Datos aceptados por la fábrica de ítems. Un Producto del módulo también es
 * compatible estructuralmente porque contiene, como mínimo, id y nombre.
 */
export interface DatosProductoFacturado {
  readonly id: string;
  readonly nombre: string;
}

export interface DatosItemFactura {
  readonly producto: DatosProductoFacturado;
  readonly cantidad: number;
  readonly precioUnitario: Dinero;
}

interface ItemFacturaBase {
  readonly producto: ProductoFacturadoBase;
  readonly cantidad: number;
  readonly precioUnitario: Dinero;
}

export type ItemFactura = DeepReadonly<ItemFacturaBase>;

export interface DatosImpuestoAplicado {
  readonly id: string;
  readonly nombre: string;
  readonly monto: Dinero;
}

interface ImpuestoAplicadoBase {
  readonly id: string;
  readonly nombre: string;
  readonly monto: Dinero;
}

export type ImpuestoAplicado = DeepReadonly<ImpuestoAplicadoBase>;

/**
 * Campos presentes en todas las versiones. `fechaEmision` se representa como
 * texto ISO y no como Date, porque Date posee métodos que modifican su estado.
 */
interface FacturaComunBase {
  readonly id: string;
  readonly facturaRaizId: string;
  readonly version: number;
  readonly fechaEmision: string;
  readonly items: ReadonlyArray<ItemFacturaBase>;
  readonly impuestosAplicados: ReadonlyArray<ImpuestoAplicadoBase>;
  readonly total: Dinero;
  readonly estado: EstadoFactura;
}

interface FacturaEmitidaBase extends FacturaComunBase {
  readonly estado: 'Emitida';
}

interface FacturaPagadaBase extends FacturaComunBase {
  readonly estado: 'Pagada';
  readonly facturaOrigenId: string;
}

interface FacturaAnuladaBase extends FacturaComunBase {
  readonly estado: 'Anulada';
  readonly facturaOrigenId: string;
  readonly motivoAnulacion: string;
}

interface FacturaNotaCreditoBase extends FacturaComunBase {
  readonly estado: 'Nota_Credito';
  readonly facturaOrigenId: string;
  readonly montoDevuelto: Dinero;
}

export type FacturaEmitida = DeepReadonly<FacturaEmitidaBase>;
export type FacturaPagada = DeepReadonly<FacturaPagadaBase>;
export type FacturaAnulada = DeepReadonly<FacturaAnuladaBase>;
export type FacturaNotaCredito = DeepReadonly<FacturaNotaCreditoBase>;

/**
 * La unión discriminada hace que los datos propios de cada estado solo existan
 * donde corresponden: por ejemplo, una factura Emitida no puede tener motivo
 * de anulación ni monto devuelto.
 */
export type Factura =
  | FacturaEmitida
  | FacturaPagada
  | FacturaAnulada
  | FacturaNotaCredito;

const validarTextoObligatorio = (valor: string, campo: string): string => {
  const valorNormalizado = valor.trim();

  if (valorNormalizado.length === 0) {
    throw new Error(`${campo} es obligatorio`);
  }

  return valorNormalizado;
};

const validarCantidad = (cantidad: number): number => {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad debe ser un entero seguro mayor que cero');
  }

  return cantidad;
};

const validarMontoNoNegativo = (monto: Dinero, campo: string): Dinero => {
  if (monto < 0n) {
    throw new Error(`${campo} no puede ser negativo`);
  }

  return monto;
};

/**
 * Crea una copia nueva antes de congelar. Así `crearInmutable` nunca congela
 * accidentalmente el objeto del producto que entregó quien llama la función.
 */
export const crearItemFactura = (datos: DatosItemFactura): ItemFactura =>
  crearInmutable({
    producto: {
      id: validarTextoObligatorio(datos.producto.id, 'El id del producto'),
      nombre: validarTextoObligatorio(
        datos.producto.nombre,
        'El nombre del producto'
      ),
    },
    cantidad: validarCantidad(datos.cantidad),
    precioUnitario: validarMontoNoNegativo(
      datos.precioUnitario,
      'El precio unitario'
    ),
  });

/**
 * Cada impuesto se copia y se congela; nunca se conserva una referencia
 * potencialmente mutable recibida desde otro módulo.
 */
export const crearImpuestoAplicado = (
  datos: DatosImpuestoAplicado
): ImpuestoAplicado =>
  crearInmutable({
    id: validarTextoObligatorio(datos.id, 'El id del impuesto'),
    nombre: validarTextoObligatorio(datos.nombre, 'El nombre del impuesto'),
    monto: validarMontoNoNegativo(datos.monto, 'El monto del impuesto'),
  });

/**
 * El subtotal se calcula con reduce y bigint. No existe un acumulador mutable
 * ni se usa punto flotante para representar importes financieros.
 */
export const calcularSubtotal = (
  items: ReadonlyArray<ItemFactura>
): Dinero =>
  items.reduce(
    (subtotal, item) =>
      subtotal + item.precioUnitario * BigInt(item.cantidad),
    0n
  );

/**
 * Suma montos de impuestos ya calculados; el prorrateo o cálculo de tasas puede
 * vivir en otro módulo sin comprometer el documento inmutable de Factura.
 */
export const calcularTotal = (
  items: ReadonlyArray<ItemFactura>,
  impuestosAplicados: ReadonlyArray<ImpuestoAplicado>
): Dinero =>
  impuestosAplicados.reduce(
    (total, impuesto) => total + impuesto.monto,
    calcularSubtotal(items)
  );

/**
 * Fábrica de la primera versión. Los map crean colecciones nuevas y el patrón
 * compartido las congela recursivamente junto con todos sus elementos.
 */
export const crearFactura = (
  id: string,
  fechaEmision: string,
  items: ReadonlyArray<DatosItemFactura>,
  impuestosAplicados: ReadonlyArray<DatosImpuestoAplicado> = []
): Factura => {
  if (items.length === 0) {
    throw new Error('La factura debe contener al menos un ítem');
  }

  const idValidado = validarTextoObligatorio(id, 'El id de la factura');
  const fechaValidada = validarTextoObligatorio(
    fechaEmision,
    'La fecha de emisión'
  );
  const itemsInmutables = items.map(crearItemFactura);
  const impuestosInmutables = impuestosAplicados.map(crearImpuestoAplicado);

  return crearInmutable({
    id: idValidado,
    facturaRaizId: idValidado,
    version: 1,
    fechaEmision: fechaValidada,
    items: itemsInmutables,
    impuestosAplicados: impuestosInmutables,
    total: calcularTotal(itemsInmutables, impuestosInmutables),
    estado: 'Emitida' as const,
  });
};

/**
 * El id siguiente se deriva únicamente de la factura recibida. Al no usar la
 * hora, números aleatorios ni estado global, las transiciones siguen siendo
 * funciones puras y deterministas.
 */
const crearIdVersionSiguiente = (factura: Factura): string =>
  `${factura.facturaRaizId}-v${factura.version + 1}`;

/**
 * Transición Emitida -> Pagada. Spread crea el documento nuevo y la factura
 * recibida conserva tanto su identidad como su estado original.
 */
export const marcarComoPagada = (factura: Factura): Factura => {
  if (factura.estado !== 'Emitida') {
    throw new Error('Solo una factura Emitida puede marcarse como Pagada');
  }

  return crearInmutable({
    ...factura,
    id: crearIdVersionSiguiente(factura),
    version: factura.version + 1,
    facturaOrigenId: factura.id,
    estado: 'Pagada' as const,
  });
};

/**
 * Transición Emitida -> Anulada. El motivo vive exclusivamente en la versión
 * anulada y nunca se agrega mediante asignación a la factura anterior.
 */
export const anularFactura = (
  factura: Factura,
  motivo: string
): Factura => {
  if (factura.estado !== 'Emitida') {
    throw new Error('Solo una factura Emitida puede anularse');
  }

  const motivoValidado = validarTextoObligatorio(
    motivo,
    'El motivo de anulación'
  );

  return crearInmutable({
    ...factura,
    id: crearIdVersionSiguiente(factura),
    version: factura.version + 1,
    facturaOrigenId: factura.id,
    estado: 'Anulada' as const,
    motivoAnulacion: motivoValidado,
  });
};

/**
 * Transición Pagada -> Nota_Credito. El monto proporcional llega ya calculado
 * y se valida sin recalcularlo; así Factura representa el resultado producido
 * por el módulo de prorrateo sin duplicar esa responsabilidad.
 *
 * `total` conserva el importe de la factura original y `montoDevuelto` registra
 * el crédito aplicado. Esto mantiene ambos valores disponibles para auditoría.
 */
export const generarNotaDeCredito = (
  facturaOriginal: Factura,
  montoDevuelto: Dinero
): Factura => {
  if (facturaOriginal.estado !== 'Pagada') {
    throw new Error(
      'Solo una factura Pagada puede generar una Nota de Crédito'
    );
  }

  if (montoDevuelto <= 0n) {
    throw new Error('El monto devuelto debe ser mayor que cero');
  }

  if (montoDevuelto > facturaOriginal.total) {
    throw new Error('El monto devuelto no puede superar el total de la factura');
  }

  return crearInmutable({
    ...facturaOriginal,
    id: crearIdVersionSiguiente(facturaOriginal),
    version: facturaOriginal.version + 1,
    facturaOrigenId: facturaOriginal.id,
    estado: 'Nota_Credito' as const,
    montoDevuelto,
  });
};
