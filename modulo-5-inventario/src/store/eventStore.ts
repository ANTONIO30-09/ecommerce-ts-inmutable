import { EventoStock } from '../types/events';

export class EventStore {
  private readonly historial: ReadonlyArray<EventoStock>;

  constructor(historialInicial: ReadonlyArray<EventoStock> = []) {
    this.historial = Object.freeze([...historialInicial]);
  }

  // Registra un evento de forma append-only sin mutar el historial anterior
  public agregarEvento(nuevoEvento: EventoStock): EventStore {
    const eventoCongelado = Object.freeze({ ...nuevoEvento });
    return new EventStore([...this.historial, eventoCongelado]);
  }

  public obtenerEventosPorProducto(productoId: string): ReadonlyArray<EventoStock> {
    return Object.freeze(this.historial.filter(e => e.productoId === productoId));
  }

  public obtenerHistorialCompleto(): ReadonlyArray<EventoStock> {
    return this.historial;
  }
}
