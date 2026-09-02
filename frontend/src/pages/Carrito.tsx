import { useCarrito } from '@/context/CarritoContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

export default function Carrito() {
  const { carrito, cargando, error, quitarDelCarrito } = useCarrito();

  if (cargando) return <p className="p-8 text-center text-muted-foreground">Cargando carrito...</p>;
  if (error) return <p className="p-8 text-center text-red-600">Error: {error}</p>;
  if (!carrito || carrito.items.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-display text-primary mb-4">Carrito vacío</h1>
        <p className="text-muted-foreground mb-6">Agrega productos desde el catálogo.</p>
        <Link to="/">
          <Button>Ir al catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display text-primary mb-6">Carrito</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          {carrito.items.map((item) => (
            <div key={item.productoId} className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-semibold">{item.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {item.cantidad} x Bs {(item.precioUnitarioCentavos / 100).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Bs {(item.subtotalCentavos / 100).toFixed(2)}</span>
                <Button variant="ghost" size="sm" onClick={() => quitarDelCarrito(Number(item.productoId))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4">
            <span className="text-lg font-bold">Total: Bs {(carrito.totalCentavos / 100).toFixed(2)}</span>
            <Link to="/checkout">
              <Button>Ir a pagar</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
