import { EventoStock } from '../types/events';

export interface EstadoStock {
  readonly productoId: string;
  readonly stockTotal: number;
  readonly stockReservado: number;
  readonly stockDisponible: number;
}

export function calcularStockActual(
  productoId: string,
  eventos: ReadonlyArray<EventoStock>
): EstadoStock {
  const estadoInicial: EstadoStock = Object.freeze({
    productoId,
    stockTotal: 0,
    stockReservado: 0,
    stockDisponible: 0,
  });

  // Patron Event Sourcing: reduce/foldLeft sobre el historial inmutable
  return eventos
    .filter((e) => e.productoId === productoId)
    .reduce((acc, evento) => {
      switch (evento.tipo) {
        case 'StockIngresado':
          return Object.freeze({
            ...acc,
            stockTotal: acc.stockTotal + evento.cantidad,
            stockDisponible: acc.stockDisponible + evento.cantidad,
          });

        case 'StockReservadoEnCarrito':
          return Object.freeze({
            ...acc,
            stockReservado: acc.stockReservado + evento.cantidad,
            stockDisponible: acc.stockDisponible - evento.cantidad,
          });

        case 'StockReservaLiberada':
          return Object.freeze({
            ...acc,
            stockReservado: Math.max(0, acc.stockReservado - evento.cantidad),
            stockDisponible: acc.stockDisponible + evento.cantidad,
          });

        case 'StockVendido':
          return Object.freeze({
            ...acc,
            stockTotal: acc.stockTotal - evento.cantidad,
            stockReservado: Math.max(0, acc.stockReservado - evento.cantidad),
          });

        case 'StockDevuelto':
          return Object.freeze({
            ...acc,
            stockTotal: acc.stockTotal + evento.cantidad,
            stockDisponible: acc.stockDisponible + evento.cantidad,
          });

        default:
          return acc;
      }
    }, estadoInicial);
}
