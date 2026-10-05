import { getCollection } from 'astro:content';
import type { Categoria, Produto, TabelaMedidas } from './schema';

/**
 * Consultas ao catálogo (rodam no build). Páginas e componentes usam SÓ estas funções,
 * nunca `getCollection` direto, para que a regra de "ativo" e a ordenação sejam as mesmas
 * em todo o site.
 */

/** Por `ordem` (sem ordem vai para o fim) e depois por nome. */
export function ordenarProdutos(produtos: Produto[]): Produto[] {
  return [...produtos].sort(
    (a, b) =>
      (a.ordem ?? Number.MAX_SAFE_INTEGER) - (b.ordem ?? Number.MAX_SAFE_INTEGER) ||
      a.nome.localeCompare(b.nome, 'pt-BR'),
  );
}

export async function listarCategorias(): Promise<Categoria[]> {
  const entradas = await getCollection('categorias');
  return entradas.map((e) => e.data).sort((a, b) => a.ordem - b.ordem);
}

/** Produtos visíveis no site (ativo: true), já ordenados. */
export async function listarProdutos(): Promise<Produto[]> {
  const entradas = await getCollection('produtos', (e) => e.data.ativo);
  return ordenarProdutos(entradas.map((e) => e.data));
}

export async function listarDestaques(): Promise<Produto[]> {
  return (await listarProdutos()).filter((p) => p.destaque);
}

export async function listarPorCategoria(idCategoria: string): Promise<Produto[]> {
  return (await listarProdutos()).filter((p) => p.categoria === idCategoria);
}

export async function mapaCategorias(): Promise<Map<string, Categoria>> {
  return new Map((await listarCategorias()).map((c) => [c.id, c]));
}

export async function listarTabelasDeMedidas(): Promise<TabelaMedidas[]> {
  return (await getCollection('medidas')).map((e) => e.data);
}

/** Tabela de medidas da categoria, se houver. */
export async function tabelaDeMedidas(idCategoria: string): Promise<TabelaMedidas | undefined> {
  return (await listarTabelasDeMedidas()).find((t) => t.categorias.includes(idCategoria));
}
