import { useStore } from '@nanostores/preact';
import { useEffect, useState } from 'preact/hooks';
import { $totalItens, $ultimaAdicao, revalidarCarrinho } from '../../stores/carrinho';
import { useMontado } from '../carrinho/useMontado';

/** Contador do carrinho no cabeçalho. Pulsa quando um item é adicionado. */
export default function ContadorCarrinho() {
  const itens = useStore($totalItens);
  const ultima = useStore($ultimaAdicao);
  const [pulso, setPulso] = useState(0);
  const montado = useMontado();

  // Ao carregar a página, confere o carrinho salvo com o catálogo atual.
  useEffect(() => {
    void revalidarCarrinho();
  }, []);

  useEffect(() => {
    if (ultima) setPulso(ultima.vez);
  }, [ultima]);

  if (!montado || itens === 0) return null;
  return (
    <span key={pulso} class={`contador-carrinho${pulso ? ' contador-carrinho--pulso' : ''}`}>
      <span aria-hidden="true">{itens > 99 ? '99+' : itens}</span>
      <span class="sr-only">: {itens === 1 ? '1 item' : `${itens} itens`}</span>
    </span>
  );
}
