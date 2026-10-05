import { describe, expect, it } from 'vitest';
import { casaBusca, normalizar, slugificar, textoDeBusca } from './texto';

describe('normalizar', () => {
  it('tira acento e caixa', () => {
    expect(normalizar('  Boné CAPIXABA  ')).toBe('bone capixaba');
    expect(normalizar('Conexão')).toBe('conexao');
  });
});

describe('slugificar', () => {
  it.each([
    ['Camiseta Rei da Estrada', 'camiseta-rei-da-estrada'],
    ['Boné Conexão Capixaba!', 'bone-conexao-capixaba'],
    ['  Preta  ', 'preta'],
    ['Azul-Marinho', 'azul-marinho'],
    ['P/M', 'p-m'],
  ])('%s → %s', (entrada, esperado) => {
    expect(slugificar(entrada)).toBe(esperado);
  });
});

describe('busca', () => {
  const indice = textoDeBusca(['Camiseta Rei da Estrada', 'Camisetas', 'caminhoneiro', undefined]);

  it('casa palavras em qualquer ordem e sem acento', () => {
    expect(casaBusca('rei', indice)).toBe(true);
    expect(casaBusca('estrada camiseta', indice)).toBe(true);
    expect(casaBusca('CAMINHÔNEIRO', indice)).toBe(true);
  });

  it('exige todas as palavras', () => {
    expect(casaBusca('rei bone', indice)).toBe(false);
  });

  it('consulta vazia casa tudo', () => {
    expect(casaBusca('   ', indice)).toBe(true);
  });
});
