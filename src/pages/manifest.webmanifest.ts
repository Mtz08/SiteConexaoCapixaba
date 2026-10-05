import type { APIRoute } from 'astro';
import { site } from '../config/site';

/** PWA leve: só o manifest (sem service worker, para nunca mostrar preço velho em cache). */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: site.nome,
      short_name: 'Conexão',
      description: site.descricao,
      lang: 'pt-BR',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0d1117',
      theme_color: '#0d1117',
      icons: [
        { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } },
  );
