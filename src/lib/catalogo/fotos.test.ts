import type { ImageMetadata } from 'astro';
import { describe, expect, it } from 'vitest';
import { fotoPrincipal, fotosDoProduto, textoAlternativo, type FotoResolvida } from './fotos';

const imagem = { src: '/x.webp', width: 800, height: 1000, format: 'webp' } as ImageMetadata;
const foto = (numero: number, cor?: string): FotoResolvida => ({ imagem, cor, numero, alt: '' });

describe('textoAlternativo', () => {
  it('nome, cor e número', () => {
    expect(textoAlternativo('Camisa Polo', 'Preta', 2)).toBe('Camisa Polo, cor preta — foto 2');
    expect(textoAlternativo('Boné', undefined, 1)).toBe('Boné — foto 1');
  });
});

describe('fotoPrincipal', () => {
  it('prefere a nº 1 geral', () => {
    expect(fotoPrincipal([foto(1, 'Preta'), foto(2), foto(1)])?.numero).toBe(1);
    expect(fotoPrincipal([foto(1, 'Preta'), foto(2), foto(1)])?.cor).toBeUndefined();
  });
  it('sem geral, usa a primeira de cor', () => {
    expect(fotoPrincipal([foto(1, 'Preta')])?.cor).toBe('Preta');
  });
  it('sem fotos, nada', () => {
    expect(fotoPrincipal([])).toBeUndefined();
  });
});

describe('fotosDoProduto', () => {
  it('caminho inexistente é ignorado (placeholder), sem quebrar', () => {
    const fotos = fotosDoProduto({ id: 'x', nome: 'X', fotos: ['x/1.webp'], opcoes: [] });
    expect(fotos).toEqual([]);
  });
});
