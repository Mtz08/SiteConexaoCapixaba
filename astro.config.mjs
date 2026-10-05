// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { site } from './src/config/site.ts';
import { verificarWhatsapp } from './src/integrations/verificar-whatsapp.ts';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const permitirNumeroFicticio =
  (process.env.PERMITIR_NUMERO_FICTICIO ?? env.PERMITIR_NUMERO_FICTICIO) === 'true';

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [
    verificarWhatsapp(permitirNumeroFicticio),
    preact(),
    sitemap({
      // Fora do sitemap: 404 e carrinho (noindex).
      filter: (pagina) => !/\/(404|carrinho)\/?$/.test(pagina),
    }),
  ],
  security: {
    // Gera <meta> CSP com hash de cada script/estilo inline.
    // Os demais cabeçalhos de segurança ficam em netlify.toml.
    csp: true,
  },
  markdown: {
    syntaxHighlight: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
