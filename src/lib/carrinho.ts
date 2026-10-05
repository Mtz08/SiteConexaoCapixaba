import { centavos, multiplicar, somar, type Centavos } from './dinheiro';
import {
  chaveCombinacao,
  combinacaoCompleta,
  resolverCombinacao,
  type Combinacao,
  type DadosVariacao,
} from './catalogo/variacoes';

/**
 * Carrinho — lógica pura (sem navegador). Testada em carrinho.test.ts.
 * Uma linha = produto + combinação de opções. Mesma camiseta em P e em G = 2 linhas.
 */

export const VERSAO_CARRINHO = 1;
export const CHAVE_CARRINHO = `carrinho:v${VERSAO_CARRINHO}`;

export interface LinhaCarrinho {
  produtoId: string;
  combinacao: Record<string, string>;
  quantidade: number;
  /** Preço unitário em centavos (atualizado na revalidação). */
  precoUnitario: Centavos;
  /** Cópia do nome e do slug, para mostrar o carrinho mesmo sem conseguir baixar o catálogo. */
  nome: string;
  slug: string;
}

export interface EstadoCarrinho {
  versao: typeof VERSAO_CARRINHO;
  linhas: LinhaCarrinho[];
}

export const carrinhoVazio = (): EstadoCarrinho => ({ versao: VERSAO_CARRINHO, linhas: [] });

/** Produto como aparece no catálogo enviado ao navegador (/catalogo.json). */
export interface ProdutoCatalogo extends DadosVariacao {
  id: string;
  slug: string;
  nome: string;
}

/** Identificador da linha: produto + combinação (independe da ordem das opções). */
export function idLinha(linha: Pick<LinhaCarrinho, 'produtoId' | 'combinacao'>): string {
  const opcoes = Object.keys(linha.combinacao)
    .sort()
    .map((nome) => ({ nome, valores: [] }));
  return `${linha.produtoId}::${chaveCombinacao(opcoes, linha.combinacao)}`;
}

/** Chave canônica independente da ordem das propriedades. */
function mesmaLinha(a: LinhaCarrinho, b: Pick<LinhaCarrinho, 'produtoId' | 'combinacao'>): boolean {
  return idLinha(a) === idLinha(b);
}

export interface ResultadoAlteracao {
  estado: EstadoCarrinho;
  /** Quantidade final da linha afetada. */
  quantidade: number;
  /** true quando a quantidade pedida passou do máximo e foi limitada. */
  limitada: boolean;
}

/** Adiciona (ou soma, se a linha já existe), respeitando o máximo por item. */
export function adicionar(estado: EstadoCarrinho, nova: LinhaCarrinho, maximo: number): ResultadoAlteracao {
  const existente = estado.linhas.find((l) => mesmaLinha(l, nova));
  const pedida = (existente?.quantidade ?? 0) + nova.quantidade;
  const quantidade = Math.min(Math.max(pedida, 1), maximo);
  const linhas = existente
    ? estado.linhas.map((l) =>
        l === existente ? { ...l, quantidade, precoUnitario: nova.precoUnitario } : l,
      )
    : [...estado.linhas, { ...nova, quantidade }];
  return { estado: { ...estado, linhas }, quantidade, limitada: pedida > maximo };
}

/** Muda a quantidade de uma linha (limitada entre 1 e o máximo). */
export function alterarQuantidade(
  estado: EstadoCarrinho,
  id: string,
  quantidadePedida: number,
  maximo: number,
): ResultadoAlteracao {
  const inteira = Number.isFinite(quantidadePedida) ? Math.trunc(quantidadePedida) : 1;
  const quantidade = Math.min(Math.max(inteira, 1), maximo);
  const linhas = estado.linhas.map((l) => (idLinha(l) === id ? { ...l, quantidade } : l));
  return { estado: { ...estado, linhas }, quantidade, limitada: inteira > maximo };
}

/** Remove uma linha e devolve o que é preciso para desfazer. */
export function remover(
  estado: EstadoCarrinho,
  id: string,
): { estado: EstadoCarrinho; removida?: { linha: LinhaCarrinho; indice: number } } {
  const indice = estado.linhas.findIndex((l) => idLinha(l) === id);
  const linha = estado.linhas[indice];
  if (!linha) return { estado };
  return {
    estado: { ...estado, linhas: estado.linhas.filter((_, i) => i !== indice) },
    removida: { linha, indice },
  };
}

/** Desfaz uma remoção, devolvendo a linha à mesma posição. */
export function desfazerRemocao(
  estado: EstadoCarrinho,
  linha: LinhaCarrinho,
  indice: number,
): EstadoCarrinho {
  if (estado.linhas.some((l) => mesmaLinha(l, linha))) return estado;
  const linhas = [...estado.linhas];
  linhas.splice(Math.min(indice, linhas.length), 0, linha);
  return { ...estado, linhas };
}

export function totalDeItens(estado: EstadoCarrinho): number {
  return estado.linhas.reduce((t, l) => t + l.quantidade, 0);
}

export function subtotal(linha: LinhaCarrinho): Centavos {
  return multiplicar(linha.precoUnitario, linha.quantidade);
}

