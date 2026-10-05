import { useStore } from '@nanostores/preact';
import { useEffect, useRef } from 'preact/hooks';
import ConteudoCarrinho from '../carrinho/ConteudoCarrinho';
import { useMontado } from '../carrinho/useMontado';
import { $gavetaAberta, $totalItens, revalidarCarrinho } from '../../stores/carrinho';

/**
 * Gaveta lateral do carrinho, disponível em todas as páginas.
 * <dialog> modal: foco preso dentro enquanto aberta, Esc fecha, e o foco volta ao botão que abriu.
 * Qualquer elemento com [data-abrir-carrinho] abre a gaveta (sem JS, ele é um link para /carrinho).
 */
export default function GavetaCarrinho() {
  const aberta = useStore($gavetaAberta);
  const itens = useStore($totalItens);
  const dialogo = useRef<HTMLDialogElement>(null);
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const origem = useRef<HTMLElement | null>(null);
  const montado = useMontado();

  // Delegação: links/botões com data-abrir-carrinho passam a abrir a gaveta.
  useEffect(() => {
    const aoClicar = (evento: MouseEvent) => {
      if (
        evento.defaultPrevented ||
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey
      )
        return;
      const alvo = (evento.target as Element | null)?.closest<HTMLElement>('[data-abrir-carrinho]');
      // Na própria página do carrinho, o link segue normal (não abre a gaveta por cima).
      if (!alvo || window.location.pathname.replace(/\.html$/, '') === '/carrinho') return;
      evento.preventDefault();
      origem.current = alvo;
      $gavetaAberta.set(true);
    };
    document.addEventListener('click', aoClicar);
    return () => document.removeEventListener('click', aoClicar);
  }, []);

  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (aberta && !el.open) {
      if (!origem.current && document.activeElement instanceof HTMLElement)
        origem.current = document.activeElement;
      el.showModal();
      botaoFechar.current?.focus();
      void revalidarCarrinho();
    } else if (!aberta && el.open) {
      el.close();
    }
  }, [aberta]);

  const aoFechar = () => {
    $gavetaAberta.set(false);
    origem.current?.focus();
    origem.current = null;
  };

  return (
    <dialog
      ref={dialogo}
      class="gaveta"
      aria-labelledby="gaveta-titulo"
      onClose={aoFechar}
      onClick={(e) => e.target === dialogo.current && $gavetaAberta.set(false)}
    >
      <div class="gaveta__painel">
        <header class="gaveta__topo">
          <h2 id="gaveta-titulo" class="gaveta__titulo">
            Seu carrinho
            {montado && itens > 0 && <span class="gaveta__qtd"> ({itens})</span>}
          </h2>
          <button
            type="button"
            ref={botaoFechar}
            class="botao-icone-gaveta"
            onClick={() => $gavetaAberta.set(false)}
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
            </svg>
            <span class="sr-only">Fechar carrinho</span>
          </button>
        </header>
        <div class="gaveta__conteudo">
          {aberta && <ConteudoCarrinho variante="gaveta" aoNavegar={() => $gavetaAberta.set(false)} />}
        </div>
        {aberta && itens > 0 && (
          <footer class="gaveta__rodape">
            <a href="/carrinho" class="carrinho__link" onClick={() => $gavetaAberta.set(false)}>
              Ver carrinho em página inteira
            </a>
          </footer>
        )}
      </div>
    </dialog>
  );
}
