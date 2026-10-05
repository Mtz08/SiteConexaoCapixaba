import type { Centavos } from '../dinheiro';

/**
 * Regras de variação de produto (tamanho, cor, modelo…).
 *
 * - `opcoes` define os eixos: [{ nome: 'Tamanho', valores: ['P','M','G','GG'] }, ...]
 * - `variacoes` só existe para exceções: uma combinação (completa OU parcial) que muda
 *   preço e/ou disponibilidade. Ex.: { combinacao: { Tamanho: 'GG' }, preco } vale para
 *   GG de qualquer cor.
 * - Quando várias variações casam com a mesma combinação, vence a mais específica
 *   (com mais opções preenchidas), atributo por atributo.
 */

export interface Opcao {
  nome: string;
  valores: string[];
}

export type Combinacao = Readonly<Record<string, string>>;

export interface Variacao {
  combinacao: Combinacao;
  preco?: Centavos | undefined;
  disponivel?: boolean | undefined;
}

export interface DadosVariacao {
  precoBase: Centavos;
  opcoes: Opcao[];
  variacoes: Variacao[];
}

export interface Resolucao {
  preco: Centavos;
  disponivel: boolean;
}

/** Produto cartesiano das opções. Sem opções → uma única combinação vazia. */
export function todasCombinacoes(opcoes: Opcao[]): Combinacao[] {
  return opcoes.reduce<Combinacao[]>(
    (acumulado, opcao) =>
      acumulado.flatMap((combo) => opcao.valores.map((valor) => ({ ...combo, [opcao.nome]: valor }))),
    [{}],
  );
}

function casa(parcial: Combinacao, combinacao: Combinacao): boolean {
  return Object.entries(parcial).every(([nome, valor]) => combinacao[nome] === valor);
}

function especificidade(variacao: Variacao): number {
  return Object.keys(variacao.combinacao).length;
}

/** Atributo da variação mais específica que o define, ou undefined. */
function maisEspecifico<K extends 'preco' | 'disponivel'>(
  candidatas: Variacao[],
  atributo: K,
): Variacao[K] | undefined {
  let melhor: Variacao | undefined;
  for (const v of candidatas) {
    if (v[atributo] === undefined) continue;
    if (!melhor || especificidade(v) > especificidade(melhor)) melhor = v;
  }
  return melhor?.[atributo];
}

/** Preço e disponibilidade de uma combinação COMPLETA. */
export function resolverCombinacao(dados: DadosVariacao, combinacao: Combinacao): Resolucao {
  const candidatas = dados.variacoes.filter((v) => casa(v.combinacao, combinacao));
  return {
    preco: maisEspecifico(candidatas, 'preco') ?? dados.precoBase,
    disponivel: maisEspecifico(candidatas, 'disponivel') ?? true,
  };
}

/** Todas as opções têm um valor válido escolhido? */
export function combinacaoCompleta(opcoes: Opcao[], selecao: Partial<Record<string, string>>): boolean {
  return opcoes.every((o) => {
    const valor = selecao[o.nome];
    return valor !== undefined && o.valores.includes(valor);
  });
}

/** Opções que ainda faltam escolher, na ordem em que aparecem. */
export function opcoesFaltando(opcoes: Opcao[], selecao: Partial<Record<string, string>>): Opcao[] {
  return opcoes.filter((o) => {
    const valor = selecao[o.nome];
    return valor === undefined || !o.valores.includes(valor);
  });
}

/**
 * Chave estável da combinação, na ordem das opções do produto.
 * Usada para identificar a linha do carrinho: produtoId + chave.
 */
export function chaveCombinacao(opcoes: Opcao[], combinacao: Combinacao): string {
  return opcoes.map((o) => `${o.nome}=${combinacao[o.nome] ?? ''}`).join('|');
}

/**
 * Este valor pode ser escolhido, dada a seleção atual das OUTRAS opções?
 * Falso quando toda combinação completa com esse valor está indisponível.
 */
export function valorDisponivel(
  dados: DadosVariacao,
  selecao: Partial<Record<string, string>>,
  nomeOpcao: string,
  valor: string,
): boolean {
  const fixas: Record<string, string> = {};
  for (const opcao of dados.opcoes) {
    const escolhido = selecao[opcao.nome];
    if (opcao.nome !== nomeOpcao && escolhido !== undefined) fixas[opcao.nome] = escolhido;
  }
  fixas[nomeOpcao] = valor;
  return todasCombinacoes(dados.opcoes)
    .filter((combo) => casa(fixas, combo))
    .some((combo) => resolverCombinacao(dados, combo).disponivel);
}

