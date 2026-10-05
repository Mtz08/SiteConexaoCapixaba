import { readFileSync } from 'node:fs';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { criarSchemaMedidas, criarSchemaProduto, schemaCategoria } from './lib/catalogo/schema';
import { lerListaJson } from './lib/catalogo/lerJson';
import { catalogoLoader } from './lib/catalogo/loader';

// Mensagens padrão do Zod em português (as do catálogo já são personalizadas).
z.config(z.locales.ptBR());

const ARQUIVO_CATEGORIAS = 'src/data/categorias.json';
const ARQUIVO_PRODUTOS = 'src/data/produtos.json';
const ARQUIVO_MEDIDAS = 'src/data/medidas.json';

const lerCategorias = (texto: string) =>
  lerListaJson(texto, 'categorias.json', { unicos: ['id', 'ordem'], rotulo: 'nome' });

const lerProdutos = (texto: string) =>
  lerListaJson(texto, 'produtos.json', { unicos: ['id', 'slug'], rotulo: 'nome' });

const lerMedidas = (texto: string) => lerListaJson(texto, 'medidas.json', { unicos: ['id'], rotulo: 'nome' });

/** Ids das categorias, lidos do próprio categorias.json: única fonte da verdade. */
function idsCategorias(): readonly [string, ...string[]] {
  const ids = lerCategorias(readFileSync(ARQUIVO_CATEGORIAS, 'utf8')).map((c) => String(c.id));
  const [primeiro, ...resto] = ids;
  if (!primeiro) throw new Error(`${ARQUIVO_CATEGORIAS} precisa ter pelo menos uma categoria.`);
  return [primeiro, ...resto];
}

const categorias = defineCollection({
  loader: catalogoLoader(ARQUIVO_CATEGORIAS, lerCategorias),
  schema: schemaCategoria,
});

const produtos = defineCollection({
  loader: catalogoLoader(ARQUIVO_PRODUTOS, lerProdutos),
  schema: criarSchemaProduto(idsCategorias()),
});

const medidas = defineCollection({
  loader: catalogoLoader(ARQUIVO_MEDIDAS, lerMedidas),
  schema: criarSchemaMedidas(idsCategorias()),
});

export const collections = { categorias, produtos, medidas };
