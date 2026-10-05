import { instagramUrl, site } from '../../config/site';
import { centavosParaDecimal } from '../dinheiro';
import { faixaDePreco, todasCombinacoes, type DadosVariacao } from '../catalogo/variacoes';

/**
 * Dados estruturados (schema.org em JSON-LD) para o Google entender a loja.
 * Funções puras: recebem dados e a URL base, devolvem objetos prontos para serializar.
 */

export type JsonLd = Record<string, unknown>;

/** JSON seguro dentro de <script>: impede que um "</script>" no texto feche a tag. */
export function serializarJsonLd(dados: JsonLd | JsonLd[]): string {
  return JSON.stringify(dados).replace(/</g, '\\u003c');
}

const absoluta = (caminho: string, base: string) => new URL(caminho, base).href;

export function organizacao(base: string = site.url): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': absoluta('/#organizacao', base),
    name: site.nome,
    slogan: site.slogan,
    url: absoluta('/', base),
    logo: absoluta('/icone-512.png', base),
    sameAs: [instagramUrl],
    areaServed: { '@type': 'Country', name: 'Brasil' },
  };
}

export function siteWeb(base: string = site.url): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluta('/#site', base),
    name: site.nome,
    url: absoluta('/', base),
    inLanguage: 'pt-BR',
    publisher: { '@id': absoluta('/#organizacao', base) },
  };
}

export interface ProdutoLd extends DadosVariacao {
  id: string;
  slug: string;
  nome: string;
  descricao: string[];
  categoria: string;
}

export function produto(p: ProdutoLd, imagens: string[], base: string = site.url): JsonLd {
  const url = absoluta(`/produto/${p.slug}`, base);
  const faixa = faixaDePreco(p);
  const disponibilidade = faixa.esgotado ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
  const comum = {
    priceCurrency: 'BRL',
    availability: disponibilidade,
    itemCondition: 'https://schema.org/NewCondition',
    url,
    seller: { '@id': absoluta('/#organizacao', base) },
  };
  const ofertas =
    faixa.min === faixa.max
      ? { '@type': 'Offer', price: centavosParaDecimal(faixa.min), ...comum }
      : {
          '@type': 'AggregateOffer',
          lowPrice: centavosParaDecimal(faixa.min),
          highPrice: centavosParaDecimal(faixa.max),
          offerCount: todasCombinacoes(p.opcoes).length,
          ...comum,
        };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#produto`,
    name: p.nome,
    description: p.descricao.join(' '),
    sku: p.id,
    category: p.categoria,
    brand: { '@type': 'Brand', name: site.nome },
    ...(imagens.length > 0 ? { image: imagens.map((i) => absoluta(i, base)) } : {}),
    offers: ofertas,
  };
}

export function trilha(itens: { rotulo: string; href?: string | undefined }[], urlAtual: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.rotulo,
      item: item.href ? absoluta(item.href, urlAtual) : urlAtual,
    })),
  };
}

export function perguntasFrequentes(perguntas: { pergunta: string; resposta: string[] }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: perguntas.map((p) => ({
      '@type': 'Question',
      name: p.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: p.resposta.join(' ') },
    })),
  };
}
