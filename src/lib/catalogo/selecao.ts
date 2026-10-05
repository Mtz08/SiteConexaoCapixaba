import { opcoesFaltando, valorDisponivel, type DadosVariacao } from './variacoes';

export type Selecao = Partial<Record<string, string>>;

/**
 * Escolhe um valor e desfaz escolhas das OUTRAS opções que ficaram impossíveis.
 * Ex.: com "Branca" escolhida, ao escolher "P" (P Branca esgotada), a cor é desmarcada.
 */
export function escolherValor(
  dados: DadosVariacao,
  selecao: Selecao,
  nomeOpcao: string,
  valor: string,
): Selecao {
  const nova: Selecao = { ...selecao, [nomeOpcao]: valor };
  const impossiveis = new Set(
    dados.opcoes
      .filter((o) => o.nome !== nomeOpcao)
      .filter((o) => {
        const atual = nova[o.nome];
        return atual !== undefined && !valorDisponivel(dados, nova, o.nome, atual);
      })
      .map((o) => o.nome),
  );
  return Object.fromEntries(Object.entries(nova).filter(([nome]) => !impossiveis.has(nome)));
}

/** "o tamanho", "a cor" — para "Escolha o tamanho". */
export function comArtigo(nomeOpcao: string): string {
  const feminino = /^(cor|estampa|manga|numeração|numeracao|versão|versao)$/i.test(nomeOpcao.trim());
  return `${feminino ? 'a' : 'o'} ${nomeOpcao.toLowerCase()}`;
}

/** Texto do botão de compra conforme o que falta. */
export function rotuloCompra(dados: DadosVariacao, selecao: Selecao, padrao: string): string {
  const [primeira] = opcoesFaltando(dados.opcoes, selecao);
  return primeira ? `Escolha ${comArtigo(primeira.nome)}` : padrao;
}

/** Limita a quantidade a [1, máximo]; texto inválido vira 1. */
export function limitarQuantidade(valor: number, maximo: number): { quantidade: number; ajustada: boolean } {
  if (!Number.isFinite(valor)) return { quantidade: 1, ajustada: true };
  const inteiro = Math.trunc(valor);
  const quantidade = Math.min(Math.max(inteiro, 1), maximo);
  return { quantidade, ajustada: quantidade !== valor };
}
