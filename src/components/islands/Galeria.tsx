import { useStore } from '@nanostores/preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { $selecao } from '../../stores/produto';

export interface FotoGaleria {
  /** srcset AVIF e WebP (gerados no build por astro:assets). */
  avif: string;
  webp: string;
  /** src de fallback (WebP médio). */
  src: string;
  /** Versão grande para o lightbox. */
  grande: string;
  miniatura: string;
  largura: number;
  altura: number;
  alt: string;
  cor?: string | undefined;
}

interface Props {
  fotos: FotoGaleria[];
  nomeProduto: string;
}

const TAMANHOS = '(min-width: 64rem) 46vw, (min-width: 48rem) 60vw, 100vw';

/** Fotos da cor escolhida primeiro; sem cor escolhida, as gerais primeiro. */
function ordenarPorCor(fotos: FotoGaleria[], cor: string | undefined): FotoGaleria[] {
  const daCor = cor ? fotos.filter((f) => f.cor === cor) : [];
  if (daCor.length > 0) return [...daCor, ...fotos.filter((f) => !f.cor)];
  return [...fotos.filter((f) => !f.cor), ...fotos.filter((f) => f.cor)];
}

export default function Galeria({ fotos, nomeProduto }: Props) {
  const cor = useStore($selecao).Cor;
  const lista = useMemo(() => ordenarPorCor(fotos, cor), [fotos, cor]);
  const [indice, setIndice] = useState(0);
  const [aberta, setAberta] = useState(false);
  const trilho = useRef<HTMLUListElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const multiplas = lista.length > 1;

  // Trocou a cor: volta para a primeira foto.
  useEffect(() => {
    setIndice(0);
    trilho.current?.scrollTo({ left: 0 });
  }, [cor]);

  // Ao abrir o lightbox, o foco vai para o botão Fechar (o conteúdo só existe após abrir).
  useEffect(() => {
    if (aberta) botaoFechar.current?.focus();
  }, [aberta]);

  // Acompanha o deslize (swipe) para atualizar miniaturas e contador.
  const aoRolar = () => {
    const el = trilho.current;
    if (!el) return;
    const novo = Math.round(el.scrollLeft / el.clientWidth);
    if (novo !== indice) setIndice(Math.max(0, Math.min(novo, lista.length - 1)));
  };

  const irPara = (i: number) => {
    const alvo = (i + lista.length) % lista.length;
    setIndice(alvo);
    const el = trilho.current;
    if (el) {
      const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollTo({ left: alvo * el.clientWidth, behavior: reduzido ? 'auto' : 'smooth' });
    }
  };

  const abrir = (i: number) => {
    setIndice(i);
    setAberta(true);
    dialogo.current?.showModal();
  };

  const fechar = () => dialogo.current?.close();

  const aoTeclarNoDialogo = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') irPara(indice + 1);
    if (e.key === 'ArrowLeft') irPara(indice - 1);
  };

  const atual = lista[indice] ?? lista[0];
  if (!atual) return null;

  return (
    <div class="galeria">
      <div class="galeria__palco">
        <ul
          ref={trilho}
          class="galeria__trilho"
          onScroll={aoRolar}
          aria-label={`Fotos de ${nomeProduto}`}
          tabIndex={multiplas ? 0 : undefined}
        >
          {lista.map((foto, i) => (
            <li key={foto.src} class="galeria__slide" aria-hidden={i !== indice ? 'true' : undefined}>
              <button
                type="button"
                class="galeria__ampliar"
                onClick={() => abrir(i)}
                tabIndex={i === indice ? 0 : -1}
                aria-label={`Ampliar: ${foto.alt}`}
              >
                <picture>
                  <source type="image/avif" srcset={foto.avif} sizes={TAMANHOS} />
                  <source type="image/webp" srcset={foto.webp} sizes={TAMANHOS} />
                  <img
                    src={foto.src}
                    alt={foto.alt}
                    width={foto.largura}
                    height={foto.altura}
                    class="foto-produto"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchpriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                  />
                </picture>
              </button>
            </li>
          ))}
        </ul>

        {multiplas && (
          <>
            <button
              type="button"
              class="galeria__seta galeria__seta--anterior"
              onClick={() => irPara(indice - 1)}
            >
              <span aria-hidden="true">‹</span>
              <span class="sr-only">Foto anterior</span>
            </button>
            <button
              type="button"
              class="galeria__seta galeria__seta--proxima"
              onClick={() => irPara(indice + 1)}
            >
              <span aria-hidden="true">›</span>
              <span class="sr-only">Próxima foto</span>
            </button>
            <p class="galeria__contador" aria-live="polite">
              {indice + 1} / {lista.length}
            </p>
          </>
        )}
      </div>

      {multiplas && (
        <ul class="galeria__miniaturas" aria-label="Escolher foto">
          {lista.map((foto, i) => (
            <li key={foto.src}>
              <button
                type="button"
                class="galeria__miniatura"
                aria-current={i === indice ? 'true' : undefined}
                onClick={() => irPara(i)}
              >
                <img src={foto.miniatura} alt="" width={96} height={120} loading="lazy" decoding="async" />
                <span class="sr-only">
                  Ver foto {i + 1} de {lista.length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogo}
        class="lightbox"
        aria-label={`Foto ampliada: ${atual.alt}`}
        onClose={() => setAberta(false)}
        onKeyDown={aoTeclarNoDialogo}
        onClick={(e) => e.target === dialogo.current && fechar()}
      >
        {aberta && (
          <>
            <img src={atual.grande} alt={atual.alt} class="lightbox__imagem" />
            <button type="button" class="lightbox__fechar" onClick={fechar} ref={botaoFechar}>
              <span aria-hidden="true">×</span>
              <span class="sr-only">Fechar foto ampliada</span>
            </button>
            {multiplas && (
              <>
                <button
                  type="button"
                  class="galeria__seta galeria__seta--anterior"
                  onClick={() => irPara(indice - 1)}
                >
                  <span aria-hidden="true">‹</span>
                  <span class="sr-only">Foto anterior</span>
                </button>
                <button
                  type="button"
                  class="galeria__seta galeria__seta--proxima"
                  onClick={() => irPara(indice + 1)}
                >
                  <span aria-hidden="true">›</span>
                  <span class="sr-only">Próxima foto</span>
                </button>
                <p class="galeria__contador">
                  {indice + 1} / {lista.length}
                </p>
              </>
            )}
          </>
        )}
      </dialog>
    </div>
  );
}
