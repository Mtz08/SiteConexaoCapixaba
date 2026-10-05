import { describe, expect, it } from 'vitest';
import {
  centavos,
  centavosParaDecimal,
  formatarPreco,
  formatarPrecoTexto,
  multiplicar,
  reaisParaCentavos,
  somar,
  temNoMaximoDuasCasas,
} from './dinheiro';

describe('reaisParaCentavos', () => {
  it.each([
    [129.9, 12990],
    [129.99, 12999],
    [12.9, 1290],
    [0.1, 10],
    [0.29, 29], // 0.29 * 100 = 28.999999999999996 em ponto flutuante
    [1.005, null], // 3 casas: recusado
    [189.9, 18990],
    [10, 1000],
    [0, 0],
  ])('%s reais → %s centavos', (reais, esperado) => {
    if (esperado === null) {
      expect(() => reaisParaCentavos(reais)).toThrow(/2 casas/);
    } else {
      expect(reaisParaCentavos(reais)).toBe(esperado);
    }
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('recusa %s', (reais) => {
    expect(() => reaisParaCentavos(reais)).toThrow(RangeError);
  });
});

describe('temNoMaximoDuasCasas', () => {
  it('aceita até 2 casas', () => {
    expect(temNoMaximoDuasCasas(79.9)).toBe(true);
    expect(temNoMaximoDuasCasas(79.95)).toBe(true);
    expect(temNoMaximoDuasCasas(79)).toBe(true);
  });
  it('recusa 3 casas ou mais', () => {
    expect(temNoMaximoDuasCasas(79.999)).toBe(false);
    expect(temNoMaximoDuasCasas(0.001)).toBe(false);
  });
});

describe('centavos', () => {
  it('recusa fração e negativo', () => {
    expect(() => centavos(10.5)).toThrow(RangeError);
    expect(() => centavos(-1)).toThrow(RangeError);
  });
});

describe('somar e multiplicar', () => {
  it('soma sem erro de ponto flutuante', () => {
    // Em reais: 0.1 + 0.2 = 0.30000000000000004. Em centavos: exato.
    expect(somar(centavos(10), centavos(20))).toBe(30);
    expect(somar(reaisParaCentavos(259.8), reaisParaCentavos(12.9))).toBe(27270);
  });

  it('soma vazia é zero', () => {
    expect(somar()).toBe(0);
  });

  it('multiplica por quantidade inteira', () => {
    expect(multiplicar(reaisParaCentavos(129.9), 2)).toBe(25980);
    expect(() => multiplicar(centavos(100), 1.5)).toThrow(RangeError);
    expect(() => multiplicar(centavos(100), -1)).toThrow(RangeError);
  });
});

describe('formatação', () => {
  it('formata em reais no padrão brasileiro', () => {
    expect(formatarPrecoTexto(centavos(12990))).toBe('R$ 129,90');
    expect(formatarPrecoTexto(centavos(27270))).toBe('R$ 272,70');
    expect(formatarPrecoTexto(centavos(123456))).toBe('R$ 1.234,56');
    expect(formatarPrecoTexto(centavos(5))).toBe('R$ 0,05');
  });

  it('na tela usa espaço não separável', () => {
    expect(formatarPreco(centavos(1290))).toBe('R$ 12,90');
  });

  it('formato decimal para JSON-LD', () => {
    expect(centavosParaDecimal(centavos(12990))).toBe('129.90');
    expect(centavosParaDecimal(centavos(5))).toBe('0.05');
    expect(centavosParaDecimal(centavos(100000))).toBe('1000.00');
  });
});