/** Menor e maior preço entre as combinações disponíveis (todas, se nenhuma estiver). */
export function faixaDePreco(dados: DadosVariacao): { min: Centavos; max: Centavos; esgotado: boolean } {
  const resolucoes = todasCombinacoes(dados.opcoes).map((c) => resolverCombinacao(dados, c));
  const disponiveis = resolucoes.filter((r) => r.disponivel);
  const base = disponiveis.length > 0 ? disponiveis : resolucoes;
  const precos = base.map((r) => r.preco);
  return {
    min: Math.min(...precos) as Centavos,
    max: Math.max(...precos) as Centavos,
    esgotado: disponiveis.length === 0,
  };
}

/**
 * Valida as regras de variação. Devolve mensagens em português (vazio = tudo certo).
 * `caminho` indica onde o erro está, para o build apontar o campo.
 */
export function validarVariacoes(dados: DadosVariacao): { mensagem: string; caminho: (string | number)[] }[] {
  const erros: { mensagem: string; caminho: (string | number)[] }[] = [];
  const nomes = new Set<string>();

  dados.opcoes.forEach((opcao, i) => {
    if (nomes.has(opcao.nome)) {
      erros.push({ mensagem: `A opção "${opcao.nome}" aparece duas vezes.`, caminho: ['opcoes', i, 'nome'] });
    }
    nomes.add(opcao.nome);
    const vistos = new Set<string>();
    opcao.valores.forEach((valor, j) => {
      if (vistos.has(valor)) {
        erros.push({
          mensagem: `O valor "${valor}" aparece duas vezes em "${opcao.nome}".`,
          caminho: ['opcoes', i, 'valores', j],
        });
      }
      vistos.add(valor);
    });
  });

  const chavesVistas = new Map<string, number>();
  dados.variacoes.forEach((variacao, i) => {
    const entradas = Object.entries(variacao.combinacao);
    if (entradas.length === 0) {
      erros.push({
        mensagem: 'A "combinacao" está vazia. Diga a qual tamanho/cor esta variação se aplica.',
        caminho: ['variacoes', i, 'combinacao'],
      });
    }
    if (variacao.preco === undefined && variacao.disponivel === undefined) {
      erros.push({
        mensagem: 'Esta variação não muda nada. Informe "preco" e/ou "disponivel".',
        caminho: ['variacoes', i],
      });
    }
    for (const [nome, valor] of entradas) {
      const opcao = dados.opcoes.find((o) => o.nome === nome);
      if (!opcao) {
        const existentes = dados.opcoes.map((o) => `"${o.nome}"`).join(', ') || 'nenhuma';
        erros.push({
          mensagem: `A opção "${nome}" não existe neste produto. Opções existentes: ${existentes}.`,
          caminho: ['variacoes', i, 'combinacao', nome],
        });
      } else if (!opcao.valores.includes(valor)) {
        erros.push({
          mensagem: `"${valor}" não é um valor de "${nome}". Valores possíveis: ${opcao.valores.join(', ')}.`,
          caminho: ['variacoes', i, 'combinacao', nome],
        });
      }
    }
    const chave = JSON.stringify(Object.fromEntries(entradas.sort(([a], [b]) => a.localeCompare(b))));
    const anterior = chavesVistas.get(chave);
    if (anterior !== undefined) {
      erros.push({
        mensagem: `Esta combinação repete a variação nº ${anterior + 1}. Junte as duas numa só.`,
        caminho: ['variacoes', i, 'combinacao'],
      });
    } else {
      chavesVistas.set(chave, i);
    }
  });

  // Só faz sentido checar conflitos se não houve erro de estrutura.
  if (erros.length > 0) return erros;

  // Conflito: duas variações de mesma especificidade casam com a mesma combinação
  // e definem o mesmo atributo com valores diferentes.
  const conflitos = new Set<string>();
  for (const combo of todasCombinacoes(dados.opcoes)) {
    const candidatas = dados.variacoes.map((v, i) => ({ v, i })).filter(({ v }) => casa(v.combinacao, combo));
    for (const atributo of ['preco', 'disponivel'] as const) {
      const definem = candidatas.filter(({ v }) => v[atributo] !== undefined);
      const maxEsp = Math.max(-1, ...definem.map(({ v }) => especificidade(v)));
      const empatadas = definem.filter(({ v }) => especificidade(v) === maxEsp);
      const valores = new Set(empatadas.map(({ v }) => v[atributo]));
      if (valores.size > 1) {
        const ids = empatadas.map(({ i }) => i + 1).join(' e ');
        const chave = `${atributo}:${ids}`;
        if (conflitos.has(chave)) continue;
        conflitos.add(chave);
        const descricao = Object.entries(combo)
          .map(([n, v]) => `${n} ${v}`)
          .join(', ');
        erros.push({
          mensagem:
            `As variações nº ${ids} definem "${atributo}" diferente para ${descricao}. ` +
            'Crie uma variação mais específica (com todas as opções) para desempatar.',
          caminho: ['variacoes'],
        });
      }
    }
  }

  return erros;
}
