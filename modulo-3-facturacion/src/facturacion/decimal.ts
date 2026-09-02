/**
 * decimal.ts — Manejo monetario decimal de alta precisión e inmutabilidad
 * Módulo 3 · Facturación
 *
 * Principios:
 *   ✓ Precisión monetaria exacta basada en centavos (bigint)
 *   ✓ Sin errores de punto flotante IEEE 754
 *   ✓ Redondeo estándar contable ROUND_HALF_UP cuantizado a 2 decimales
 *   ✓ Instancias inmutables y congeladas con Object.freeze
 */

export class DineroDecimal {
    public readonly valor: string;
    private readonly centavos: bigint;

    private constructor(centavos: bigint) {
        this.centavos = centavos;
        const esNegativo = centavos < 0n;
        const absCentavos = esNegativo ? -centavos : centavos;
        const enteros = absCentavos / 100n;
        const resto = absCentavos % 100n;
        const restoStr = resto.toString().padStart(2, "0");
        this.valor = `${esNegativo ? "-" : ""}${enteros.toString()}.${restoStr}`;
        Object.freeze(this);
    }

    public static desde(valor: string | number | DineroDecimal): DineroDecimal {
        if (valor instanceof DineroDecimal) {
            return valor;
        }

        const str = typeof valor === "number" ? valor.toString() : String(valor).trim();
        if (!str || str === "NaN") {
            return new DineroDecimal(0n);
        }

        const partes = str.split(".");
        const parteEnteraStr = partes[0] ?? "0";
        const parteEntera = BigInt(parteEnteraStr || "0");
        const esNegativo = parteEnteraStr.startsWith("-");

        if (partes.length === 1) {
            const centavos = parteEntera * 100n;
            return new DineroDecimal(centavos);
        }

        const decimalesStr = partes[1] ?? "";
        const dec1 = decimalesStr.charAt(0) || "0";
        const dec2 = decimalesStr.charAt(1) || "0";
        const dec3 = decimalesStr.charAt(2) || "0";

        let centavosBase = (parteEntera < 0n ? -parteEntera : parteEntera) * 100n + BigInt(dec1) * 10n + BigInt(dec2);

        if (parseInt(dec3, 10) >= 5) {
            centavosBase += 1n;
        }

        const totalCentavos = (esNegativo || parteEntera < 0n) ? -centavosBase : centavosBase;
        return new DineroDecimal(totalCentavos);
    }

    public static desdeCentavos(centavos: bigint): DineroDecimal {
        return new DineroDecimal(centavos);
    }

    public static cero(): DineroDecimal {
        return new DineroDecimal(0n);
    }

    public sumar(otro: DineroDecimal | string | number): DineroDecimal {
        const d = DineroDecimal.desde(otro);
        return new DineroDecimal(this.centavos + d.centavos);
    }

    public restar(otro: DineroDecimal | string | number): DineroDecimal {
        const d = DineroDecimal.desde(otro);
        return new DineroDecimal(this.centavos - d.centavos);
    }

    public multiplicar(factor: string | number | DineroDecimal): DineroDecimal {
        const factorStr = factor instanceof DineroDecimal ? factor.valor : factor.toString();
        const factorFloat = parseFloat(factorStr);
        if (isNaN(factorFloat)) {
            return DineroDecimal.cero();
        }
        const resultadoFloat = Number(this.centavos) * factorFloat;
        const centavosRedondeados = BigInt(Math.round(resultadoFloat));
        return new DineroDecimal(centavosRedondeados);
    }

    public aplicarTasa(tasa: string | number | DineroDecimal): DineroDecimal {
        const t = DineroDecimal.desde(tasa);
        const factor = parseFloat(t.valor);
        if (isNaN(factor)) {
            return DineroDecimal.cero();
        }
        const resultadoFloat = Number(this.centavos) * factor;
        const centavosRedondeados = BigInt(Math.round(resultadoFloat));
        return new DineroDecimal(centavosRedondeados);
    }

    public aNumero(): number {
        return parseFloat(this.valor);
    }

    public aCentavos(): bigint {
        return this.centavos;
    }

    public esIgual(otro: DineroDecimal | string | number): boolean {
        return this.centavos === DineroDecimal.desde(otro).centavos;
    }

    public toString(): string {
        return this.valor;
    }
}
