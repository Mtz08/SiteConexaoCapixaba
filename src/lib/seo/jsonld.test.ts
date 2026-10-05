import { describe, expect, it } from 'vitest';
import { centavos } from '../dinheiro';
import { organizacao, perguntasFrequentes, produto, serializarJsonLd, siteWeb, trilha } from './jsonld';

const BASE = 'https://exemplo.com.br';

const polo = {
  id: 'polo-conexao',
  slug: 'camisa-polo',
  nome: 'Camisa Polo',
  descricao: ['Primeiro.', 'Segundo.'],
  categoria: 'Camisas Polo',
  precoBase: centavos(12990),
  opcoes: [
    { nome: 'Tamanho', valores: ['P', 'M', 'G', 'GG'] },
    { nome: 'Cor', valores: ['Preta', 'Branca'] },
  ],
  variacoes: [{ combinacao: { Tamanho: 'GG' }, preco: centavos(13990) }],
};

describe('Product + Offer', () => {
  it('preços diferentes viram AggregateOffer em BRL', () => {
    const ld = produto(polo, [], BASE);
    expect(ld['@type']).toBe('Product');
    expect(ld.sku).toBe('polo-conexao');
    expect(ld.description).toBe('Primeiro. Segundo.');
    expect(ld.offers).toMatchObject({
      '@type': 'AggregateOffer',
      lowPrice: '129.90',
      highPrice: '139.90',
      offerCount: 8,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: 'https://exemplo.com.br/produto/camisa-polo',
    });
    expect(ld).not.toHaveProperty('image');
  });

  it('preço único vira Offer com imagens absolutas', () => {
    const adesivo = { ...polo, opcoes: [], variacoes: [], precoBase: centavos(1290) };
    const ld = produto(adesivo, ['/_astro/foto.jpg'], BASE);
    expect(ld.offers).toMatchObject({ '@type': 'Offer', price: '12.90' });
    expect(ld.image).toEqual(['https://exemplo.com.br/_astro/foto.jpg']);
  });

  it('tudo esgotado: OutOfStock', () => {
    const esgotado = { ...polo, opcoes: [], variacoes: [{ combinacao: {}, disponivel: false }] };
    expect((produto(esgotado, [], BASE).offers as Record<string, unknown>).availability).toBe(
      'https://schema.org/OutOfStock',
    );
  });
});

describe('outros tipos', () => {
  it('Organization e WebSite', () => {
    expect(organizacao(BASE)).toMatchObject({ '@type': 'Organization', url: 'https://exemplo.com.br/' });
    expect(siteWeb(BASE)).toMatchObject({ '@type': 'WebSite', inLanguage: 'pt-BR' });
  });

  it('BreadcrumbList com posições e URL do item atual', () => {
    const ld = trilha(
      [{ rotulo: 'Início', href: '/' }, { rotulo: 'Loja', href: '/loja' }, { rotulo: 'Boné' }],
      `${BASE}/produto/bone`,
    );
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://exemplo.com.br/' },
      { '@type': 'ListItem', position: 2, name: 'Loja', item: 'https://exemplo.com.br/loja' },
      { '@type': 'ListItem', position: 3, name: 'Boné', item: 'https://exemplo.com.br/produto/bone' },
    ]);
  });

  it('FAQPage', () => {
    const ld = perguntasFrequentes([{ pergunta: 'P?', resposta: ['A.', 'B.'] }]);
    expect(ld.mainEntity).toEqual([
      { '@type': 'Question', name: 'P?', acceptedAnswer: { '@type': 'Answer', text: 'A. B.' } },
    ]);
  });
});

describe('serializarJsonLd', () => {
  it('não deixa fechar a tag script', () => {
    const texto = serializarJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(texto).not.toContain('</script>');
    expect(JSON.parse(texto).name).toBe('</script><script>alert(1)</script>');
  });
});
