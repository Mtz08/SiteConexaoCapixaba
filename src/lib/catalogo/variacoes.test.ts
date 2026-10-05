import { describe, expect, it } from 'vitest';
import { centavos } from '../dinheiro';
import {
  chaveCombinacao,
  combinacaoCompleta,
  faixaDePreco,
  opcoesFaltando,
  resolverCombinacao,
  todasCombinacoes,
  validarVariacoes,
  valorDisponivel,
  type DadosVariacao,
} from './variacoes';

const tamanho = { nome: 'Tamanho', valores: ['P', 'M', 'G', 'GG'] };
const cor = { nome: 'Cor', valores: ['Preta', 'Branca'] };

const polo: DadosVariacao = {
  precoBase: centavos(12990),
  opcoes: [tamanho, cor],
  variacoes: [
    { combinacao: { Tamanho: 'GG' }, preco: centavos(13990) },
    { combinacao: { Tamanho: 'P', Cor: 'Branca' }, disponivel: false },
  ],
};

const semVariacao: DadosVariacao = { precoBase: centavos(1290), opcoes: [], variacoes: [] };

describe('todasCombinacoes', () => {
  it('gera o produto cartesiano', () => {
    expect(todasCombinacoes([tamanho, cor])).toHaveLength(8);
    expect(todasCombinacoes([tamanho, cor])[0]).toEqual({ Tamanho: 'P', Cor: 'Preta' });
  });
  it('sem opções, uma combinação vazia', () => {
    expect(todasCombinacoes([])).toEqual([{}]);
  });
});

describe('resolverCombinacao', () => {
  it('usa o preço base quando nada casa', () => {
    expect(resolverCombinacao(polo, { Tamanho: 'M', Cor: 'Preta' })).toEqual({
      preco: 12990,
      disponivel: true,
    });
  });

  it('variação parcial vale para todas as cores', () => {
    expect(resolverCombinacao(polo, { Tamanho: 'GG', Cor: 'Preta' }).preco).toBe(13990);
    expect(resolverCombinacao(polo, { Tamanho: 'GG', Cor: 'Branca' }).preco).toBe(13990);
  });

  it('indisponibilidade só na combinação exata', () => {
    expect(resolverCombinacao(polo, { Tamanho: 'P', Cor: 'Branca' }).disponivel).toBe(false);
    expect(resolverCombinacao(polo, { Tamanho: 'P', Cor: 'Preta' }).disponivel).toBe(true);
  });

  it('a mais específica vence, atributo por atributo', () => {
    const dados: DadosVariacao = {
      ...polo,
      variacoes: [
        { combinacao: { Tamanho: 'GG' }, preco: centavos(13990) },
        { combinacao: { Tamanho: 'GG', Cor: 'Branca' }, disponivel: false },
        { combinacao: { Tamanho: 'GG', Cor: 'Preta' }, preco: centavos(14990) },
      ],
    };
    // GG Branca: preço vem da regra parcial, disponibilidade da específica
    expect(resolverCombinacao(dados, { Tamanho: 'GG', Cor: 'Branca' })).toEqual({
      preco: 13990,
      disponivel: false,
    });
    expect(resolverCombinacao(dados, { Tamanho: 'GG', Cor: 'Preta' })).toEqual({
      preco: 14990,
      disponivel: true,
    });
  });

  it('produto sem variação', () => {
    expect(resolverCombinacao(semVariacao, {})).toEqual({ preco: 1290, disponivel: true });
  });
});

describe('seleção', () => {
  it('combinação completa exige todas as opções com valor válido', () => {
    expect(combinacaoCompleta(polo.opcoes, { Tamanho: 'G' })).toBe(false);
    expect(combinacaoCompleta(polo.opcoes, { Tamanho: 'G', Cor: 'Azul' })).toBe(false);
    expect(combinacaoCompleta(polo.opcoes, { Tamanho: 'G', Cor: 'Preta' })).toBe(true);
    expect(combinacaoCompleta([], {})).toBe(true);
  });

  it('lista o que falta escolher, na ordem', () => {
    expect(opcoesFaltando(polo.opcoes, {}).map((o) => o.nome)).toEqual(['Tamanho', 'Cor']);
    expect(opcoesFaltando(polo.opcoes, { Cor: 'Preta' }).map((o) => o.nome)).toEqual(['Tamanho']);
  });

  it('chave estável independe da ordem das propriedades', () => {
    const a = chaveCombinacao(polo.opcoes, { Tamanho: 'G', Cor: 'Preta' });
    const b = chaveCombinacao(polo.opcoes, { Cor: 'Preta', Tamanho: 'G' });
    expect(a).toBe(b);
    expect(a).toBe('Tamanho=G|Cor=Preta');
    expect(chaveCombinacao([], {})).toBe('');
  });
});

