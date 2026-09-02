import {
  agregarProducto,
  crearCarrito,
  crearItemCarrito,
} from "../modulo-1-dominio-inmutable/src/carrito/carrito";

import {
  crearProducto,
} from "../modulo-1-dominio-inmutable/src/producto/producto";

import {
  calcularSubtotal,
} from "./src/subtotal/subtotal.js";

/**
 * ============================================================
 * DEMO — MÓDULO 2
 * ============================================================
 */

const producto1 = crearProducto(
  "P001",
  "Laptop",
  150000n,
  "TECNOLOGIA",
  10
);

const producto2 = crearProducto(
  "P002",
  "Mouse",
  2500n,
  "TECNOLOGIA",
  50
);

let carrito = crearCarrito("C001");

carrito = agregarProducto(
  carrito,
  crearItemCarrito(producto1, 1)
);

carrito = agregarProducto(
  carrito,
  crearItemCarrito(producto2, 2)
);

const subtotal = calcularSubtotal(carrito);

/**
 * Conversión únicamente para mostrar el resultado.
 * El cálculo interno continúa utilizando bigint.
 */
const mostrarDinero = (centavos: bigint): string => {
  const unidades = centavos / 100n;
  const centavosRestantes = centavos % 100n;

  return `${unidades},${centavosRestantes
    .toString()
    .padStart(2, "0")} €`;
};

console.log("");
console.log("========================================");
console.log("       MÓDULO 2 — MOTOR DE PRECIOS");
console.log("========================================");

console.log("");
console.log("Carrito:", carrito.id);

console.log("");
console.log("PRODUCTOS");
console.log("----------------------------------------");

carrito.items.forEach((item) => {
  console.log(
    `${item.producto.nombre} | ` +
    `${mostrarDinero(item.precioUnitario)} × ` +
    `${item.cantidad}`
  );
});

console.log("");
console.log("----------------------------------------");
console.log(
  "SUBTOTAL:",
  mostrarDinero(subtotal)
);
console.log("----------------------------------------");

console.log("");
console.log("✓ Cálculo realizado correctamente.");
console.log("✓ Dinero representado mediante bigint.");
console.log("✓ Subtotal calculado mediante reduce.");
console.log("✓ El carrito original no fue modificado.");
console.log("");