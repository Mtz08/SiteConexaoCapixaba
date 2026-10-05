import type { APIRoute } from 'astro';
import { site } from '../config/site';

export const GET: APIRoute = () => {
  const sitemap = new URL('/sitemap-index.xml', site.url).href;
  return new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /carrinho', '', `Sitemap: ${sitemap}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
