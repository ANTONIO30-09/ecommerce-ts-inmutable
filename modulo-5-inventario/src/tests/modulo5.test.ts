import { EventStore } from '../store/eventStore';
import { calcularStockActual } from '../logic/stockReducer';
import { StockService } from '../concurrency/stockService';
import { StockIngresado } from '../types/events';

// Prueba manual rapida de ejecucion
function ejecutarPrueba() {
let store = new EventStore();
const service = new StockService();
const productoId = 'PROD-001';

console.log('--- TEST MODULO 5: EVENT SOURCING INVENTARIO ---');

// 1. Ingreso de Stock
const ingreso: StockIngresado = {
id: 'evt-1',
productoId,
cantidad: 10,
timestamp: Date.now(),
tipo: 'StockIngresado'
};

store = store.agregarEvento(ingreso);

// 2. Reserva de Stock mediante servicio
store = service.reservarStock(store, productoId, 3, 'CART-A');

// 3. Calculo de estado
const estadoFinal = calcularStockActual(
productoId,
store.obtenerHistorialCompleto()
);

console.log('Estado del inventario:', estadoFinal);
}

ejecutarPrueba();

