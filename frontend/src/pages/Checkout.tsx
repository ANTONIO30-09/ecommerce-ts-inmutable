import { useState } from 'react';
import { useCarrito } from '@/context/CarritoContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

type ResultadoCheckout = {
  facturaId: string;
  estado: string;
  version: number;
  subtotalCentavos: number;
  descuentoCentavos: number;
  impuestosCentavos: number;
  totalCentavos: number;
  items: Array<{
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitarioCentavos: number;
    subtotalCentavos: number;
  }>;
};

const DesgloseItem = ({ etiqueta, valor, delay }: { etiqueta: string; valor: string; delay: number }) => (
  <motion.p
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
  >
    {etiqueta}: <strong>{valor}</strong>
  </motion.p>
);

export default function Checkout() {
  const { carrito, vaciarCarrito } = useCarrito();
  const [cupon, setCupon] = useState('');
  const [resultado, setResultado] = useState<ResultadoCheckout | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmarCompra = async () => {
    if (!carrito) return;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carritoId: carrito.id, codigoCupon: cupon || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al confirmar compra');
      }
      const data: ResultadoCheckout = await res.json();
      setResultado(data);
      vaciarCarrito();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar compra');
    } finally {
      setCargando(false);
    }
  };

  if (resultado) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-display text-primary mb-6">Checkout</h1>
        <Card>
          <CardContent className="p-6 space-y-3">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold"
            >
              Factura generada
            </motion.h2>
            <DesgloseItem etiqueta="Factura ID" valor={resultado.facturaId} delay={0.1} />
            <DesgloseItem etiqueta="Estado" valor={resultado.estado} delay={0.2} />
            <div className="border-t pt-3 space-y-1">
              <DesgloseItem etiqueta="Subtotal" valor={`Bs ${(resultado.subtotalCentavos / 100).toFixed(2)}`} delay={0.3} />
              <DesgloseItem etiqueta="Descuento" valor={`-Bs ${(resultado.descuentoCentavos / 100).toFixed(2)}`} delay={0.45} />
              <DesgloseItem etiqueta="Impuestos (IVA)" valor={`Bs ${(resultado.impuestosCentavos / 100).toFixed(2)}`} delay={0.6} />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-lg font-bold"
              >
                Total: Bs {(resultado.totalCentavos / 100).toFixed(2)}
              </motion.p>
            </div>
            <Link to="/">
              <Button className="mt-4">Volver al catálogo</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!carrito || carrito.items.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-display text-primary mb-4">No hay productos en el carrito</h1>
        <Link to="/">
          <Button>Ir al catálogo</Button>
        </Link>
      </div>
    );
  }

  const subtotal = carrito.totalCentavos;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display text-primary mb-6">Checkout</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Cupón (opcional)</label>
            <Input
              value={cupon}
              onChange={(e) => setCupon(e.target.value)}
              placeholder="BIENVENIDA10"
              className="mt-1"
            />
          </div>
          <div className="border-t pt-3 space-y-1">
            <p>Subtotal: Bs {(subtotal / 100).toFixed(2)}</p>
            <p className="text-muted-foreground text-sm">El descuento e impuestos se calcularán al confirmar.</p>
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <Button onClick={confirmarCompra} disabled={cargando} className="w-full">
            {cargando ? 'Procesando...' : 'Confirmar compra'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
