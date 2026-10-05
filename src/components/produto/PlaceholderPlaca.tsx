import type { Categoria } from '../../lib/catalogo/schema';
import { IconeCategoria } from './IconeCategoria';

interface Props {
  nome: string;
  categoria: Pick<Categoria, 'cor' | 'icone' | 'nomeSingular'>;
  /** "cartao" (grade), "galeria" (página do produto) ou "mini" (carrinho, sem texto). */
  variante?: 'cartao' | 'galeria' | 'mini';
  class?: string | undefined;
}

/**
 * Foto provisória com cara de placa de rodovia: cor da categoria, moldura interna,
 * ícone e nome do produto. Usada enquanto o produto não tem foto — nunca imagem quebrada.
 */
export function PlaceholderPlaca({ nome, categoria, variante = 'cartao', class: classe }: Props) {
  return (
    <div
      class={`placeholder-placa placeholder-placa--${variante}${classe ? ` ${classe}` : ''}`}
      data-cor={categoria.cor}
      role="img"
      aria-label={`${nome} — foto em breve`}
    >
      <div class="placeholder-placa__moldura">
        {variante !== 'mini' && <span class="placeholder-placa__marca">Conexão Capixaba</span>}
        <IconeCategoria icone={categoria.icone} class="placeholder-placa__icone" />
        {variante !== 'mini' && <span class="placeholder-placa__nome">{nome}</span>}
      </div>
    </div>
  );
}
