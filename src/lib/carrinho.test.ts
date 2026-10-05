import { describe, expect, it } from 'vitest';
import { centavos } from './dinheiro';
import {
  CHAVE_CARRINHO,
  adicionar,
  alterarQuantidade,
  carrinhoVazio,
  desfazerRemocao,
  idLinha,
  lerCarrinhoSalvo,
  remover,
  revalidar,
  totalDeItens,
  totalDoCarrinho,
  type EstadoCarrinho,
  type LinhaCarrinho,
  type ProdutoCatalogo,
} from './carrinho';

const MAX = 20;

const linha = (parcial: Partial<LinhaCarrinho> = {}): LinhaCarrinho => ({
  produtoId: 'camiseta-rei-da-estrada',
  combinacao: { Tamanho: 'G' },
  quantidade: 1,
  precoUnitario: centavos(7990),
  nome: 'Camiseta Rei da Estrada',
  slug: 'camiseta-rei-da-estrada',
  ...parcial,
});

const catalogo: ProdutoCatalogo[] = [
  {
    id: 'camiseta-rei-da-estrada',
    slug: 'camiseta-rei-da-estrada',
    nome: 'Camiseta Rei da Estrada',
    precoBase: centavos(7990),
    opcoes: [{ nome: 'Tamanho', valores: ['P', 'M', 'G', 'GG'] }],
    variacoes: [{ combinacao: { Tamanho: 'GG' }, disponivel: false }],
  },
  {
    id: 'adesivo-conexao',
    slug: 'adesivo-conexao-capixaba',
    nome: 'Adesivo Conexão Capixaba',
    precoBase: centavos(1290),
    opcoes: [],
    variacoes: [],
  },
];

describe('adicionar', () => {
  it('cria linha nova', () => {
    const { estado } = adicionar(carrinhoVazio(), linha(), MAX);
    expect(estado.linhas).toHaveLength(1);
  });

  it('mesmo item soma a quantidade', () => {
    let { estado } = adicionar(carrinhoVazio(), linha({ quantidade: 2 }), MAX);
    ({ estado } = adicionar(estado, linha({ quantidade: 3 }), MAX));
    expect(estado.linhas).toHaveLength(1);
    expect(estado.linhas[0]?.quantidade).toBe(5);
  });

  it('mesma camiseta em P e em G = 2 linhas', () => {
    let { estado } = adicionar(carrinhoVazio(), linha({ combinacao: { Tamanho: 'P' } }), MAX);
    ({ estado } = adicionar(estado, linha({ combinacao: { Tamanho: 'G' } }), MAX));
    expect(estado.linhas).toHaveLength(2);
  });

  it('ordem das opções não cria linha duplicada', () => {
    let { estado } = adicionar(carrinhoVazio(), linha({ combinacao: { Tamanho: 'G', Cor: 'Preta' } }), MAX);
    ({ estado } = adicionar(estado, linha({ combinacao: { Cor: 'Preta', Tamanho: 'G' } }), MAX));
    expect(estado.linhas).toHaveLength(1);
    expect(estado.linhas[0]?.quantidade).toBe(2);
  });

  it('respeita o máximo e avisa', () => {
    let { estado } = adicionar(carrinhoVazio(), linha({ quantidade: 15 }), MAX);
    const r = adicionar(estado, linha({ quantidade: 10 }), MAX);
    estado = r.estado;
    expect(estado.linhas[0]?.quantidade).toBe(20);
    expect(r.limitada).toBe(true);
  });

  it('não altera o estado original (imutável)', () => {
    const inicial = carrinhoVazio();
    adicionar(inicial, linha(), MAX);
    expect(inicial.linhas).toHaveLength(0);
  });
});

describe('alterarQuantidade', () => {
  const base = adicionar(carrinhoVazio(), linha({ quantidade: 2 }), MAX).estado;
  const id = idLinha(linha());

  it('muda a quantidade', () => {
    expect(alterarQuantidade(base, id, 4, MAX).estado.linhas[0]?.quantidade).toBe(4);
  });

  it.each([
    [0, 1, false],
    [-3, 1, false],
    [99, 20, true],
    [Number.NaN, 1, false],
    [3.8, 3, false],
  ])('%s vira %s', (pedida, esperada, limitada) => {
    const r = alterarQuantidade(base, id, pedida, MAX);
    expect(r.quantidade).toBe(esperada);
    expect(r.limitada).toBe(limitada);
  });
});

describe('remover e desfazer', () => {
  it('remove e devolve à mesma posição', () => {
    let estado = adicionar(carrinhoVazio(), linha({ combinacao: { Tamanho: 'P' } }), MAX).estado;
    estado = adicionar(estado, linha({ combinacao: { Tamanho: 'M' } }), MAX).estado;
    estado = adicionar(estado, linha({ combinacao: { Tamanho: 'G' } }), MAX).estado;
    const r = remover(estado, idLinha(linha({ combinacao: { Tamanho: 'M' } })));
    expect(r.estado.linhas.map((l) => l.combinacao.Tamanho)).toEqual(['P', 'G']);
    expect(r.removida?.indice).toBe(1);
    if (!r.removida) throw new Error('linha não removida');
    const desfeito = desfazerRemocao(r.estado, r.removida.linha, r.removida.indice);
    expect(desfeito.linhas.map((l) => l.combinacao.Tamanho)).toEqual(['P', 'M', 'G']);
  });

  it('remover inexistente não faz nada', () => {
    expect(remover(carrinhoVazio(), 'x::y').removida).toBeUndefined();
  });

  it('desfazer não duplica se a linha já voltou', () => {
    const estado = adicionar(carrinhoVazio(), linha(), MAX).estado;
    expect(desfazerRemocao(estado, linha(), 0).linhas).toHaveLength(1);
  });
});

