import { useStore } from '@nanostores/preact';
import { useEffect, useState } from 'preact/hooks';
import { $gavetaAberta } from '../../stores/carrinho';

interface Props {
  link: string;
}

/**
 * Botão flutuante de WhatsApp (canto inferior direito), em todas as páginas.
 * Some quando a gaveta do carrinho está aberta e quando algum elemento marcado com
 * [data-esconde-flutuante] (ex.: botões de compra do produto, rodapé) está na tela,
 * para nunca cobrir os botões de comprar/adicionar no celular.
 * Sem JavaScript, continua visível como um link simples.
 */
export default function WhatsAppFlutuante({ link }: Props) {
  const gavetaAberta = useStore($gavetaAberta);
  const [cobriria, setCobriria] = useState(false);

  useEffect(() => {
    const alvos = document.querySelectorAll('[data-esconde-flutuante]');
    if (alvos.length === 0 || !('IntersectionObserver' in window)) return;
    const visiveis = new Set<Element>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visiveis.add(e.target);
          else visiveis.delete(e.target);
        }
        setCobriria(visiveis.size > 0);
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    alvos.forEach((a) => observador.observe(a));
    return () => observador.disconnect();
  }, []);

  const escondido = gavetaAberta || cobriria;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      class={`whatsapp-flutuante${escondido ? ' whatsapp-flutuante--escondido' : ''}`}
      aria-hidden={escondido ? 'true' : undefined}
      tabIndex={escondido ? -1 : undefined}
    >
      <svg
        viewBox="0 0 24 24"
        width="30"
        height="30"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" stroke-linejoin="round" />
        <path
          d="M8.6 8.2c.2-.5.5-.6.8-.6h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.6l-.6.7a5.6 5.6 0 0 0 2.6 2.4l.7-.7c.2-.2.4-.2.6-.1l1.9.9c.2.1.3.3.3.5v.6c0 .3-.2.7-.6.9-.6.3-1.4.4-2.3.1a8.5 8.5 0 0 1-5.4-5.3c-.3-.9-.2-1.7.2-2.3Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
      <span class="sr-only">Falar com a Conexão Capixaba no WhatsApp (abre em nova aba)</span>
    </a>
  );
}
