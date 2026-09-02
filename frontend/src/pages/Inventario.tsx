import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ProductoStock = {
  productoId: string;
  nombre: string;
  categoria: string;
  stockTotal: number;
  stockReservado: number;
  stockDisponible: number;
};

type EventoStock = {
  id: string;
  productoId: string;
  tipo: string;
  cantidad: number;
  timestamp: number;
};

export default function Inventario() {
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [eventos, setEventos] = useState<EventoStock[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4000/api/inventario/stock')
      .then((res) => res.json())
      .then((data: ProductoStock[]) => setProductos(data))
      .catch(() => console.error('Error al cargar stock'));
  }, []);

  const cargarEventos = async (productoId: string) => {
    setProductoSeleccionado(productoId);
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:4000/api/inventario/eventos/${productoId}`);
      const data: EventoStock[] = await res.json();
      setEventos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-display text-primary mb-6">Inventario en vivo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {productos.map((p) => (
            <Card
              key={p.productoId}
              className={`cursor-pointer transition ${productoSeleccionado === p.productoId ? 'ring-2 ring-primary' : ''}`}
              onClick={() => cargarEventos(p.productoId)}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{p.nombre}</p>
                  <p className="text-sm text-muted-foreground">{p.categoria}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Total: {p.stockTotal}</p>
                  <p className="text-sm">Reservado: {p.stockReservado}</p>
                  <p className="font-bold text-secondary">Disponible: {p.stockDisponible}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Eventos del producto</h2>
          {productoSeleccionado ? (
            cargando ? (
              <p className="text-muted-foreground">Cargando eventos...</p>
            ) : (
              <div className="space-y-2">
                {eventos.length === 0 ? (
                  <p className="text-muted-foreground">Sin eventos</p>
                ) : (
                  eventos.map((ev) => (
                    <div key={ev.id} className="border rounded-lg p-3 bg-card">
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary">{ev.tipo}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1">Cantidad: {ev.cantidad}</p>
                    </div>
                  ))
                )}
              </div>
            )
          ) : (
            <p className="text-muted-foreground">Selecciona un producto para ver su historial</p>
          )}
        </div>
      </div>
    </div>
  );
}
