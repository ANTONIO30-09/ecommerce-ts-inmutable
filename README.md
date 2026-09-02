# Sistema de Facturación, Checkout y Motor de Búsqueda Declarativo para Tienda Web

Plataforma transaccional e-commerce de grado empresarial construida bajo el
paradigma de **Programación Funcional Pura, Inmutabilidad y Event Sourcing**.

## ¿Por qué este enfoque?

Los e-commerce tradicionales actualizan su estado sobreescribiendo la base
de datos, lo que genera tres problemas graves en alto tráfico: inconsistencias
financieras por float/double, condiciones de carrera en inventario (sobreventa),
y pérdida de auditabilidad al mutar carritos o facturas.

Este proyecto resuelve esto con un núcleo 100% determinista, sin efectos
secundarios y completamente auditable: **nada se modifica después de creado,
todo cambio genera una nueva versión de la estructura de datos.**

## Reglas globales (aplican a los 5 módulos)

- Sin mutación: todo con `readonly` + `Object.freeze`.
- Sin `number`/`float` para dinero: usar `bigint` (centavos) o precisión arbitraria.
- Sin bucles imperativos con contadores mutables: usar `map`, `filter`, `reduce`.
- Todo cambio de estado crea una nueva instancia; la anterior permanece intacta.

---

## Módulo 1: Dominio Inmutable y Estructuras de Datos

**Jefe:** Antonio Vicente Garcia Corrales
**Integrantes:**
- David Ignacio Bazoberry Grigoriu
- Grisly Sharon Lizarazu Nina
- Pablo Nicolas Villazon Quiroga

Define las entidades del sistema como estructuras congeladas (Read-Only).
Ninguna operación altera los objetos existentes.

**Estructuras principales:**
- `Producto`: ID, SKU, Nombre, Categoría, Precio_Base, Atributos, Etiquetas.
- `Carrito`: ID, Cliente, Lista de (Producto, Cantidad).
- `Regla_Descuento`: ID, Tipo (Porcentaje, Monto Fijo, 2x1), Condición_Aplicación.
- `Factura`: ID, Cliente, Estado (Emitida, Pagada, Anulada, Nota_Crédito), Ítems, Impuestos, Total.

---

## Módulo 2: Motor de Precios, Cupones y Reglas Comerciales

**Jefe:** Kevin Peña Jamachi
**Integrantes:**
- Allen Jhonatan Requena Heredia
- Cesar Gabriel Flores Coca

Tubería (pipeline) que toma un Carrito y aplica reglas de negocio de forma
secuencial sin mutar los datos originales. Cada paso del pipeline recibe un
estado y retorna un nuevo estado (subtotal, descuentos aplicados, impuestos,
total final).

---

## Módulo 3: Motor de Facturación, Prorrateo y Devoluciones

**Jefe:** Cristhian Alejandro Vargas Zambrana
**Integrantes:**
- Jose Gabriel Parraga Alvarez
- Franco Guerra Roca
- Misael Patrick Ramos Torrez

Maneja la generación de comprobantes fiscales y los cálculos financieros
proporcionales cuando hay modificaciones posteriores a la venta.

**Casos de uso funcionales:**
- **Emisión de Factura de Venta:** convierte un carrito calculado en un documento de facturación inmutable.
- **Prorrateo por Devolución Parcial:** si el cliente devuelve 1 ítem de un paquete con descuento global aplicado, el motor recalcula el beneficio proporcional del ítem devuelto y emite una Nota de Crédito por el valor exacto.
- **Ajuste por Cambio de Producto:** calcula la diferencia neta a cobrar o reembolsar al intercambiar productos de distinto valor en una orden ya facturada.

---

## Módulo 4: Engine de Búsqueda y Filtrado Declarativo (Search Engine)

**Jefe:** Juan Pablo Villca Revollo

Permite buscar tanto en el catálogo de productos como en el historial de
facturas mediante composición de predicados algebraicos.

**Composición de predicados:** operadores de orden superior `AND_ALL`,
`OR_ANY` y `NOT` combinables entre sí, con evaluación perezosa (lazy
evaluation) y short-circuit: en cuanto un predicado falla dentro de un
`AND_ALL`, se descarta el ítem sin evaluar el resto.

**Filtros de Facturas:** búsqueda combinada por rango de fechas, montos
totales, cliente y estado de pago (Pagada, Pendiente, Nota de Crédito).

---

## Módulo 5: Gestión de Inventario mediante Actores / Eventos

**Jefe:** Joshua Jhoel Chuquimia Amusquivar

El stock de la tienda no se sobreescribe con un UPDATE. Se administra
mediante el patrón Event Sourcing para evitar condiciones de carrera cuando
múltiples usuarios compran el mismo producto en simultáneo.

**Lógica funcional:** el stock actual es el resultado de reducir (FoldLeft)
todos los eventos pasados de ese producto.

**Tipos de eventos:** `StockIngresado`, `StockReservadoEnCarrito`,
`StockVendido`, `StockDevuelto`.

---

## Estructura del repositorio

```text
ecommerce-ts-inmutable/
├── modulo-1-dominio-inmutable/
├── modulo-2-motor-precios/
├── modulo-3-facturacion/
├── modulo-4-busqueda/
└── modulo-5-inventario/
```

## Registro de Estado — Módulos

| Módulo | Jefe | Estado |
|---|---|---|
| 1 — Dominio Inmutable | Antonio Vicente Garcia Corrales | Completo |
| 2 — Motor de Precios | Kevin Peña Jamachi | Completo |
| 3 — Facturación | Cristhian Alejandro Vargas Zambrana | Completo |
| 4 — Búsqueda | Juan Pablo Villca Revollo | En progreso |
| 5 — Inventario | Joshua Jhoel Chuquimia Amusquivar | En progreso |

> Cada módulo mantiene su propia tabla de rastreabilidad detallada (por
> colaborador y archivo) en el `README.md` dentro de su propia carpeta.

## Cómo contribuir

Antes de escribir código, lee `COMO_SUBIR_TU_PARTE_A_GITHUB.md` en la raíz
del repositorio. Resumen: clona el repo completo, trabaja solo dentro de tu
carpeta de módulo/entidad, sigue la convención de commits
`tipo: [Nombre] - descripción`, y haz `git pull` antes de cada `git push`.

## Stack técnico

TypeScript, sin librerías de mutación de estado.
