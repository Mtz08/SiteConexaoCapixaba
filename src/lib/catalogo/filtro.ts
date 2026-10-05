import { casaBusca } from '../texto';

/** Ordenações da loja. O valor é o que vai na URL (?ordem=...). */
export const ORDENACOES = [
  { valor: 'destaques', rotulo: 'Destaques' },
  { valor: 'preco-asc', rotulo: 'Menor preço' },
  { valor: 'preco-desc', rotulo: 'Maior preço' },
  { valor: 'az', rotulo: 'A–Z' },
] as const;

export type Ordem = (typeof ORDENACOES)[number]['valor'];
export const ORDEM_PADRAO: Ordem = 'destaques';

export interface Filtros {
  categoria: string | null;
  busca: string;
  ordem: Ordem;
}

/** Dados mínimos de cada cartão (lidos dos data-* no navegador). */
export interface ItemFiltro {
  id: string;
  categoria: string;
  busca: string;
  /** Menor preço, em centavos. */
  preco: number;
  /** Posição na ordem padrão (destaques primeiro). */
  posicao: number;
  nome: string;
}

const comparadores: Record<Ordem, (a: ItemFiltro, b: ItemFiltro) => number> = {
  destaques: (a, b) => a.posicao - b.posicao,
  'preco-asc': (a, b) => a.preco - b.preco || a.posicao - b.posicao,
  'preco-desc': (a, b) => b.preco - a.preco || a.posicao - b.posicao,
  az: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
};

/** Ids visíveis, na ordem em que devem aparecer. */
export function filtrarEOrdenar(itens: ItemFiltro[], filtros: Filtros): string[] {
  return itens
    .filter((i) => filtros.categoria === null || i.categoria === filtros.categoria)
    .filter((i) => casaBusca(filtros.busca, i.busca))
    .sort(comparadores[filtros.ordem])
    .map((i) => i.id);
}

function ehOrdem(valor: string | null): valor is Ordem {
  return ORDENACOES.some((o) => o.valor === valor);
}

/** Lê ?categoria=&ordem=&busca= ignorando valores inválidos. */
export function lerFiltrosDaUrl(parametros: URLSearchParams, categoriasValidas: string[]): Filtros {
  const categoria = parametros.get('categoria');
  const ordem = parametros.get('ordem');
  return {
    categoria: categoria && categoriasValidas.includes(categoria) ? categoria : null,
    busca: (parametros.get('busca') ?? '').slice(0, 80),
    ordem: ehOrdem(ordem) ? ordem : ORDEM_PADRAO,
  };
}

/** Query string só com o que difere do padrão ("" quando nada). */
export function filtrosParaQuery(filtros: Filtros, incluirCategoria = true): string {
  const parametros = new URLSearchParams();
  if (incluirCategoria && filtros.categoria) parametros.set('categoria', filtros.categoria);
  if (filtros.ordem !== ORDEM_PADRAO) parametros.set('ordem', filtros.ordem);
  if (filtros.busca.trim()) parametros.set('busca', filtros.busca.trim());
  const query = parametros.toString();
  return query ? `?${query}` : '';
}

/** Ordem padrão da loja: destaques primeiro, mantendo a ordem do catálogo. */
export function ordenarPorDestaque<T extends { destaque: boolean }>(produtos: T[]): T[] {
  return [...produtos].sort((a, b) => Number(b.destaque) - Number(a.destaque));
}
