/**
 * Leitura dos arquivos JSON do catálogo com mensagens de erro amigáveis.
 * Usado como `parser` do loader `file()` em src/content.config.ts.
 */

export class ErroCatalogo extends Error {
  constructor(arquivo: string, mensagem: string) {
    super(`\n\n✖ Erro em src/data/${arquivo}\n\n${mensagem}\n\nGuia: docs/COMO-EDITAR-PRODUTOS.md\n`);
    this.name = 'ErroCatalogo';
  }
}

function linhaEColuna(texto: string, posicao: number): { linha: number; coluna: number } {
  const antes = texto.slice(0, posicao);
  const linhas = antes.split('\n');
  return { linha: linhas.length, coluna: (linhas.at(-1)?.length ?? 0) + 1 };
}

function dicaDeSintaxe(texto: string, posicao: number): string {
  const trecho = texto.slice(Math.max(0, posicao - 40), posicao + 1);
  if (/,\s*,$/.test(trecho)) return 'Há duas vírgulas seguidas. Apague uma delas.';
  if (/,\s*[}\]]$/.test(trecho))
    return 'Parece haver uma vírgula sobrando antes de "}" ou "]". Apague essa vírgula.';
  if (/["\d\]}el]\s*\n\s*"$/.test(trecho)) return 'Parece faltar uma vírgula no fim da linha anterior.';
  if (/'/.test(texto.slice(posicao, posicao + 1))) return 'Use aspas duplas ("), não aspas simples (\').';
  return 'Confira vírgulas entre os campos, aspas duplas nos textos e se cada "{" e "[" foi fechado.';
}

/** JSON.parse com linha/coluna e dica em português. */
export function lerJson(texto: string, arquivo: string): unknown {
  const semBom = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  try {
    return JSON.parse(semBom);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    const posicao = Number(/position (\d+)/.exec(mensagem)?.[1] ?? Number.NaN);
    if (Number.isNaN(posicao)) {
      throw new ErroCatalogo(
        arquivo,
        `O arquivo não é um JSON válido.\n${dicaDeSintaxe(semBom, semBom.length - 1)}`,
      );
    }
    const { linha, coluna } = linhaEColuna(semBom, posicao);
    const linhaTexto = semBom.split('\n')[linha - 1] ?? '';
    throw new ErroCatalogo(
      arquivo,
      `O arquivo não é um JSON válido — linha ${linha}, coluna ${coluna}:\n\n` +
        `    ${linhaTexto.trimEnd()}\n    ${' '.repeat(Math.max(0, coluna - 1))}^\n\n` +
        dicaDeSintaxe(semBom, posicao),
    );
  }
}

interface OpcoesLista {
  /** Campos que não podem se repetir entre os itens (ex.: id, slug). */
  unicos: string[];
  /** Campo usado para nomear o item na mensagem de erro (ex.: nome). */
  rotulo: string;
}

/** Lê um JSON que deve ser uma lista de objetos com `id`, checando campos únicos. */
export function lerListaJson(texto: string, arquivo: string, opcoes: OpcoesLista): Record<string, unknown>[] {
  const dados = lerJson(texto, arquivo);
  if (!Array.isArray(dados)) {
    throw new ErroCatalogo(arquivo, 'O arquivo deve começar com "[" e terminar com "]" (uma lista).');
  }

  const erros: string[] = [];
  const itens: Record<string, unknown>[] = [];

  dados.forEach((item: unknown, i) => {
    const posicao = `item nº ${i + 1}`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      erros.push(`• ${posicao}: cada item da lista deve ser um objeto entre "{ }".`);
      return;
    }
    const registro = item as Record<string, unknown>;
    if (typeof registro.id !== 'string' || registro.id.trim() === '') {
      erros.push(`• ${posicao}: falta o campo "id" (texto entre aspas).`);
      return;
    }
    itens.push(registro);
  });

  for (const campo of opcoes.unicos) {
    const vistos = new Map<string, number>();
    itens.forEach((item, i) => {
      const valor = item[campo];
      if (typeof valor !== 'string') return;
      const anterior = vistos.get(valor);
      if (anterior !== undefined) {
        const nome = (item[opcoes.rotulo] as string | undefined) ?? valor;
        const nomeAnterior = (itens[anterior]?.[opcoes.rotulo] as string | undefined) ?? valor;
        erros.push(
          `• "${campo}" repetido: "${valor}" aparece em "${nomeAnterior}" e em "${nome}". ` +
            `Cada produto precisa de um "${campo}" diferente.`,
        );
      } else {
        vistos.set(valor, i);
      }
    });
  }

  if (erros.length > 0) throw new ErroCatalogo(arquivo, erros.join('\n'));
  return itens;
}
