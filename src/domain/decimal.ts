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

        const str = typeof valor === "number" ? valor.toString() : valor.trim();
        const partes = str.split(".");
        const parteEntera = BigInt(partes[0] || "0");
        const esNegativo = partes[0].startsWith("-");

        if (partes.length === 1) {
            return new DineroDecimal(parteEntera * 100n);
        }

        const decimalesStr = partes[1];
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
        const resultadoFloat = Number(this.centavos) * factorFloat;
        const centavosRedondeados = BigInt(Math.round(resultadoFloat));
        return new DineroDecimal(centavosRedondeados);
    }

    public aplicarTasa(tasa: string | number | DineroDecimal): DineroDecimal {
        const t = DineroDecimal.desde(tasa);
        const factor = parseFloat(t.valor);
        const resultadoFloat = Number(this.centavos) * factor;
        const centavosRedondeados = BigInt(Math.round(resultadoFloat));
        return new DineroDecimal(centavosRedondeados);
    }

    public aNumero(): number {
        return parseFloat(this.valor);
    }

    public toString(): string {
        return this.valor;
    }
}
