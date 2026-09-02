import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCarrito } from '@/context/CarritoContext';

type Producto = {
  id: string;
  nombre: string;
  categoria: string;
  precioCentavos: number;
  stock: number;
  activo: boolean;
};

export default function Catalogo() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pulsoId, setPulsoId] = useState<string | null>(null);
  const { agregarAlCarrito } = useCarrito();

  useEffect(() => {
    fetch('http://localhost:4000/api/productos')
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener productos');
        return res.json();
      })
      .then((data: Producto[]) => {
        setProductos(data);
        setCargando(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setCargando(false);
      });
  }, []);

  const manejarAgregar = async (id: number) => {
    setPulsoId(String(id));
    await agregarAlCarrito(id, 1);
    setTimeout(() => setPulsoId(null), 400);
  };

  if (cargando) return <p className="p-8 text-center text-muted-foreground">Cargando productos...</p>;
  if (error) return <p className="p-8 text-center text-red-600">Error: {error}</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display text-primary">Catálogo</h1>
        <Link to="/carrito">
          <Button variant="outline" size="sm">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Ver carrito
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {productos.map((p) => (
          <motion.div
            key={p.id}
            animate={pulsoId === p.id ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold text-lg">{p.nombre}</h2>
                  <Badge variant="secondary">{p.categoria}</Badge>
                </div>
                <p className="mt-2 text-xl font-bold text-primary">
                  Bs {(p.precioCentavos / 100).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Stock: {p.stock}</p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => manejarAgregar(Number(p.id))}
                >
                  Agregar al carrito
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
