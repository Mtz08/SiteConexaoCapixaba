import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { criarSchemaProduto, schemaCategoria } from './schema';
import { ErroCatalogo, lerJson, lerListaJson } from './lerJson';

const schema = criarSchemaProduto(['polo', 'camisetas', 'moletons', 'bones', 'adesivos']);

const base = {
  id: 'camiseta-teste',
  slug: 'camiseta-teste',
  nome: 'Camiseta Teste',
  categoria: 'camisetas',
  descricaoCurta: 'Uma camiseta de teste.',
  descricao: 'Primeiro parágrafo.\n\nSegundo parágrafo.',
  precoBase: 79.9,
  ativo: true,
  opcoes: [{ nome: 'Tamanho', valores: ['P', 'M', 'G'] }],
};

function mensagens(entrada: unknown): string {
  const resultado = schema.safeParse(entrada);
  if (resultado.success) return '';
  return resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
}

describe('schema de produto', () => {
  it('aceita o mínimo e aplica padrões', () => {
    const produto = schema.parse(base);
    expect(produto.precoBase).toBe(7990); // centavos
    expect(produto.descricao).toEqual(['Primeiro parágrafo.', 'Segundo parágrafo.']);
    expect(produto.destaque).toBe(false);
    expect(produto.novo).toBe(false);
    expect(produto.variacoes).toEqual([]);
    expect(produto.fotos).toEqual([]);
  });

  it('converte preços das variações para centavos', () => {
    const produto = schema.parse({ ...base, variacoes: [{ combinacao: { Tamanho: 'G' }, preco: 89.9 }] });
    expect(produto.variacoes[0]?.preco).toBe(8990);
  });

  it('preço com vírgula (texto) explica o formato', () => {
    expect(mensagens({ ...base, precoBase: '79,90' })).toMatch(/precoBase.*número sem aspas.*129\.90/);
  });

  it('preço zero ou negativo', () => {
    expect(mensagens({ ...base, precoBase: 0 })).toMatch(/maior que zero/);
  });

  it('preço com 3 casas', () => {
    expect(mensagens({ ...base, precoBase: 79.999 })).toMatch(/mais de 2 casas/);
  });

  it('categoria inexistente lista as válidas', () => {
    expect(mensagens({ ...base, categoria: 'camiseta' })).toMatch(/categoria.*polo, camisetas, moletons/);
  });

  it('campo com grafia errada', () => {
    expect(mensagens({ ...base, preco_base: 10 })).toMatch(/Campo desconhecido: "preco_base"/);
  });

  it('ativo é obrigatório', () => {
    const { ativo: _ativo, ...semAtivo } = base;
    expect(mensagens(semAtivo)).toMatch(/"ativo" é obrigatório/);
  });

  it('ativo como texto', () => {
    expect(mensagens({ ...base, ativo: 'true' })).toMatch(/"ativo"/);
  });

  it('slug com maiúscula, acento ou espaço', () => {
    expect(mensagens({ ...base, slug: 'Camiseta Teste' })).toMatch(/slug.*minúsculas sem acento/);
    expect(mensagens({ ...base, id: 'camisetão' })).toMatch(/id.*minúsculas sem acento/);
  });

  it('descrição curta longa demais', () => {
    expect(mensagens({ ...base, descricaoCurta: 'x'.repeat(141) })).toMatch(/140 caracteres/);
  });

  it('precoDe precisa ser maior que o preço (inclusive das variações)', () => {
    expect(mensagens({ ...base, precoDe: 79.9 })).toMatch(/precoDe.*MAIOR/);
    expect(mensagens({ ...base, precoDe: 99.9 })).toBe('');
    expect(
      mensagens({ ...base, precoDe: 89.9, variacoes: [{ combinacao: { Tamanho: 'G' }, preco: 94.9 }] }),
    ).toMatch(/precoDe/);
  });

  it('variação com opção inexistente aponta o caminho', () => {
    expect(mensagens({ ...base, variacoes: [{ combinacao: { Tamanho: 'GG' }, preco: 89.9 }] })).toMatch(
      /variacoes\.0\.combinacao\.Tamanho: "GG" não é um valor de "Tamanho"/,
    );
  });

  it('descrição como lista de parágrafos', () => {
    expect(schema.parse({ ...base, descricao: ['Um.', 'Dois.'] }).descricao).toEqual(['Um.', 'Dois.']);
  });

  it('_notas é aceito e não atrapalha', () => {
    expect(mensagens({ ...base, _notas: ['TODO: algo'] })).toBe('');
  });
});

