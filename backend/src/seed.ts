import { db } from './db.ts';

type ProductoSeed = {
  nombre: string;
  categoria: string;
  precio_centavos: number;
  stock_inicial: number;
};

const productos: ProductoSeed[] = [
  { nombre: 'Coca Cola 500ml', categoria: 'Bebidas', precio_centavos: 350, stock_inicial: 100 },
  { nombre: 'Pepsi 500ml', categoria: 'Bebidas', precio_centavos: 330, stock_inicial: 100 },
  { nombre: 'Agua Vital 2L', categoria: 'Bebidas', precio_centavos: 200, stock_inicial: 150 },
  { nombre: 'Jugo de Naranja 1L', categoria: 'Bebidas', precio_centavos: 600, stock_inicial: 80 },
  { nombre: 'Leche Pil 1L', categoria: 'Lácteos', precio_centavos: 650, stock_inicial: 120 },
  { nombre: 'Yogurt Frutado 150g', categoria: 'Lácteos', precio_centavos: 250, stock_inicial: 90 },
  { nombre: 'Queso Fresco 250g', categoria: 'Lácteos', precio_centavos: 1200, stock_inicial: 60 },
  { nombre: 'Pan Francés (unidad)', categoria: 'Panadería', precio_centavos: 50, stock_inicial: 200 },
  { nombre: 'Empanada de Queso', categoria: 'Panadería', precio_centavos: 300, stock_inicial: 150 },
  { nombre: 'Galletas María', categoria: 'Snacks', precio_centavos: 400, stock_inicial: 80 },
  { nombre: 'Papas Fritas 140g', categoria: 'Snacks', precio_centavos: 500, stock_inicial: 100 },
  { nombre: 'Chocolate 65g', categoria: 'Snacks', precio_centavos: 450, stock_inicial: 120 },
  { nombre: 'Arroz 1kg', categoria: 'Abarrotes', precio_centavos: 700, stock_inicial: 200 },
  { nombre: 'Fideo Spaghetti 400g', categoria: 'Abarrotes', precio_centavos: 550, stock_inicial: 150 },
  { nombre: 'Aceite Vegetal 1L', categoria: 'Abarrotes', precio_centavos: 1500, stock_inicial: 80 },
  { nombre: 'Azúcar 1kg', categoria: 'Abarrotes', precio_centavos: 600, stock_inicial: 120 },
  { nombre: 'Sal Yodada 1kg', categoria: 'Abarrotes', precio_centavos: 350, stock_inicial: 100 },
  { nombre: 'Detergente 1kg', categoria: 'Limpieza', precio_centavos: 1200, stock_inicial: 60 },
  { nombre: 'Jabón de Tocador', categoria: 'Limpieza', precio_centavos: 300, stock_inicial: 100 },
  { nombre: 'Papel Higiénico (4 rollos)', categoria: 'Limpieza', precio_centavos: 800, stock_inicial: 80 },
  { nombre: 'Shampoo 400ml', categoria: 'Limpieza', precio_centavos: 1500, stock_inicial: 50 },
  { nombre: 'Café Instantáneo 50g', categoria: 'Abarrotes', precio_centavos: 900, stock_inicial: 70 },
  { nombre: 'Té en Bolsitas 25u', categoria: 'Abarrotes', precio_centavos: 350, stock_inicial: 90 },
  { nombre: 'Mermelada de Fresa 250g', categoria: 'Abarrotes', precio_centavos: 600, stock_inicial: 60 },
  { nombre: 'Atún en Lata 140g', categoria: 'Abarrotes', precio_centavos: 750, stock_inicial: 80 },
  { nombre: 'Cerveza 620ml', categoria: 'Bebidas', precio_centavos: 1200, stock_inicial: 100 },
  { nombre: 'Gaseosa 2L', categoria: 'Bebidas', precio_centavos: 800, stock_inicial: 60 },
];

const count = db.prepare('SELECT COUNT(*) as total FROM productos').get() as { total: number };

if (count.total > 0) {
  console.log('La base de datos ya contiene productos. Seed omitido.');
  process.exit(0);
}

const insertProducto = db.prepare(
  'INSERT INTO productos (nombre, categoria, precio_centavos) VALUES (?, ?, ?)'
);
const insertEvento = db.prepare(
  'INSERT INTO eventos_inventario (producto_id, tipo, cantidad) VALUES (?, ?, ?)'
);

const transaccion = db.transaction(() => {
  for (const p of productos) {
    const info = insertProducto.run(p.nombre, p.categoria, p.precio_centavos);
    const productoId = Number(info.lastInsertRowid);
    insertEvento.run(productoId, 'StockIngresado', p.stock_inicial);
  }
});

transaccion();
console.log(`Seed completado: ${productos.length} productos insertados con sus eventos de stock inicial.`);
