/**
 * Dinheiro SEMPRE em centavos inteiros dentro do código.
 * O tipo `Centavos` é "marcado" para o TypeScript não deixar misturar reais com centavos.
 */
declare const marcaCentavos: unique symbol;
export type Centavos = number & { readonly [marcaCentavos]: true };

const TOLERANCIA = 1e-6;

/** Garante que o número é um inteiro de centavos válido (≥ 0). */
export function centavos(valor: number): Centavos {
  if (!Number.isSafeInteger(valor) || valor < 0) {
    throw new RangeError(`Valor em centavos inválido: ${valor}. Use um inteiro maior ou igual a zero.`);
  }
  return valor as Centavos;
}

/** Verifica se um valor em reais tem no máximo 2 casas decimais. */
export function temNoMaximoDuasCasas(reais: number): boolean {
  if (!Number.isFinite(reais)) return false;
  const emCentavos = reais * 100;
  return Math.abs(emCentavos - Math.round(emCentavos)) < TOLERANCIA;
}

/** 129.9 → 12990. Recusa NaN, negativos e mais de 2 casas decimais. */
export function reaisParaCentavos(reais: number): Centavos {
  if (!Number.isFinite(reais) || reais < 0) {
    throw new RangeError(`Preço inválido: ${reais}.`);
  }
  if (!temNoMaximoDuasCasas(reais)) {
    throw new RangeError(`Preço com mais de 2 casas decimais: ${reais}.`);
  }
  return centavos(Math.round(reais * 100));
}

/** 12990 → "129.90" (formato usado em schema.org / JSON-LD). */
export function centavosParaDecimal(valor: Centavos): string {
  const reais = Math.floor(valor / 100);
  const resto = valor % 100;
  return `${reais}.${String(resto).padStart(2, '0')}`;
}

export function somar(...valores: Centavos[]): Centavos {
  return centavos(valores.reduce<number>((total, v) => total + v, 0));
}

export function multiplicar(valor: Centavos, quantidade: number): Centavos {
  if (!Number.isSafeInteger(quantidade) || quantidade < 0) {
    throw new RangeError(`Quantidade inválida: ${quantidade}.`);
  }
  return centavos(valor * quantidade);
}

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 12990 → "R$ 129,90" (com espaço não separável, para não quebrar linha na tela). */
export function formatarPreco(valor: Centavos): string {
  return formatador.format(valor / 100);
}

/** Igual a `formatarPreco`, mas com espaço comum — para texto puro (mensagem do WhatsApp). */
export function formatarPrecoTexto(valor: Centavos): string {
  return formatarPreco(valor).replace(/\s/g, ' ');
}
