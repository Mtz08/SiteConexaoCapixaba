import { describe, expect, it } from 'vitest';
import { ehPaginaAtual } from './navegacao';

describe('ehPaginaAtual', () => {
  it('início só casa com a raiz', () => {
    expect(ehPaginaAtual('/', '/')).toBe(true);
    expect(ehPaginaAtual('/', '/loja')).toBe(false);
  });

  it('ignora barra final e .html', () => {
    expect(ehPaginaAtual('/sobre', '/sobre/')).toBe(true);
    expect(ehPaginaAtual('/sobre', '/sobre.html')).toBe(true);
  });

  it('com prefixo, marca a seção inteira', () => {
    expect(ehPaginaAtual('/loja', '/loja/camisetas', true)).toBe(true);
    expect(ehPaginaAtual('/loja', '/loja/camisetas')).toBe(false);
    expect(ehPaginaAtual('/loja', '/lojas', true)).toBe(false);
  });
});
