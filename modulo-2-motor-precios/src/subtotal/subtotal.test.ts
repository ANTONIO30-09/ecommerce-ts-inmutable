import {
  agregarProducto,
  crearCarrito,
  crearItemCarrito,
} from "../../../modulo-1-dominio-inmutable/src/carrito/carrito.js";

import {
  crearProducto,
} from "../../../modulo-1-dominio-inmutable/src/producto/producto.js";

import {
  calcularSubtotal,
  calcularSubtotalItem,
} from "./subtotal.js";

/**
 * ============================================================
 * PRUEBAS — RF2.1 CÁLCULO DEL SUBTOTAL
 * ============================================================
 */

const verificar = (
  condicion: boolean,
  mensaje: string
): void => {
  if (!condicion) {
    throw new Error(`Prueba fallida: ${mensaje}`);
  }
};

/**
 * Prueba 1:
 * precio unitario × cantidad.
 */
const subtotalItem = calcularSubtotalItem(
  1000n,
  3
);

verificar(
  subtotalItem === 3000n,
  "1000 × 3 debe ser 3000 centavos"
);

/**
 * Prueba 2:
 * un carrito vacío debe tener subtotal 0.
 */
const carritoVacio = crearCarrito(
  "CARRITO-TEST-VACIO"
);

verificar(
  calcularSubtotal(carritoVacio) === 0n,
  "Un carrito vacío debe tener subtotal 0"
);

/**
 * Prueba 3:
 * subtotal de varios productos.
 */
const producto1 = crearProducto(
  "TEST-P001",
  "Producto A",
  1000n,
  "TEST",
  10
);

const producto2 = crearProducto(
  "TEST-P002",
  "Producto B",
  500n,
  "TEST",
  10
);

let carrito = crearCarrito(
  "CARRITO-TEST"
);

carrito = agregarProducto(
  carrito,
  crearItemCarrito(producto1, 2)
);

carrito = agregarProducto(
  carrito,
  crearItemCarrito(producto2, 3)
);

/**
 * 1000 × 2 = 2000
 *  500 × 3 = 1500
 * ----------------
 * Total      = 3500
 */
verificar(
  calcularSubtotal(carrito) === 3500n,
  "El subtotal del carrito debe ser 3500 centavos"
);

console.log(
  "✓ Todas las pruebas de subtotal fueron superadas."
);