describe('schema de categoria', () => {
  it('cor inválida', () => {
    const r = schemaCategoria.safeParse({
      id: 'polo',
      nome: 'Polo',
      nomeSingular: 'Polo',
      cor: 'roxa',
      icone: 'polo',
      ordem: 1,
      descricao: 'x',
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/vermelha, verde, azul, amarela, branca/);
  });
});

describe('lerJson', () => {
  it('vírgula sobrando: linha e dica', () => {
    const texto = '[\n  {\n    "id": "a",\n    "nome": "A",\n  }\n]';
    expect(() => lerJson(texto, 'produtos.json')).toThrow(ErroCatalogo);
    expect(() => lerJson(texto, 'produtos.json')).toThrow(/linha 5[\s\S]*vírgula sobrando/);
  });

  it('vírgula faltando', () => {
    const texto = '[\n  {\n    "id": "a"\n    "nome": "A"\n  }\n]';
    expect(() => lerJson(texto, 'produtos.json')).toThrow(/linha 4[\s\S]*falta[r]? uma vírgula/);
  });

  it('vírgula dupla', () => {
    expect(() => lerJson('[{"id": "a",, "nome": "A"}]', 'produtos.json')).toThrow(/duas vírgulas seguidas/);
  });

  it('aspas simples', () => {
    expect(() => lerJson("[{'id': 'a'}]", 'produtos.json')).toThrow(/aspas duplas/);
  });

  it('ignora BOM do Windows', () => {
    expect(lerJson(String.fromCharCode(0xfeff) + '[]', 'produtos.json')).toEqual([]);
  });
});

describe('lerListaJson', () => {
  const opcoes = { unicos: ['id', 'slug'], rotulo: 'nome' };

  it('precisa ser lista', () => {
    expect(() => lerListaJson('{}', 'produtos.json', opcoes)).toThrow(/lista/);
  });

  it('id faltando', () => {
    expect(() => lerListaJson('[{"nome": "X"}]', 'produtos.json', opcoes)).toThrow(
      /item nº 1: falta o campo "id"/,
    );
  });

  it('id e slug repetidos citam os dois produtos', () => {
    const texto = JSON.stringify([
      { id: 'a', slug: 's', nome: 'Primeiro' },
      { id: 'a', slug: 's', nome: 'Segundo' },
    ]);
    expect(() => lerListaJson(texto, 'produtos.json', opcoes)).toThrow(
      /"id" repetido: "a" aparece em "Primeiro" e em "Segundo"/,
    );
    expect(() => lerListaJson(texto, 'produtos.json', opcoes)).toThrow(/"slug" repetido/);
  });
});

describe('catálogo real', () => {
  const categorias = lerListaJson(readFileSync('src/data/categorias.json', 'utf8'), 'categorias.json', {
    unicos: ['id', 'ordem'],
    rotulo: 'nome',
  });
  const ids = categorias.map((c) => String(c.id)) as [string, ...string[]];
  const schemaReal = criarSchemaProduto(ids);
  const produtos = lerListaJson(readFileSync('src/data/produtos.json', 'utf8'), 'produtos.json', {
    unicos: ['id', 'slug'],
    rotulo: 'nome',
  });

  it('todas as categorias são válidas', () => {
    for (const c of categorias) expect(schemaCategoria.safeParse(c).success).toBe(true);
  });

  it.each(produtos.map((p) => [String(p.id), p]))('produto %s é válido', (_id, produto) => {
    const r = schemaReal.safeParse(produto);
    expect(r.success ? '' : r.error.issues.map((i) => i.message).join('\n')).toBe('');
  });

  it('a polo tem o exemplo de variação GG a R$ 139,90', () => {
    const polo = schemaReal.parse(produtos.find((p) => p.id === 'polo-conexao'));
    expect(polo.variacoes.find((v) => v.combinacao.Tamanho === 'GG')?.preco).toBe(13990);
  });
});
