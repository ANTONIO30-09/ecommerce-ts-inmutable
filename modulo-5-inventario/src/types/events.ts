export type TipoEventoStock = 
  | 'StockIngresado' 
  | 'StockReservadoEnCarrito'
  | 'StockReservaLiberada'
  | 'StockVendido' 
  | 'StockDevuelto';

export interface EventoStockBase {
  readonly id: string;
  readonly productoId: string;
  readonly cantidad: number;
  readonly timestamp: number;
  readonly tipo: TipoEventoStock;
}

export interface StockIngresado extends EventoStockBase {
  readonly tipo: 'StockIngresado';
}

export interface StockReservadoEnCarrito extends EventoStockBase {
  readonly tipo: 'StockReservadoEnCarrito';
  readonly carritoId: string;
}

export interface StockReservaLiberada extends EventoStockBase {
  readonly tipo: 'StockReservaLiberada';
  readonly carritoId: string;
  readonly motivo?: string;
}

export interface StockVendido extends EventoStockBase {
  readonly tipo: 'StockVendido';
  readonly facturaId: string;
}

export interface StockDevuelto extends EventoStockBase {
  readonly tipo: 'StockDevuelto';
  readonly motivo: string;
}

export type EventoStock = 
  | StockIngresado 
  | StockReservadoEnCarrito
  | StockReservaLiberada
  | StockVendido 
  | StockDevuelto;
