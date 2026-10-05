import { formatarPreco, type Centavos } from '../../lib/dinheiro';

interface Props {
  preco: Centavos;
  /** Preço antigo (promoção), mostrado riscado. */
  precoDe?: Centavos | undefined;
  /** Mostra "a partir de" (produto com preços diferentes por variação). */
  aPartirDe?: boolean;
  tamanho?: 'md' | 'lg';
  class?: string | undefined;
}

export function Preco({ preco, precoDe, aPartirDe = false, tamanho = 'md', class: classe }: Props) {
  return (
    <p class={`preco preco--${tamanho}${classe ? ` ${classe}` : ''}`}>
      {precoDe !== undefined && (
        <span class="preco__de">
          <span class="sr-only">De </span>
          <s>{formatarPreco(precoDe)}</s>
          <span class="sr-only"> por </span>
        </span>
      )}
      {aPartirDe && <span class="preco__a-partir">a partir de </span>}
      <span class="preco__valor">{formatarPreco(preco)}</span>
    </p>
  );
}
