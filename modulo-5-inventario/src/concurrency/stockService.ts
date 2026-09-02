import { EventStore } from '../store/eventStore';
import { StockReservadoEnCarrito } from '../types/events';
import { calcularStockActual } from '../logic/stockReducer';
// Capa de servicio encargada de validar reglas de negocio antes de emitir nuevos eventosvice

export class StockService {
  // Maneja intentos de reserva validando stock disponible antes de emitir evento
  public reservarStock(
    store: EventStore,
    productoId: string,
    cantidad: number,
    carritoId: string
  ): EventStore {
    // 1. Recupera el historial completo de eventos asociados al producto
    const eventosProducto = store.obtenerEventosPorProducto(productoId);
    // 2. Procesa el historial para calcular el estado actual del stock (Event Sourcing)
    const estadoActual = calcularStockActual(productoId, eventosProducto);
    // 3. Valida la regla de negocio: ¿Hay suficiente stock disponible?
    // NOTA: Si hay peticiones concurrentes simultáneas, este check por sí solo 
    // no evita condiciones de carrera sin un control de versión/concurrencia optimista.
    if (estadoActual.stockDisponible < cantidad) {
      throw new Error(
        `Stock insuficiente para el producto ${productoId}. Disponible: ${estadoActual.stockDisponible}`
      );
    }
    // 4. Si la validación es exitosa, se crea el objeto del evento inmutable
    const eventoReserva: StockReservadoEnCarrito = Object.freeze({
      id: `evt-${Date.now()}`,
      productoId,
      cantidad,
      carritoId,
      timestamp: Date.now(),
      tipo: 'StockReservadoEnCarrito'
    });
    // 5. Registra el nuevo evento en la tienda y retorna el store actualizado
    return store.agregarEvento(eventoReserva);
  }
}
