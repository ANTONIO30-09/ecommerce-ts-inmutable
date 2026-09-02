import { Router } from 'express';
import { validarCupon, aplicarCupon, type Cupon } from '../../../modulo-2-motor-precios/src/descuentos-cupones/cupones.ts';

export const cuponesRouter = Router();

// Cupón fijo de ejemplo (en un sistema real estaría en BD)
const cuponBienvenida: Cupon = {
  codigo: 'BIENVENIDA10',
  vigente: true,
  usosActuales: 0,
  limiteUsos: 100,
  compraMinima: 500n, // Bs 5.00
  tipo: 'PORCENTAJE',
  valor: 10n, // 10%
};

cuponesRouter.post('/validar', (req, res) => {
  try {
    const { codigo, totalCentavos } = req.body as { codigo: string; totalCentavos: string | number };
    if (codigo !== cuponBienvenida.codigo) {
      return res.status(404).json({ ok: false, error: 'CUPON_NO_ENCONTRADO' });
    }
    const total = BigInt(totalCentavos);
    const resultado = validarCupon(cuponBienvenida, total);
    if (!resultado.ok) {
      return res.status(400).json({ ok: false, error: resultado.error });
    }
    res.json({ ok: true, codigo, mensaje: 'Cupón válido' });
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Error al validar cupón' });
  }
});

cuponesRouter.post('/aplicar', (req, res) => {
  try {
    const { codigo, totalCentavos } = req.body as { codigo: string; totalCentavos: string | number };
    if (codigo !== cuponBienvenida.codigo) {
      return res.status(404).json({ ok: false, error: 'CUPON_NO_ENCONTRADO' });
    }
    const total = BigInt(totalCentavos);
    const resultado = aplicarCupon(total, cuponBienvenida);
    if (!resultado.ok) {
      return res.status(400).json({ ok: false, error: resultado.error });
    }
    res.json({ ok: true, totalOriginalCentavos: Number(total), totalConDescuentoCentavos: Number(resultado.valor) });
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Error al aplicar cupón' });
  }
});
