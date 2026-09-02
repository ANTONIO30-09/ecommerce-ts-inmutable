import { crearCliente } from "./domain/models.ts";
import { calcularLineaItem } from "./domain/calculos.ts";
import { emitirFactura, generarDocumentoFacturaTexto } from "./domain/facturacion.ts";

const cliente = crearCliente({
    nombre: "Nombre del cliente",
    rfcIdentificacion: "B12345678",
    email: "cliente@email.com",
    telefono: "(503) 555-0190",
    direccion: "Ciudad, Código postal",
});

const item1 = calcularLineaItem({
    id: "ITM-001",
    codigoProducto: "SRV-01",
    descripcion: "Descripción del proyecto o servicio 1",
    cantidad: 10,
    precioUnitario: "100.00",
    tasaDescuento: "0.05",
    tasaIva: "0.16",
});

const item2 = calcularLineaItem({
    id: "ITM-002",
    codigoProducto: "SRV-02",
    descripcion: "Descripción del proyecto o servicio 2",
    cantidad: 5,
    precioUnitario: "80.00",
    tasaDescuento: "0.00",
    tasaIva: "0.16",
});

const factura = emitirFactura({
    cliente,
    items: [item1, item2],
    folio: "100",
    moneda: "Bs.",
});

console.log(generarDocumentoFacturaTexto(factura));
