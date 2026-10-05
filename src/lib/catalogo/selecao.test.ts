import { describe, expect, it } from 'vitest';
import { centavos } from '../dinheiro';
import { comArtigo, escolherValor, limitarQuantidade, rotuloCompra } from './selecao';
import type { DadosVariacao } from './variacoes';

const polo: DadosVariacao = {
  precoBase: centavos(12990),
  opcoes: [
    { nome: 'Tamanho', valores: ['P', 'M', 'G', 'GG'] },
    { nome: 'Cor', valores: ['Preta', 'Branca'] },
  ],
  variacoes: [{ combinacao: { Tamanho: 'P', Cor: 'Branca' }, disponivel: false }],
};

describe('escolherValor', () => {
  it('escolhe normalmente', () => {
    expect(escolherValor(polo, {}, 'Tamanho', 'G')).toEqual({ Tamanho: 'G' });
  });

  it('desmarca a cor que ficou impossível', () => {
    expect(escolherValor(polo, { Cor: 'Branca' }, 'Tamanho', 'P')).toEqual({ Tamanho: 'P' });
  });

  it('mantém o que continua possível', () => {
    expect(escolherValor(polo, { Cor: 'Preta' }, 'Tamanho', 'P')).toEqual({ Tamanho: 'P', Cor: 'Preta' });
  });
});

describe('rótulos', () => {
  it('artigo certo', () => {
    expect(comArtigo('Tamanho')).toBe('o tamanho');
    expect(comArtigo('Cor')).toBe('a cor');
    expect(comArtigo('Modelo')).toBe('o modelo');
  });

  it('botão orienta o que falta, na ordem', () => {
    expect(rotuloCompra(polo, {}, 'Comprar')).toBe('Escolha o tamanho');
    expect(rotuloCompra(polo, { Tamanho: 'G' }, 'Comprar')).toBe('Escolha a cor');
    expect(rotuloCompra(polo, { Tamanho: 'G', Cor: 'Preta' }, 'Comprar')).toBe('Comprar');
    expect(rotuloCompra({ ...polo, opcoes: [] }, {}, 'Comprar')).toBe('Comprar');
  });
});

describe('limitarQuantidade', () => {
  it.each([
    [3, 3, false],
    [0, 1, true],
    [-5, 1, true],
    [25, 20, true],
    [2.7, 2, true],
    [Number.NaN, 1, true],
  ])('%s → %s', (entrada, esperado, ajustada) => {
    expect(limitarQuantidade(entrada, 20)).toEqual({ quantidade: esperado, ajustada });
  });
});
