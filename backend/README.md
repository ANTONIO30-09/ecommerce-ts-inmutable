# Backend — La Esquina

API delgada en Express + TypeScript que integra los 5 módulos inmutables con SQLite.

## Scripts

- `npm run dev`: modo desarrollo (tsx watch)
- `npm run build`: compila TypeScript
- `npm run start`: ejecuta el build
- `npm run seed`: carga datos iniciales

## Endpoints principales

- GET /health: estado del servidor
- GET /api/productos: lista productos con stock calculado
- POST /api/carritos: crea carrito vacío
- GET /api/carritos/:id: obtiene carrito actual
- POST /api/carritos/:id/items: agrega producto al carrito
- DELETE /api/carritos/:id/items/:pid: quita producto del carrito
- POST /api/cupones/validar: valida cupón
- POST /api/cupones/aplicar: aplica cupón
- POST /api/checkout: genera factura y consume reservas
- GET /api/facturas/:id: obtiene factura actual
- POST /api/facturas/:id/pagar: marca factura como Pagada
- POST /api/facturas/devoluciones: genera Nota de Crédito con prorrateo
- GET /api/inventario/stock: stock actual de todos los productos
- GET /api/inventario/eventos/:pid: historial de eventos de un producto

## Estructura

- backend/src/db.ts
- backend/src/index.ts
- backend/src/seed.ts
- backend/src/repositorios/productoRepo.ts
- backend/src/repositorios/carritoRepo.ts
- backend/src/routes/productos.ts
- backend/src/routes/carritos.ts
- backend/src/routes/cupones.ts
- backend/src/routes/checkout.ts
- backend/src/routes/facturas.ts
- backend/src/routes/inventario.ts
- backend/package.json
