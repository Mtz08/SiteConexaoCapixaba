import { describe, expect, it } from 'vitest';
import { centavos } from './dinheiro';
import {
  LIMITE_URL,
  mensagemInteresse,
  montarLinkWhatsApp,
  montarMensagemPedido,
  montarPedidoWhatsApp,
  totalDosItens,
  type ItemMensagem,
} from './whatsapp';
import { ALFABETO_CODIGO, gerarCodigoPedido } from './codigoPedido';

const polo: ItemMensagem = {
  nome: 'Camisa Polo Conexão Capixaba',
  opcoes: [
    ['Tamanho', 'G'],
    ['Cor', 'Preta'],
  ],
  quantidade: 2,
  precoUnitario: centavos(12990),
};
const adesivo: ItemMensagem = {
  nome: 'Adesivo Conexão Capixaba',
  opcoes: [],
  quantidade: 1,
  precoUnitario: centavos(1290),
};

describe('montarMensagemPedido', () => {
  it('reproduz exatamente o formato combinado (com nome e cidade)', () => {
    const mensagem = montarMensagemPedido([polo, adesivo], {
      codigo: 'CC-7F3K2',
      cliente: { nome: 'João', cidade: 'Vitória/ES' },
    });
    expect(mensagem).toBe(
      [
        'Olá, Conexão Capixaba! Quero fazer este pedido:',
        '',
        '*Pedido #CC-7F3K2*',
        '',
        '1) Camisa Polo Conexão Capixaba',
        '   Tamanho: G | Cor: Preta',
        '   2 x R$ 129,90 = R$ 259,80',
        '',
        '2) Adesivo Conexão Capixaba',
        '   1 x R$ 12,90 = R$ 12,90',
        '',
        '*Total dos produtos: R$ 272,70*',
        '(frete a combinar)',
        '',
        'Nome: João',
        'Cidade: Vitória/ES',
        '',
        'Pedido feito pelo site.',
      ].join('\n'),
    );
  });

  it('1 item sem variação e sem cliente: sem linhas de nome/cidade', () => {
    const mensagem = montarMensagemPedido([adesivo], { codigo: 'CC-AAAAA' });
    expect(mensagem).not.toMatch(/Nome:|Cidade:/);
    expect(mensagem).toMatch(/1\) Adesivo Conexão Capixaba\n {3}1 x R\$ 12,90 = R\$ 12,90/);
    expect(mensagem).toMatch(/\*Total dos produtos: R\$ 12,90\*/);
  });

  it('item com 2 variações mostra as duas', () => {
    expect(montarMensagemPedido([polo], { codigo: 'CC-AAAAA' })).toMatch(/Tamanho: G \| Cor: Preta/);
  });

  it('só o nome, sem cidade', () => {
    const mensagem = montarMensagemPedido([adesivo], {
      codigo: 'CC-AAAAA',
      cliente: { nome: 'Ana', cidade: '  ' },
    });
    expect(mensagem).toMatch(/\n\nNome: Ana\n\nPedido feito pelo site\.$/);
    expect(mensagem).not.toMatch(/Cidade:/);
  });

  it('limpa quebras de linha e espaços digitados', () => {
    const mensagem = montarMensagemPedido([adesivo], {
      codigo: 'CC-AAAAA',
      cliente: { nome: '  Ana\n\n*Maria*  ', cidade: 'Serra /  ES' },
    });
    expect(mensagem).toMatch(/Nome: Ana \*Maria\*\nCidade: Serra \/ ES/);
  });

  it('carrinho com 6+ itens soma certo', () => {
    const itens = Array.from({ length: 7 }, (_, i) => ({
      ...adesivo,
      nome: `Adesivo ${i + 1}`,
      quantidade: i + 1,
    }));
    // 1+2+...+7 = 28 x 12,90 = 361,20
    expect(totalDosItens(itens)).toBe(36120);
    const mensagem = montarMensagemPedido(itens, { codigo: 'CC-AAAAA' });
    expect(mensagem).toMatch(/7\) Adesivo 7\n {3}7 x R\$ 12,90 = R\$ 90,30/);
    expect(mensagem).toMatch(/Total dos produtos: R\$ 361,20/);
  });

  it('formato compacto: uma linha por item', () => {
    const mensagem = montarMensagemPedido([polo, adesivo], { codigo: 'CC-AAAAA', compacta: true });
    expect(mensagem).toMatch(
      /1\) Camisa Polo Conexão Capixaba \(G, Preta\) — 2 x R\$ 129,90 = R\$ 259,80\n2\) Adesivo/,
    );
  });
});

describe('montarLinkWhatsApp', () => {
  it('usa wa.me com o texto codificado', () => {
    const link = montarLinkWhatsApp('Olá & tchau', '5527912345678');
    expect(link).toBe('https://wa.me/5527912345678?text=Ol%C3%A1%20%26%20tchau');
  });
  it('sem mensagem, só o número', () => {
    expect(montarLinkWhatsApp(undefined, '5527912345678')).toBe('https://wa.me/5527912345678');
  });
  it('mensagem de interesse (sem JS)', () => {
    expect(mensagemInteresse('Boné')).toMatch(/interesse no produto: Boné/);
  });
});

describe('montarPedidoWhatsApp', () => {
  it('pedido normal fica no formato completo', () => {
    const r = montarPedidoWhatsApp([polo, adesivo], { codigo: 'CC-AAAAA' });
    expect(r.compacta).toBe(false);
    expect(r.link.length).toBeLessThanOrEqual(LIMITE_URL);
    expect(decodeURIComponent(r.link.split('text=')[1] ?? '')).toBe(r.mensagem);
  });

  it('pedido enorme passa para o compacto automaticamente', () => {
    const itens = Array.from({ length: 14 }, (_, i) => ({
      ...polo,
      nome: `Camisa Polo Conexão Capixaba ${i + 1}`,
    }));
    const completo = montarLinkWhatsApp(montarMensagemPedido(itens, { codigo: 'CC-AAAAA' }));
    expect(completo.length).toBeGreaterThan(LIMITE_URL);
    const r = montarPedidoWhatsApp(itens, { codigo: 'CC-AAAAA' });
    expect(r.compacta).toBe(true);
    expect(r.link.length).toBeLessThan(completo.length);
  });

  it('trocar o número muda o link', () => {
    expect(montarPedidoWhatsApp([adesivo], { codigo: 'CC-AAAAA' }, '5527900001111').link).toMatch(
      /^https:\/\/wa\.me\/5527900001111\?text=/,
    );
  });
});

describe('gerarCodigoPedido', () => {
  it('formato CC- + 5 caracteres do alfabeto sem ambíguos', () => {
    for (let i = 0; i < 200; i++) {
      const codigo = gerarCodigoPedido();
      expect(codigo).toMatch(/^CC-[34679ACDEFGHJKMNPQRTUVWXY]{5}$/);
    }
  });

  it('alfabeto não tem caracteres confundíveis', () => {
    for (const ambiguo of ['0', 'O', '1', 'I', 'L', '5', 'S', '2', 'Z', '8', 'B']) {
      expect(ALFABETO_CODIGO).not.toContain(ambiguo);
    }
  });

  it('determinístico com gerador injetado', () => {
    expect(gerarCodigoPedido(() => new Uint32Array([0, 1, 2, 3, 24]))).toBe('CC-3467Y');
  });
});