export function totalDoCarrinho(estado: EstadoCarrinho): Centavos {
  return somar(...estado.linhas.map(subtotal));
}

// ---------------------------------------------------------------------------
// Persistência segura
// ---------------------------------------------------------------------------

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function linhaValida(v: unknown): v is LinhaCarrinho {
  if (!ehObjeto(v)) return false;
  const { produtoId, combinacao, quantidade, precoUnitario, nome, slug } = v;
  return (
    typeof produtoId === 'string' &&
    produtoId.length > 0 &&
    ehObjeto(combinacao) &&
    Object.values(combinacao).every((x) => typeof x === 'string') &&
    Number.isSafeInteger(quantidade) &&
    (quantidade as number) >= 1 &&
    Number.isSafeInteger(precoUnitario) &&
    (precoUnitario as number) >= 0 &&
    typeof nome === 'string' &&
    typeof slug === 'string'
  );
}

/**
 * Lê o carrinho salvo. Qualquer problema (JSON corrompido, versão antiga, formato estranho)
 * resulta em carrinho vazio — nunca quebra a página.
 */
export function lerCarrinhoSalvo(texto: string | null | undefined): EstadoCarrinho {
  if (!texto) return carrinhoVazio();
  try {
    const dados: unknown = JSON.parse(texto);
    if (!ehObjeto(dados) || dados.versao !== VERSAO_CARRINHO || !Array.isArray(dados.linhas)) {
      return carrinhoVazio();
    }
    const linhas = dados.linhas.filter(linhaValida).map((l) => ({
      produtoId: l.produtoId,
      combinacao: { ...l.combinacao },
      quantidade: l.quantidade,
      precoUnitario: centavos(l.precoUnitario),
      nome: l.nome,
      slug: l.slug,
    }));
    return { versao: VERSAO_CARRINHO, linhas };
  } catch {
    return carrinhoVazio();
  }
}

// ---------------------------------------------------------------------------
// Revalidação contra o catálogo atual
// ---------------------------------------------------------------------------

export type MotivoAviso = 'removido' | 'variacao' | 'esgotado' | 'preco' | 'quantidade';

export interface AvisoCarrinho {
  motivo: MotivoAviso;
  mensagem: string;
}

function descreverCombinacao(combinacao: Combinacao): string {
  const valores = Object.values(combinacao);
  return valores.length > 0 ? ` (${valores.join(', ')})` : '';
}

/**
 * Confere o carrinho contra o catálogo atual:
 * - produto que saiu da loja ou ficou inativo → sai do carrinho, com aviso;
 * - combinação que não existe mais ou esgotou → sai, com aviso;
 * - preço mudou → atualiza, com aviso discreto;
 * - quantidade acima do máximo → limita.
 */
export function revalidar(
  estado: EstadoCarrinho,
  catalogo: ProdutoCatalogo[],
  maximo: number,
): { estado: EstadoCarrinho; avisos: AvisoCarrinho[] } {
  const porId = new Map(catalogo.map((p) => [p.id, p]));
  const avisos: AvisoCarrinho[] = [];
  const linhas: LinhaCarrinho[] = [];

  for (const linha of estado.linhas) {
    const produto = porId.get(linha.produtoId);
    const rotulo = `${linha.nome}${descreverCombinacao(linha.combinacao)}`;

    if (!produto) {
      avisos.push({ motivo: 'removido', mensagem: `${rotulo} não está mais na loja e saiu do carrinho.` });
      continue;
    }

    const nomesOpcoes = new Set(produto.opcoes.map((o) => o.nome));
    const sobrando = Object.keys(linha.combinacao).some((n) => !nomesOpcoes.has(n));
    if (sobrando || !combinacaoCompleta(produto.opcoes, linha.combinacao)) {
      avisos.push({
        motivo: 'variacao',
        mensagem: `A opção escolhida de ${rotulo} mudou. O item saiu do carrinho.`,
      });
      continue;
    }

    const { preco, disponivel } = resolverCombinacao(produto, linha.combinacao);
    if (!disponivel) {
      avisos.push({ motivo: 'esgotado', mensagem: `${rotulo} esgotou e saiu do carrinho.` });
      continue;
    }

    let atualizada: LinhaCarrinho = { ...linha, nome: produto.nome, slug: produto.slug };
    if (preco !== linha.precoUnitario) {
      avisos.push({ motivo: 'preco', mensagem: `O preço de ${produto.nome} foi atualizado.` });
      atualizada = { ...atualizada, precoUnitario: preco };
    }
    if (atualizada.quantidade > maximo) {
      avisos.push({
        motivo: 'quantidade',
        mensagem: `A quantidade de ${produto.nome} foi limitada a ${maximo}.`,
      });
      atualizada = { ...atualizada, quantidade: maximo };
    }
    linhas.push(atualizada);
  }

  return { estado: { ...estado, linhas }, avisos };
}

/** O estado mudou de fato? (evita gravar à toa) */
export function mesmoEstado(a: EstadoCarrinho, b: EstadoCarrinho): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
