import { DeepReadonly, crearInmutable } from '../shared/inmutable';

/**
 * Estado base del producto. Usa `bigint` para evitar errores de precisión flotante en cálculos financieros.
 */
interface ProductoBase {
  id: string;
  nombre: string;
  precioCentavos: bigint; // 100 = $1.00
  categoria: string;
  stock: number;
  activo: boolean;
}

/**
 * Entidad 100% inmutable expuesta para el uso en el resto de la aplicación.
 */
export type Producto = DeepReadonly<ProductoBase>;

/**
 * Función pura: Crea y retorna un producto completamente sellado e inmutable.
 */
export const crearProducto = (
  id: string,
  nombre: string,
  precioCentavos: bigint,
  categoria: string,
  stockInicial: number
): Producto => {
  return crearInmutable({
    id,
    nombre,
    precioCentavos,
    categoria,
    stock: stockInicial,
    activo: true
  });
};

/**
 * Función pura: Reduce el stock retornando una NUEVA copia del producto (sin mutar el original) 
 * para prevenir condiciones de carrera y soportar Event Sourcing.
 */
export const reducirStock = (producto: Producto, cantidad: number): Producto => {
  if (cantidad > producto.stock) {
    throw new Error(`Stock insuficiente para el producto ${producto.id}`);
  }

  return crearInmutable({
    ...producto,
    stock: producto.stock - cantidad
  });
};

/**
 * Función pura: Actualiza el precio retornando una nueva instancia en memoria.
 */
export const actualizarPrecio = (producto: Producto, nuevoPrecioCentavos: bigint): Producto => {
  if (nuevoPrecioCentavos < 0n) { 
    throw new Error('El precio no puede ser negativo');
  }

  return crearInmutable({
    ...producto,
    precioCentavos: nuevoPrecioCentavos
  });
};

/**
 * Función pura: Cambia el estado a inactivo en una nueva copia, en lugar de mutar o eliminar el registro.
 */
export const desactivarProducto = (producto: Producto): Producto => {
  return crearInmutable({
    ...producto,
    activo: false
  });
};