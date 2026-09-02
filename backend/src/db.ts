import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(join(dataDir, 'tienda.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precio_centavos INTEGER NOT NULL CHECK (precio_centavos >= 0),
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS eventos_inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  fecha TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carritos (
  id TEXT NOT NULL,
  version INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierto',
  creado_en TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (id, version)
);

CREATE TABLE IF NOT EXISTS items_carrito (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  carrito_id TEXT NOT NULL,
  carrito_version INTEGER NOT NULL,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  UNIQUE(carrito_id, carrito_version, producto_id),
  FOREIGN KEY (carrito_id, carrito_version) REFERENCES carritos (id, version) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facturas (
  id TEXT NOT NULL,
  version INTEGER NOT NULL,
  carrito_id TEXT,
  carrito_version INTEGER,
  estado TEXT NOT NULL,
  subtotal_centavos INTEGER NOT NULL,
  descuento_centavos INTEGER NOT NULL DEFAULT 0,
  total_centavos INTEGER NOT NULL,
  factura_origen_id TEXT,
  factura_origen_version INTEGER,
  creado_en TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (id, version),
  FOREIGN KEY (carrito_id, carrito_version) REFERENCES carritos (id, version),
  FOREIGN KEY (factura_origen_id, factura_origen_version) REFERENCES facturas (id, version)
);

CREATE TABLE IF NOT EXISTS items_factura (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  factura_id TEXT NOT NULL,
  factura_version INTEGER NOT NULL,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario_centavos INTEGER NOT NULL,
  subtotal_centavos INTEGER NOT NULL,
  FOREIGN KEY (factura_id, factura_version) REFERENCES facturas (id, version) ON DELETE CASCADE
);
`);
