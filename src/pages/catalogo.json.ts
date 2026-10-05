import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { listarProdutos, mapaCategorias } from '../lib/catalogo/consultas';
import { fotoPrincipal, fotosDoProduto } from '../lib/catalogo/fotos';

/**
 * Catálogo público, gerado no build: usado pelo carrinho no navegador para revalidar
 * itens (produto removido, preço alterado, combinação esgotada) e mostrar miniaturas.
 * Só produtos ativos. Preços em centavos.
 */
export const GET: APIRoute = async () => {
  const [produtos, categorias] = await Promise.all([listarProdutos(), mapaCategorias()]);

  const lista = await Promise.all(
    produtos.map(async (p) => {
      const categoria = categorias.get(p.categoria);
      const foto = fotoPrincipal(fotosDoProduto(p));
      const miniatura = foto ? (await getImage({ src: foto.imagem, width: 160, format: 'webp' })).src : null;
      return {
        id: p.id,
        slug: p.slug,
        nome: p.nome,
        precoBase: p.precoBase,
        opcoes: p.opcoes,
        variacoes: p.variacoes.map(({ combinacao, preco, disponivel }) => ({
          combinacao,
          preco,
          disponivel,
        })),
        categoria: {
          cor: categoria?.cor ?? 'branca',
          icone: categoria?.icone ?? 'adesivo',
          nomeSingular: categoria?.nomeSingular ?? '',
        },
        miniatura,
      };
    }),
  );

  return new Response(JSON.stringify({ versao: 1, produtos: lista }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
