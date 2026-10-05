import { z } from 'astro/zod';
import { reaisParaCentavos, temNoMaximoDuasCasas, type Centavos } from '../dinheiro';
import { faixaDePreco, validarVariacoes } from './variacoes';

/**
 * Schemas do catálogo. As mensagens são escritas para quem edita o JSON sem programar:
 * dizem o que está errado e como corrigir.
 */

export const CORES_PLACA = ['vermelha', 'verde', 'azul', 'amarela', 'branca'] as const;
export const ICONES_CATEGORIA = ['polo', 'camiseta', 'moletom', 'bone', 'adesivo'] as const;

const REGEX_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const erroCampoDesconhecido = (iss: { code?: string; keys?: string[] }) =>
  iss.code === 'unrecognized_keys' && iss.keys
    ? `Campo desconhecido: ${iss.keys.map((k) => `"${k}"`).join(', ')}. ` +
      'Confira a grafia (maiúsculas e acentos contam) no guia docs/COMO-EDITAR-PRODUTOS.md.'
    : undefined;

const slug = (campo: string) =>
  z
    .string({ error: `"${campo}" é obrigatório e deve ser um texto entre aspas.` })
    .regex(
      REGEX_SLUG,
      `"${campo}" só pode ter letras minúsculas sem acento, números e hífens. Ex.: "camiseta-rei-da-estrada".`,
    );

const texto = (campo: string, max?: number) => {
  let s = z
    .string({ error: `"${campo}" é obrigatório e deve ser um texto entre aspas.` })
    .trim()
    .min(1, `"${campo}" não pode ficar vazio.`);
  if (max) s = s.max(max, `"${campo}" passou de ${max} caracteres. Encurte o texto.`);
  return s;
};

/** Preço em REAIS no JSON (ex.: 129.90) → centavos no código. */
const preco = (campo: string) =>
  z
    .number({ error: `"${campo}" deve ser um número sem aspas, com ponto nos centavos. Ex.: 129.90` })
    .positive(`"${campo}" deve ser maior que zero.`)
    .refine(temNoMaximoDuasCasas, `"${campo}" tem mais de 2 casas decimais. Ex. correto: 129.90`)
    .transform((reais): Centavos => reaisParaCentavos(reais));

/** Anotações livres para quem edita (TODOs). O site ignora. */
const notas = z.union([z.string(), z.array(z.string())]).optional();

// ---------------------------------------------------------------------------
// Categoria
// ---------------------------------------------------------------------------
export const schemaCategoria = z.strictObject(
  {
    id: slug('id'),
    nome: texto('nome', 40),
    nomeSingular: texto('nomeSingular', 40),
    cor: z.enum(CORES_PLACA, { error: `"cor" deve ser uma destas: ${CORES_PLACA.join(', ')}.` }),
    icone: z.enum(ICONES_CATEGORIA, { error: `"icone" deve ser um destes: ${ICONES_CATEGORIA.join(', ')}.` }),
    ordem: z
      .number({ error: '"ordem" deve ser um número inteiro.' })
      .int('"ordem" deve ser um número inteiro.'),
    descricao: texto('descricao', 200),
    _notas: notas,
  },
  { error: erroCampoDesconhecido },
);

export type Categoria = z.output<typeof schemaCategoria>;

// ---------------------------------------------------------------------------
// Produto
// ---------------------------------------------------------------------------
const schemaOpcao = z.strictObject(
  {
    nome: texto('nome da opção', 30),
    valores: z
      .array(texto('valor da opção', 30), { error: '"valores" deve ser uma lista. Ex.: ["P", "M", "G"]' })
      .min(1, 'Uma opção precisa de pelo menos um valor.'),
  },
  { error: erroCampoDesconhecido },
);

const schemaVariacao = z.strictObject(
  {
    combinacao: z.record(z.string(), z.string(), {
      error: '"combinacao" deve ser um objeto. Ex.: { "Tamanho": "GG", "Cor": "Preta" }',
    }),
    preco: preco('preco').optional(),
    disponivel: z.boolean({ error: '"disponivel" deve ser true ou false (sem aspas).' }).optional(),
    _notas: notas,
  },
  { error: erroCampoDesconhecido },
);

/** Descrição: um texto (parágrafos separados por linha em branco) ou uma lista de parágrafos. */
const schemaDescricao = z
  .union([texto('descricao'), z.array(texto('parágrafo da descricao')).min(1)], {
    error: '"descricao" deve ser um texto ou uma lista de parágrafos.',
  })
  .transform((valor) =>
    (Array.isArray(valor) ? valor : valor.split(/\n\s*\n/)).map((p) => p.trim()).filter((p) => p.length > 0),
  );

