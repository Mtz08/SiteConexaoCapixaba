import { atom, computed } from 'nanostores';
import { persistentAtom, setPersistentEngine, windowPersistentEvents } from '@nanostores/persistent';
import { criarMotorSeguro } from '../lib/armazenamento';
import {
  CHAVE_CARRINHO,
  adicionar,
  alterarQuantidade,
  carrinhoVazio,
  desfazerRemocao,
  lerCarrinhoSalvo,
  mesmoEstado,
  remover,
  revalidar,
  totalDeItens,
  type AvisoCarrinho,
  type EstadoCarrinho,
  type LinhaCarrinho,
  type ProdutoCatalogo,
} from '../lib/carrinho';
import type { Categoria } from '../lib/catalogo/schema';
import { site } from '../config/site';

// ---------------------------------------------------------------------------
// Armazenamento (antes de criar qualquer persistentAtom)
// ---------------------------------------------------------------------------

/** true quando o navegador não deixa salvar (aba anônima, Safari restrito, cota cheia). */
export const $armazenamentoIndisponivel = atom(false);

const { motor } = criarMotorSeguro(() => $armazenamentoIndisponivel.set(true));
setPersistentEngine(
  motor,
  typeof window !== 'undefined'
    ? windowPersistentEvents
    : { addEventListener() {}, removeEventListener() {} },
);

/** Valor "não salvar": o persistent apaga a chave quando o encode devolve undefined. */
const APAGAR = undefined as unknown as string;

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

/** Carrinho salvo no aparelho, sincronizado entre abas (evento `storage`). */
export const $carrinho = persistentAtom<EstadoCarrinho>(CHAVE_CARRINHO, carrinhoVazio(), {
  // Carrinho vazio não ocupa espaço: a chave é apagada.
  encode: (estado) => (estado.linhas.length > 0 ? JSON.stringify(estado) : APAGAR),
  decode: lerCarrinhoSalvo,
});

export interface DadosCliente {
  nome?: string;
  cidade?: string;
}

const CHAVE_CLIENTE = 'cliente:v1';

function lerCliente(texto: string): DadosCliente {
  try {
    const dados: unknown = JSON.parse(texto);
    if (typeof dados !== 'object' || dados === null) return {};
    const { nome, cidade } = dados as Record<string, unknown>;
    return {
      ...(typeof nome === 'string' ? { nome: nome.slice(0, 80) } : {}),
      ...(typeof cidade === 'string' ? { cidade: cidade.slice(0, 80) } : {}),
    };
  } catch {
    return {};
  }
}

/** Nome e cidade opcionais: ficam SÓ neste aparelho e vão na mensagem que o cliente envia. */
export const $cliente = persistentAtom<DadosCliente>(
  CHAVE_CLIENTE,
  {},
  {
    encode: (c) => (c.nome?.trim() || c.cidade?.trim() ? JSON.stringify(c) : APAGAR),
    decode: lerCliente,
  },
);

export const $totalItens = computed($carrinho, totalDeItens);
export const $gavetaAberta = atom(false);
export const $avisosCarrinho = atom<AvisoCarrinho[]>([]);

/** Última adição (para o contador pulsar). */
export const $ultimaAdicao = atom<{ vez: number; produtoId: string } | null>(null);

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

export function adicionarAoCarrinho(linha: LinhaCarrinho) {
  const resultado = adicionar($carrinho.get(), linha, site.quantidadeMaximaPorItem);
  $carrinho.set(resultado.estado);
  $ultimaAdicao.set({ vez: Date.now(), produtoId: linha.produtoId });
  return resultado;
}

export function mudarQuantidade(id: string, quantidade: number) {
  const resultado = alterarQuantidade($carrinho.get(), id, quantidade, site.quantidadeMaximaPorItem);
  $carrinho.set(resultado.estado);
  return resultado;
}

export function removerDoCarrinho(id: string) {
  const resultado = remover($carrinho.get(), id);
  $carrinho.set(resultado.estado);
  return resultado.removida;
}

export function desfazerRemocaoDoCarrinho(linha: LinhaCarrinho, indice: number) {
  $carrinho.set(desfazerRemocao($carrinho.get(), linha, indice));
}

export function limparCarrinho() {
  $carrinho.set(carrinhoVazio());
  $avisosCarrinho.set([]);
}

/** "Apagar meus dados deste aparelho": carrinho, nome e cidade. */
export function apagarDadosDoAparelho() {
  limparCarrinho();
  $cliente.set({});
}

export function abrirGaveta() {
  $gavetaAberta.set(true);
}

// ---------------------------------------------------------------------------
// Catálogo público e revalidação
// ---------------------------------------------------------------------------

export interface ProdutoCatalogoCliente extends ProdutoCatalogo {
  miniatura: string | null;
  categoria: Pick<Categoria, 'cor' | 'icone' | 'nomeSingular'>;
}

export const $catalogo = atom<ProdutoCatalogoCliente[] | null>(null);
let carregando: Promise<ProdutoCatalogoCliente[] | null> | null = null;

/** Baixa /catalogo.json uma vez por página. Sem internet: null (o carrinho segue com o que tem). */
export function carregarCatalogo(): Promise<ProdutoCatalogoCliente[] | null> {
  carregando ??= fetch('/catalogo.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? (r.json() as Promise<{ produtos?: unknown }>) : null))
    .then((dados) => {
      const produtos = Array.isArray(dados?.produtos) ? (dados.produtos as ProdutoCatalogoCliente[]) : null;
      $catalogo.set(produtos);
      if (!produtos) carregando = null;
      return produtos;
    })
    .catch(() => {
      carregando = null; // tenta de novo na próxima vez
      return null;
    });
  return carregando;
}

/** Confere o carrinho com o catálogo atual (produtos removidos, preços, esgotados). */
export async function revalidarCarrinho(): Promise<void> {
  if ($carrinho.get().linhas.length === 0) return;
  const catalogo = await carregarCatalogo();
  if (!catalogo) return;
  const atual = $carrinho.get();
  const { estado, avisos } = revalidar(atual, catalogo, site.quantidadeMaximaPorItem);
  if (!mesmoEstado(atual, estado)) $carrinho.set(estado);
  if (avisos.length > 0) $avisosCarrinho.set([...$avisosCarrinho.get(), ...avisos]);
}
