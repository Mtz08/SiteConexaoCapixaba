import type { ICONES_CATEGORIA } from '../../lib/catalogo/schema';

export type IconeCategoriaNome = (typeof ICONES_CATEGORIA)[number];

interface Props {
  icone: IconeCategoriaNome;
  class?: string | undefined;
}

/** Desenhos próprios, traço único, grade 64×64. Sempre decorativos. */
export function IconeCategoria({ icone, class: classe }: Props) {
  return (
    <svg
      class={classe}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      stroke-width="2.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icone === 'camiseta' && (
        <>
          <path d="M23 10 12 16 6 29l8 4 4-7v28h28V26l4 7 8-4-6-13-11-6c-1.5 4-5 6.5-9 6.5S24.5 14 23 10Z" />
          <path d="M23 10c1.5 4 5 6.5 9 6.5s7.5-2.5 9-6.5" />
        </>
      )}
      {icone === 'polo' && (
        <>
          <path d="M23 10 12 16 6 29l8 4 4-7v28h28V26l4 7 8-4-6-13-11-6" />
          <path d="m23 10 5 9 4-4 4 4 5-9" />
          <path d="M32 15v13" />
          <circle cx="32" cy="20" r="0.8" fill="currentColor" />
          <circle cx="32" cy="25" r="0.8" fill="currentColor" />
        </>
      )}
      {icone === 'moletom' && (
        <>
          <path d="M21 15 11 21 6 50l7 1.5 5-21V56h28V30.5l5 21 7-1.5-5-29-10-6" />
          <path d="M21 15c0-7 5-10 11-10s11 3 11 10c-3 4.5-7 6-11 6s-8-1.5-11-6Z" />
          <path d="M29 21v7M35 21v7" />
          <path d="M24 42h16l2 9H22Z" />
        </>
      )}
      {icone === 'bone' && (
        <>
          <path d="M9 41c0-15 10-24 23-24s22 9 22 24Z" />
          <path d="M54 41c4 0 7 1.5 7 3.5H27" />
          <path d="M32 17c-5 6-7 14-7 24M32 17c4 6 6 14 6 24" />
          <circle cx="32" cy="15.5" r="1.6" />
        </>
      )}
      {icone === 'adesivo' && (
        <>
          <path d="M12 10h40v30L40 52H12Z" />
          <path d="M52 40h-9a3 3 0 0 0-3 3v9" />
          <path d="m31 19 3.2 6.6 7.2 1-5.2 5.1 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2-5.2-5.1 7.2-1Z" />
        </>
      )}
    </svg>
  );
}