describe('totais', () => {
  it('soma itens e valores em centavos', () => {
    let estado = adicionar(carrinhoVazio(), linha({ quantidade: 2 }), MAX).estado;
    estado = adicionar(
      estado,
      linha({ produtoId: 'adesivo-conexao', combinacao: {}, precoUnitario: centavos(1290), quantidade: 3 }),
      MAX,
    ).estado;
    expect(totalDeItens(estado)).toBe(5);
    expect(totalDoCarrinho(estado)).toBe(2 * 7990 + 3 * 1290);
  });
});

describe('lerCarrinhoSalvo', () => {
  it('chave versionada', () => {
    expect(CHAVE_CARRINHO).toBe('carrinho:v1');
  });

  it('lê o que foi salvo', () => {
    const estado: EstadoCarrinho = { versao: 1, linhas: [linha()] };
    expect(lerCarrinhoSalvo(JSON.stringify(estado))).toEqual(estado);
  });

  it.each([
    ['nada', null],
    ['vazio', ''],
    ['JSON corrompido', '{"versao":1,"linhas":[{'],
    ['versão antiga', JSON.stringify({ versao: 0, itens: [] })],
    ['formato estranho', JSON.stringify([1, 2, 3])],
    ['texto solto', 'olá'],
  ])('%s → carrinho vazio, sem erro', (_caso, texto) => {
    expect(lerCarrinhoSalvo(texto)).toEqual(carrinhoVazio());
  });

  it('descarta só as linhas inválidas', () => {
    const texto = JSON.stringify({
      versao: 1,
      linhas: [linha(), { produtoId: 'x', quantidade: -1 }, linha({ precoUnitario: 10.5 as never }), 'lixo'],
    });
    expect(lerCarrinhoSalvo(texto).linhas).toHaveLength(1);
  });
});

describe('revalidar', () => {
  it('carrinho em dia não gera aviso', () => {
    const estado = adicionar(carrinhoVazio(), linha(), MAX).estado;
    expect(revalidar(estado, catalogo, MAX)).toEqual({ estado, avisos: [] });
  });

  it('produto removido ou inativo sai, com aviso', () => {
    const estado = adicionar(
      carrinhoVazio(),
      linha({ produtoId: 'moletom-x', nome: 'Moletom X' }),
      MAX,
    ).estado;
    const r = revalidar(estado, catalogo, MAX);
    expect(r.estado.linhas).toHaveLength(0);
    expect(r.avisos[0]?.motivo).toBe('removido');
    expect(r.avisos[0]?.mensagem).toMatch(/Moletom X \(G\) não está mais na loja/);
  });

  it('variação inexistente sai, com aviso', () => {
    const estado = adicionar(carrinhoVazio(), linha({ combinacao: { Tamanho: 'XG' } }), MAX).estado;
    expect(revalidar(estado, catalogo, MAX).avisos[0]?.motivo).toBe('variacao');
  });

  it('opção que deixou de existir (ex.: Cor removida) sai', () => {
    const estado = adicionar(
      carrinhoVazio(),
      linha({ combinacao: { Tamanho: 'G', Cor: 'Azul' } }),
      MAX,
    ).estado;
    expect(revalidar(estado, catalogo, MAX).estado.linhas).toHaveLength(0);
  });

  it('opção nova que o item não tinha (incompleta) sai', () => {
    const estado = adicionar(carrinhoVazio(), linha({ combinacao: {} }), MAX).estado;
    expect(revalidar(estado, catalogo, MAX).avisos[0]?.motivo).toBe('variacao');
  });

  it('combinação esgotada sai', () => {
    const estado = adicionar(carrinhoVazio(), linha({ combinacao: { Tamanho: 'GG' } }), MAX).estado;
    expect(revalidar(estado, catalogo, MAX).avisos[0]?.motivo).toBe('esgotado');
  });

  it('preço alterado é atualizado, com aviso', () => {
    const estado = adicionar(carrinhoVazio(), linha({ precoUnitario: centavos(6990) }), MAX).estado;
    const r = revalidar(estado, catalogo, MAX);
    expect(r.estado.linhas[0]?.precoUnitario).toBe(7990);
    expect(r.avisos).toEqual([
      { motivo: 'preco', mensagem: 'O preço de Camiseta Rei da Estrada foi atualizado.' },
    ]);
  });

  it('nome e slug vêm do catálogo atual', () => {
    const estado = adicionar(carrinhoVazio(), linha({ nome: 'Nome antigo', slug: 'antigo' }), MAX).estado;
    const r = revalidar(estado, catalogo, MAX);
    expect(r.estado.linhas[0]?.nome).toBe('Camiseta Rei da Estrada');
    expect(r.avisos).toEqual([]);
  });

  it('quantidade acima de um novo máximo é limitada', () => {
    const estado = adicionar(carrinhoVazio(), linha({ quantidade: 15 }), MAX).estado;
    const r = revalidar(estado, catalogo, 10);
    expect(r.estado.linhas[0]?.quantidade).toBe(10);
    expect(r.avisos[0]?.motivo).toBe('quantidade');
  });
});