export function criarSchemaProduto(idsCategorias: readonly [string, ...string[]]) {
  return z
    .strictObject(
      {
        id: slug('id'),
        slug: slug('slug'),
        nome: texto('nome', 80),
        categoria: z.enum(idsCategorias, {
          error: `"categoria" deve ser uma destas: ${idsCategorias.join(', ')}.`,
        }),
        descricaoCurta: texto('descricaoCurta', 140),
        descricao: schemaDescricao,
        precoBase: preco('precoBase'),
        precoDe: preco('precoDe').optional(),
        destaque: z.boolean({ error: '"destaque" deve ser true ou false (sem aspas).' }).default(false),
        novo: z.boolean({ error: '"novo" deve ser true ou false (sem aspas).' }).default(false),
        ativo: z.boolean({
          error: '"ativo" é obrigatório: true (aparece no site) ou false (escondido). Sem aspas.',
        }),
        ordem: z.number({ error: '"ordem" deve ser um número inteiro.' }).int().optional(),
        opcoes: z.array(schemaOpcao, { error: '"opcoes" deve ser uma lista.' }).default([]),
        variacoes: z.array(schemaVariacao, { error: '"variacoes" deve ser uma lista.' }).default([]),
        fotos: z.array(z.string().trim().min(1), { error: '"fotos" deve ser uma lista.' }).default([]),
        cuidados: z
          .array(texto('cuidado'), { error: '"cuidados" deve ser uma lista de textos.' })
          .default([]),
        tags: z.array(texto('tag', 30), { error: '"tags" deve ser uma lista de textos.' }).default([]),
        _notas: notas,
      },
      { error: erroCampoDesconhecido },
    )
    .superRefine((produto, ctx) => {
      for (const erro of validarVariacoes(produto)) {
        ctx.addIssue({ code: 'custom', message: erro.mensagem, path: erro.caminho });
      }
      if (produto.precoDe !== undefined) {
        const { max } = faixaDePreco(produto);
        if (produto.precoDe <= max) {
          ctx.addIssue({
            code: 'custom',
            path: ['precoDe'],
            message:
              '"precoDe" (preço antigo, riscado) precisa ser MAIOR que o preço atual ' +
              '(incluindo os preços das variações). Para tirar a promoção, apague o campo "precoDe".',
          });
        }
      }
    });
}

export type Produto = z.output<ReturnType<typeof criarSchemaProduto>>;

// ---------------------------------------------------------------------------
// Guia de medidas
// ---------------------------------------------------------------------------
export function criarSchemaMedidas(idsCategorias: readonly [string, ...string[]]) {
  return z
    .strictObject(
      {
        id: slug('id'),
        nome: texto('nome', 40),
        categorias: z
          .array(
            z.enum(idsCategorias, {
              error: `Categoria inválida. Use uma destas: ${idsCategorias.join(', ')}.`,
            }),
          )
          .min(1, 'Informe pelo menos uma categoria em "categorias".'),
        /** false = valores ainda não conferidos; o site mostra um aviso. */
        confirmado: z.boolean({ error: '"confirmado" deve ser true ou false (sem aspas).' }),
        colunas: z.array(texto('coluna', 30)).min(1, 'Informe pelo menos uma coluna.'),
        linhas: z
          .array(
            z.strictObject(
              {
                tamanho: texto('tamanho', 10),
                valores: z.array(
                  z.number({ error: 'As medidas devem ser números sem aspas. Ex.: 52 ou 52.5' }).positive(),
                ),
              },
              { error: erroCampoDesconhecido },
            ),
          )
          .min(1, 'Informe pelo menos uma linha de tamanho.'),
        comoMedir: z.array(texto('comoMedir')).default([]),
        _notas: notas,
      },
      { error: erroCampoDesconhecido },
    )
    .superRefine((tabela, ctx) => {
      const vistos = new Set<string>();
      tabela.linhas.forEach((linha, i) => {
        if (linha.valores.length !== tabela.colunas.length) {
          ctx.addIssue({
            code: 'custom',
            path: ['linhas', i, 'valores'],
            message: `O tamanho "${linha.tamanho}" tem ${linha.valores.length} medidas, mas a tabela tem ${tabela.colunas.length} colunas.`,
          });
        }
        if (vistos.has(linha.tamanho)) {
          ctx.addIssue({
            code: 'custom',
            path: ['linhas', i, 'tamanho'],
            message: `O tamanho "${linha.tamanho}" aparece duas vezes.`,
          });
        }
        vistos.add(linha.tamanho);
      });
    });
}

export type TabelaMedidas = z.output<ReturnType<typeof criarSchemaMedidas>>;
