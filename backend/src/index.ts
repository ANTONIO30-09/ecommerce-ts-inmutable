import express from 'express';
import cors from 'cors';
import { productosRouter } from './routes/productos.ts';
import { carritosRouter } from './routes/carritos.ts';
import { cuponesRouter } from './routes/cupones.ts';
import { checkoutRouter } from './routes/checkout.ts';
import { facturasRouter } from './routes/facturas.ts';
import { inventarioRouter } from './routes/inventario.ts';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, mensaje: 'Backend de La Esquina funcionando' });
});

app.use('/api/productos', productosRouter);
app.use('/api/carritos', carritosRouter);
app.use('/api/cupones', cuponesRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/facturas', facturasRouter);
app.use('/api/inventario', inventarioRouter);

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