describe('valorDisponivel', () => {
  it('desabilita Branca quando o tamanho P está escolhido', () => {
    expect(valorDisponivel(polo, { Tamanho: 'P' }, 'Cor', 'Branca')).toBe(false);
    expect(valorDisponivel(polo, { Tamanho: 'M' }, 'Cor', 'Branca')).toBe(true);
  });

  it('sem seleção, P continua possível (existe P Preta)', () => {
    expect(valorDisponivel(polo, {}, 'Tamanho', 'P')).toBe(true);
  });

  it('valor esgotado em todas as combinações fica indisponível', () => {
    const dados: DadosVariacao = {
      ...polo,
      variacoes: [{ combinacao: { Tamanho: 'GG' }, disponivel: false }],
    };
    expect(valorDisponivel(dados, {}, 'Tamanho', 'GG')).toBe(false);
    expect(valorDisponivel(dados, { Cor: 'Preta' }, 'Tamanho', 'GG')).toBe(false);
  });
});

describe('faixaDePreco', () => {
  it('menor e maior entre disponíveis', () => {
    expect(faixaDePreco(polo)).toEqual({ min: 12990, max: 13990, esgotado: false });
    expect(faixaDePreco(semVariacao)).toEqual({ min: 1290, max: 1290, esgotado: false });
  });

  it('tudo esgotado', () => {
    const dados: DadosVariacao = { ...semVariacao, variacoes: [] };
    const esgotado: DadosVariacao = {
      ...polo,
      variacoes: [
        { combinacao: { Cor: 'Preta' }, disponivel: false },
        { combinacao: { Cor: 'Branca' }, disponivel: false },
      ],
    };
    expect(faixaDePreco(dados).esgotado).toBe(false);
    expect(faixaDePreco(esgotado)).toEqual({ min: 12990, max: 12990, esgotado: true });
  });
});

describe('validarVariacoes', () => {
  it('catálogo correto não tem erro', () => {
    expect(validarVariacoes(polo)).toEqual([]);
    expect(validarVariacoes(semVariacao)).toEqual([]);
  });

  it('opção inexistente', () => {
    const erros = validarVariacoes({
      ...polo,
      variacoes: [{ combinacao: { Tamaho: 'GG' }, preco: centavos(1) }],
    });
    expect(erros[0]?.mensagem).toMatch(/"Tamaho" não existe/);
    expect(erros[0]?.caminho).toEqual(['variacoes', 0, 'combinacao', 'Tamaho']);
  });

  it('valor inexistente', () => {
    const erros = validarVariacoes({
      ...polo,
      variacoes: [{ combinacao: { Tamanho: 'XG' }, preco: centavos(1) }],
    });
    expect(erros[0]?.mensagem).toMatch(/"XG" não é um valor de "Tamanho"/);
  });

  it('combinação vazia e variação que não muda nada', () => {
    const erros = validarVariacoes({ ...polo, variacoes: [{ combinacao: {} }] });
    expect(erros.map((e) => e.mensagem).join(' ')).toMatch(/vazia/);
    expect(erros.map((e) => e.mensagem).join(' ')).toMatch(/não muda nada/);
  });

  it('opção e valor duplicados', () => {
    const erros = validarVariacoes({
      ...polo,
      opcoes: [tamanho, { nome: 'Tamanho', valores: ['P', 'P'] }],
      variacoes: [],
    });
    expect(erros).toHaveLength(2);
  });

  it('combinação repetida', () => {
    const erros = validarVariacoes({
      ...polo,
      variacoes: [
        { combinacao: { Tamanho: 'GG', Cor: 'Preta' }, preco: centavos(1) },
        { combinacao: { Cor: 'Preta', Tamanho: 'GG' }, disponivel: false },
      ],
    });
    expect(erros[0]?.mensagem).toMatch(/repete a variação nº 1/);
  });

  it('conflito de mesma especificidade', () => {
    const erros = validarVariacoes({
      ...polo,
      variacoes: [
        { combinacao: { Tamanho: 'GG' }, preco: centavos(13990) },
        { combinacao: { Cor: 'Preta' }, preco: centavos(13500) },
      ],
    });
    expect(erros).toHaveLength(1);
    expect(erros[0]?.mensagem).toMatch(/nº 1 e 2 definem "preco"/);
  });

  it('sem conflito quando os valores são iguais', () => {
    const erros = validarVariacoes({
      ...polo,
      variacoes: [
        { combinacao: { Tamanho: 'GG' }, disponivel: false },
        { combinacao: { Cor: 'Preta' }, disponivel: false },
      ],
    });
    expect(erros).toEqual([]);
  });
});
