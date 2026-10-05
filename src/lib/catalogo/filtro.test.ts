import { describe, expect, it } from 'vitest';
import {
  filtrarEOrdenar,
  filtrosParaQuery,
  lerFiltrosDaUrl,
  ordenarPorDestaque,
  type ItemFiltro,
} from './filtro';

const itens: ItemFiltro[] = [
  {
    id: 'polo',
    categoria: 'polo',
    busca: 'camisa polo bordada',
    preco: 12990,
    posicao: 0,
    nome: 'Camisa Polo',
  },
  {
    id: 'rei',
    categoria: 'camisetas',
    busca: 'camiseta rei da estrada',
    preco: 7990,
    posicao: 1,
    nome: 'Camiseta Rei',
  },
  {
    id: 'vida',
    categoria: 'camisetas',
    busca: 'camiseta vida caminhoneiro',
    preco: 7990,
    posicao: 2,
    nome: 'Camiseta Vida',
  },
  { id: 'adesivo', categoria: 'adesivos', busca: 'adesivo vidro', preco: 1290, posicao: 3, nome: 'Adesivo' },
];

const padrao = { categoria: null, busca: '', ordem: 'destaques' } as const;

describe('filtrarEOrdenar', () => {
  it('sem filtro, ordem padrão', () => {
    expect(filtrarEOrdenar(itens, padrao)).toEqual(['polo', 'rei', 'vida', 'adesivo']);
  });

  it('por categoria', () => {
    expect(filtrarEOrdenar(itens, { ...padrao, categoria: 'camisetas' })).toEqual(['rei', 'vida']);
  });

  it('por busca, sem acento', () => {
    expect(filtrarEOrdenar(itens, { ...padrao, busca: 'Caminhonéiro' })).toEqual(['vida']);
    expect(filtrarEOrdenar(itens, { ...padrao, busca: 'xyz' })).toEqual([]);
  });

  it('menor e maior preço, empate pela posição', () => {
    expect(filtrarEOrdenar(itens, { ...padrao, ordem: 'preco-asc' })).toEqual([
      'adesivo',
      'rei',
      'vida',
      'polo',
    ]);
    expect(filtrarEOrdenar(itens, { ...padrao, ordem: 'preco-desc' })).toEqual([
      'polo',
      'rei',
      'vida',
      'adesivo',
    ]);
  });

  it('A–Z', () => {
    expect(filtrarEOrdenar(itens, { ...padrao, ordem: 'az' })).toEqual(['adesivo', 'polo', 'rei', 'vida']);
  });

  it('não altera a lista original', () => {
    const copia = structuredClone(itens);
    filtrarEOrdenar(itens, { ...padrao, ordem: 'az' });
    expect(itens).toEqual(copia);
  });
});

describe('URL', () => {
  const categorias = ['polo', 'camisetas', 'adesivos'];

  it('lê filtros válidos', () => {
    expect(
      lerFiltrosDaUrl(new URLSearchParams('categoria=camisetas&ordem=preco-asc&busca=rei'), categorias),
    ).toEqual({
      categoria: 'camisetas',
      busca: 'rei',
      ordem: 'preco-asc',
    });
  });

  it('ignora valores inválidos', () => {
    expect(lerFiltrosDaUrl(new URLSearchParams('categoria=xxx&ordem=barato'), categorias)).toEqual(padrao);
  });

  it('escreve só o que difere do padrão', () => {
    expect(filtrosParaQuery(padrao)).toBe('');
    expect(filtrosParaQuery({ categoria: 'camisetas', busca: ' rei ', ordem: 'preco-asc' })).toBe(
      '?categoria=camisetas&ordem=preco-asc&busca=rei',
    );
    expect(filtrosParaQuery({ categoria: 'camisetas', busca: '', ordem: 'az' }, false)).toBe('?ordem=az');
  });

  it('ida e volta', () => {
    const filtros = { categoria: 'polo', busca: 'boné azul', ordem: 'az' } as const;
    const query = filtrosParaQuery(filtros);
    expect(lerFiltrosDaUrl(new URLSearchParams(query), categorias)).toEqual(filtros);
  });
});

describe('ordenarPorDestaque', () => {
  it('destaques primeiro, ordem estável', () => {
    const lista = [
      { id: 'a', destaque: false },
      { id: 'b', destaque: true },
      { id: 'c', destaque: false },
      { id: 'd', destaque: true },
    ];
    expect(ordenarPorDestaque(lista).map((p) => p.id)).toEqual(['b', 'd', 'a', 'c']);
  });
});
