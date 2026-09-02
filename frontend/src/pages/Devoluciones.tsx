import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type FacturaAPI = {
  id: string;
  version: number;
  estado: string;
  subtotalCentavos: number;
  descuentoCentavos: number;
  totalCentavos: number;
  items: Array<{
    productoId: number;
    cantidad: number;
    precioUnitarioCentavos: number;
    subtotalCentavos: number;
  }>;
};

type ResultadoDevolucion = {
  facturaId: string;
  estado: string;
  version: number;
  montoReembolsoCentavos: number;
  detalleProrrateo: {
    precioUnitarioCentavos: number;
    subtotalCentavos: number;
    descuentoGlobalCentavos: number;
    descuentoProrrateadoCentavos: number;
    reembolsoNetoCentavos: number;
  };
};

export default function Devoluciones() {
  const [facturaIdInput, setFacturaIdInput] = useState('');
  const [factura, setFactura] = useState<FacturaAPI | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoDevolucion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarFactura = async () => {
    setError(null);
    setResultado(null);
    setProductoSeleccionado(null);
    if (!facturaIdInput.trim()) return;
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:4000/api/facturas/${facturaIdInput.trim()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Factura no encontrada');
      }
      const data: FacturaAPI = await res.json();
      setFactura(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar factura');
    } finally {
      setCargando(false);
    }
  };

  const confirmarDevolucion = async () => {
    if (!factura || productoSeleccionado === null) return;
    setCargando(true);
    setError(null);
    try {
      // Primero aseguramos que la factura esté Pagada
      const pagoRes = await fetch(`http://localhost:4000/api/facturas/${factura.id}/pagar`, { method: 'POST' });
      if (!pagoRes.ok) {
        const data = await pagoRes.json();
        if (data.error !== 'Factura Emitida no encontrada') throw new Error(data.error || 'Error al pagar factura');
      }

      // Usar la factura pagada para la devolución
      const facturaPagar = await pagoRes.json();
      const facturaPagadaId = facturaPagar.facturaId || `${factura.id}-v${factura.version + 1}`;

      const devRes = await fetch('http://localhost:4000/api/facturas/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facturaId: facturaPagadaId, productoId: productoSeleccionado }),
      });
      if (!devRes.ok) {
        const data = await devRes.json();
        throw new Error(data.error || 'Error en la devolución');
      }
      const data: ResultadoDevolucion = await devRes.json();
      setResultado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la devolución');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display text-primary mb-6">Devoluciones</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">ID de Factura</label>
            <Input
              value={facturaIdInput}
              onChange={(e) => setFacturaIdInput(e.target.value)}
              placeholder="Pega el ID de la factura"
              className="mt-1"
            />
          </div>
          <Button onClick={buscarFactura} disabled={cargando}>
            Buscar factura
          </Button>

          {error && <p className="text-red-600">{error}</p>}

          {factura && !resultado && (
            <div className="border-t pt-4 space-y-3">
              <p className="font-semibold">Factura {factura.id}</p>
              <p>Estado: {factura.estado}</p>
              <p>Subtotal: Bs {(factura.subtotalCentavos / 100).toFixed(2)}</p>
              <p>Total: Bs {(factura.totalCentavos / 100).toFixed(2)}</p>
              <p className="font-medium">Selecciona el producto a devolver:</p>
              <div className="space-y-2">
                {factura.items.map((item) => (
                  <label key={item.productoId} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="productoDevolucion"
                      checked={productoSeleccionado === item.productoId}
                      onChange={() => setProductoSeleccionado(item.productoId)}
                    />
                    <span>Producto #{item.productoId} — Cantidad: {item.cantidad} — Bs {(item.subtotalCentavos / 100).toFixed(2)}</span>
                  </label>
                ))}
              </div>
              <Button onClick={confirmarDevolucion} disabled={productoSeleccionado === null || cargando}>
                Confirmar devolución
              </Button>
            </div>
          )}

          {resultado && (
            <div className="border-t pt-4 space-y-2">
              <p className="font-bold">Nota de crédito generada</p>
              <p>ID: {resultado.facturaId}</p>
              <p>Estado: {resultado.estado}</p>
              <p>Reembolso: Bs {(resultado.montoReembolsoCentavos / 100).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                Descuento prorrateado: Bs {(resultado.detalleProrrateo.descuentoProrrateadoCentavos / 100).toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
