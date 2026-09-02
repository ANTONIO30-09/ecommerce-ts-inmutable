import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type ItemCarrito = {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitarioCentavos: number;
  subtotalCentavos: number;
};

export type Carrito = {
  id: string;
  version: number;
  items: ItemCarrito[];
  totalCentavos: number;
};

type CarritoContextType = {
  carrito: Carrito | null;
  cargando: boolean;
  error: string | null;
  agregarAlCarrito: (productoId: number, cantidad: number) => Promise<void>;
  quitarDelCarrito: (productoId: number) => Promise<void>;
  vaciarCarrito: () => void;
};

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

const API = 'http://localhost:4000/api';

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carritoId = localStorage.getItem('carritoId');
    if (carritoId) {
      fetch(`${API}/carritos/${carritoId}`)
        .then((res) => {
          if (!res.ok) throw new Error('No se pudo cargar el carrito');
          return res.json();
        })
        .then((data: Carrito) => setCarrito(data))
        .catch(() => setCarrito(null));
    }
  }, []);

  const crearCarritoSiNecesario = async (): Promise<string> => {
    let carritoId = localStorage.getItem('carritoId');
    if (carritoId) return carritoId;
    const res = await fetch(`${API}/carritos`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al crear carrito');
    const nuevo: Carrito = await res.json();
    localStorage.setItem('carritoId', nuevo.id);
    setCarrito(nuevo);
    return nuevo.id;
  };

  const agregarAlCarrito = async (productoId: number, cantidad: number) => {
    setCargando(true);
    setError(null);
    try {
      const carritoId = await crearCarritoSiNecesario();
      const res = await fetch(`${API}/carritos/${carritoId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productoId, cantidad }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al agregar producto');
      }
      const actualizado: Carrito = await res.json();
      setCarrito(actualizado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar');
    } finally {
      setCargando(false);
    }
  };

  const quitarDelCarrito = async (productoId: number) => {
    if (!carrito) return;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${API}/carritos/${carrito.id}/items/${productoId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al quitar producto');
      }
      const actualizado: Carrito = await res.json();
      setCarrito(actualizado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al quitar');
    } finally {
      setCargando(false);
    }
  };

  const vaciarCarrito = () => {
    setCarrito(null);
    localStorage.removeItem('carritoId');
  };

  return (
    <CarritoContext.Provider value={{ carrito, cargando, error, agregarAlCarrito, quitarDelCarrito, vaciarCarrito }}>
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return ctx;
}
