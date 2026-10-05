import { describe, expect, it } from 'vitest';
import {
  atualizarFotosNoTexto,
  interpretarNome,
  nomeFinal,
  ordenarFotos,
  slugificar,
  sugerirProduto,
} from './lib-fotos.mjs';

const produtos = [
  { id: 'polo-conexao', slug: 'camisa-polo-conexao-capixaba', nome: 'Camisa Polo Conexão Capixaba' },
  { id: 'camiseta-rei-da-estrada', slug: 'camiseta-rei-da-estrada', nome: 'Camiseta Rei da Estrada' },
  { id: 'bone-conexao', slug: 'bone-conexao-capixaba', nome: 'Boné Conexão Capixaba' },
];

describe('interpretarNome', () => {
  it.each([
    ['polo-conexao__1.jpg', { id: 'polo-conexao', cor: null, numero: 1, extensao: '.jpg' }],
    ['polo-conexao__preta__2.jpeg', { id: 'polo-conexao', cor: 'preta', numero: 2, extensao: '.jpeg' }],
    ['POLO-CONEXAO__Branca__3.PNG', { id: 'polo-conexao', cor: 'branca', numero: 3, extensao: '.png' }],
    ['bone-conexao__10.webp', { id: 'bone-conexao', cor: null, numero: 10, extensao: '.webp' }],
    [
      'polo-conexao__azul marinho__1.heic',
      { id: 'polo-conexao', cor: 'azul-marinho', numero: 1, extensao: '.heic' },
    ],
  ])('%s', (nome, esperado) => {
    expect(interpretarNome(nome)).toEqual(esperado);
  });

  it.each([
    ['IMG_2041.jpg', /fora da convenção/],
    ['polo-conexao_1.jpg', /fora da convenção/],
    ['polo-conexao__um.jpg', /não é um número/],
    ['polo-conexao__0.jpg', /não é um número/],
    ['polo-conexao__1.gif', /extensão ".gif" não aceita/],
    ['polo-conexao__1', /extensão/],
    ['a__b__c__1.jpg', /fora da convenção/],
  ])('recusa %s', (nome, erro) => {
    expect(interpretarNome(nome).erro).toMatch(erro);
  });
});

describe('sugerirProduto', () => {
  it('sugere por id parecido', () => {
    expect(sugerirProduto('polo-conexão', produtos)?.id).toBe('polo-conexao');
    expect(sugerirProduto('camiseta-rei-estrada', produtos)?.id).toBe('camiseta-rei-da-estrada');
    expect(sugerirProduto('bone', produtos)?.id).toBe('bone-conexao');
  });

  it('não sugere quando nada é parecido', () => {
    expect(sugerirProduto('chaveiro-de-pelucia', produtos)).toBeNull();
  });
});

describe('ordenarFotos e nomeFinal', () => {
  it('gerais primeiro, depois cores na ordem do produto', () => {
    const lista = [
      'polo/branca-1.webp',
      'polo/2.webp',
      'polo/preta-2.webp',
      'polo/1.webp',
      'polo/preta-1.webp',
    ];
    expect(ordenarFotos(lista, ['Preta', 'Branca'])).toEqual([
      'polo/1.webp',
      'polo/2.webp',
      'polo/preta-1.webp',
      'polo/preta-2.webp',
      'polo/branca-1.webp',
    ]);
  });

  it('sem duplicatas (idempotente)', () => {
    expect(ordenarFotos(['p/1.webp', 'p/1.webp'])).toEqual(['p/1.webp']);
  });

  it('nome do arquivo final', () => {
    expect(nomeFinal(null, 1)).toBe('1.webp');
    expect(nomeFinal('preta', 2)).toBe('preta-2.webp');
  });

  it('slug', () => {
    expect(slugificar('Azul Marinho')).toBe('azul-marinho');
  });
});

describe('atualizarFotosNoTexto', () => {
  const texto = `[
  {
    "id": "polo-conexao",
    "nome": "Polo",
    "fotos": [],
    "tags": ["a", "b"],
    "_notas": "TODO: [confirmar] cores"
  },
  {
    "id": "bone-conexao",
    "nome": "Boné",
    "fotos": ["bone-conexao/1.webp"]
  }
]
`;

  it('troca só o array do produto certo, preservando o resto', () => {
    const novo = atualizarFotosNoTexto(texto, 'polo-conexao', [
      'polo-conexao/1.webp',
      'polo-conexao/preta-1.webp',
    ]);
    expect(novo).toContain('"fotos": ["polo-conexao/1.webp", "polo-conexao/preta-1.webp"],');
    expect(novo).toContain('"tags": ["a", "b"],');
    expect(novo).toContain('"_notas": "TODO: [confirmar] cores"');
    expect(novo).toContain('"fotos": ["bone-conexao/1.webp"]');
    expect(JSON.parse(novo)[0].fotos).toHaveLength(2);
    // tudo fora do array continua idêntico
    expect(novo.replace(/"fotos": \[[^\]]*\]/g, '')).toBe(texto.replace(/"fotos": \[[^\]]*\]/g, ''));
  });

  it('atualiza o último produto também', () => {
    const novo = atualizarFotosNoTexto(texto, 'bone-conexao', ['bone-conexao/1.webp', 'bone-conexao/2.webp']);
    expect(JSON.parse(novo)[1].fotos).toEqual(['bone-conexao/1.webp', 'bone-conexao/2.webp']);
    expect(JSON.parse(novo)[0].fotos).toEqual([]);
  });

  it('produto sem campo fotos recebe o campo', () => {
    const semFotos = '[\n  {\n    "id": "x",\n    "nome": "X"\n  }\n]\n';
    expect(JSON.parse(atualizarFotosNoTexto(semFotos, 'x', ['x/1.webp']))[0].fotos).toEqual(['x/1.webp']);
  });

  it('produto inexistente gera erro', () => {
    expect(() => atualizarFotosNoTexto(texto, 'nao-existe', [])).toThrow(/não encontrado/);
  });

  it('não confunde id que é prefixo de outro', () => {
    const t = '[{"id": "polo-conexao-2", "fotos": []}, {"id": "polo-conexao", "fotos": []}]';
    const novo = JSON.parse(atualizarFotosNoTexto(t, 'polo-conexao', ['p/1.webp']));
    expect(novo[0].fotos).toEqual([]);
    expect(novo[1].fotos).toEqual(['p/1.webp']);
  });
});
