import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Store, ShoppingCart, RotateCcw, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCarrito } from '@/context/CarritoContext';

export default function Navbar() {
  const { carrito } = useCarrito();
  const totalItems = carrito?.items.reduce((acc, item) => acc + item.cantidad, 0) || 0;

  return (
    <header className="sticky top-0 z-10 bg-card border-b border-border shadow-card">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-display text-primary flex items-center gap-2">
          <Store className="h-5 w-5" />
          La Esquina
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm">Catálogo</Button>
          </Link>
          <Link to="/carrito">
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="mr-1 h-4 w-4" />
              Carrito
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </Button>
          </Link>
          <Link to="/devoluciones">
            <Button variant="ghost" size="sm">
              <RotateCcw className="mr-1 h-4 w-4" />
              Devoluciones
            </Button>
          </Link>
          <Link to="/inventario">
            <Button variant="ghost" size="sm">
              <Package className="mr-1 h-4 w-4" />
              Inventario
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
