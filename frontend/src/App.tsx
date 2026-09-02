import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CarritoProvider } from './context/CarritoContext';
import Navbar from './components/Navbar';
import Catalogo from './pages/Catalogo';
import Carrito from './pages/Carrito';
import Checkout from './pages/Checkout';
import Devoluciones from './pages/Devoluciones';
import Inventario from './pages/Inventario';

export default function App() {
  const location = useLocation();

  return (
    <CarritoProvider>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Routes location={location}>
            <Route path="/" element={<Catalogo />} />
            <Route path="/carrito" element={<Carrito />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/devoluciones" element={<Devoluciones />} />
            <Route path="/inventario" element={<Inventario />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </CarritoProvider>
  );
}
