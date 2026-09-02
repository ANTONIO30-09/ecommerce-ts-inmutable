import { EventStore } from '../store/eventStore';
import { StockReservadoEnCarrito } from '../types/events';
import { calcularStockActual } from '../logic/stockReducer';

export class StockService {
  // Maneja intentos de reserva validando stock disponible antes de emitir evento
  public reservarStock(
    store: EventStore,
    productoId: string,
    cantidad: number,
    carritoId: string
  ): EventStore {
    const eventosProducto = store.obtenerEventosPorProducto(productoId);
    const estadoActual = calcularStockActual(productoId, eventosProducto);

    if (estadoActual.stockDisponible < cantidad) {
      throw new Error(
        `Stock insuficiente para el producto ${productoId}. Disponible: ${estadoActual.stockDisponible}`
      );
    }

    const eventoReserva: StockReservadoEnCarrito = Object.freeze({
      id: `evt-${Date.now()}`,
      productoId,
      cantidad,
      carritoId,
      timestamp: Date.now(),
      tipo: 'StockReservadoEnCarrito'
    });

    return store.agregarEvento(eventoReserva);
  }
}
