#!/usr/bin/env node
/**
 * Gera favicon, ícones do app (manifest), apple-touch-icon e a imagem Open Graph padrão em public/.
 *
 *   npm run icones
 *
 * Se existir src/assets/marca/logo.svg (ou logo.png), ele é usado no centro dos ícones e da imagem
 * de compartilhamento. Sem logo, gera versões tipográficas ("CC" e "CONEXÃO CAPIXABA").
 * Rode de novo sempre que trocar o logo, e faça commit dos arquivos de public/.
 */
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLICO = join(RAIZ, 'public');
const LOGO = ['logo.svg', 'logo.png']
  .map((n) => join(RAIZ, 'src', 'assets', 'marca', n))
  .find((c) => existsSync(c));

const COR = {
  asfalto: '#0d1117',
  asfalto2: '#161c25',
  texto: '#f2efe6',
  amarela: '#f5b700',
  verde: '#23803f',
};
// Fonte condensada do sistema, parecida com a de placa (a Archivo só existe em woff2, que o sharp não lê).
const FONTE = "Impact, 'Arial Narrow', 'Arial Black', sans-serif";

/** Ícone quadrado: placa escura com moldura amarela e "CC". `sangria` = margem segura (maskable). */
function svgIcone(tamanho, { sangria = 0, cantos = true } = {}) {
  const s = tamanho;
  const m = s * sangria;
  const raio = cantos ? s * 0.18 : 0;
  const moldura = s * 0.045;
  const interno = m + s * 0.09;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${raio}" fill="${COR.asfalto}"/>
  <rect x="${interno}" y="${interno}" width="${s - 2 * interno}" height="${s - 2 * interno}" rx="${raio * 0.6}"
        fill="none" stroke="${COR.amarela}" stroke-width="${moldura}"/>
  ${
    LOGO
      ? ''
      : `<text x="50%" y="${s * 0.62}" text-anchor="middle" font-family="${FONTE}" font-size="${s * 0.44}"
        fill="${COR.texto}" letter-spacing="${s * -0.005}">CC</text>
  <rect x="${s * 0.33}" y="${s * 0.7}" width="${s * 0.12}" height="${s * 0.035}" fill="${COR.amarela}"/>
  <rect x="${s * 0.55}" y="${s * 0.7}" width="${s * 0.12}" height="${s * 0.035}" fill="${COR.amarela}"/>`
  }
</svg>`;
}

function svgCompartilhamento() {
  const w = 1200;
  const h = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${COR.asfalto}"/><stop offset="0.6" stop-color="#121a26"/><stop offset="1" stop-color="${COR.asfalto}"/>
    </linearGradient>
    <radialGradient id="farol" cx="0.5" cy="1" r="0.8">
      <stop offset="0" stop-color="#f5e6b8" stop-opacity="0.22"/><stop offset="1" stop-color="#f5b700" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#ceu)"/>
  <g transform="translate(560 0)">
    <path d="M560 300 L640 300 L1200 630 L0 630 Z" fill="#1a212c"/>
    <path d="M560 300 L566 300 L40 630 L0 630 Z" fill="${COR.texto}" opacity="0.5"/>
    <path d="M634 300 L640 300 L1200 630 L1160 630 Z" fill="${COR.texto}" opacity="0.5"/>
    <path d="M597 330 L603 330 L606 360 L594 360 Z M592 390 L608 390 L613 440 L587 440 Z M582 480 L618 480 L628 570 L572 570 Z" fill="${COR.amarela}"/>
    <ellipse cx="600" cy="630" rx="640" ry="360" fill="url(#farol)"/>
  </g>
  <rect x="70" y="70" width="360" height="48" rx="8" fill="${COR.verde}" stroke="#ffffff" stroke-width="3"/>
  <text x="250" y="104" text-anchor="middle" font-family="${FONTE}" font-size="26" fill="#ffffff" letter-spacing="2">DIRETO DO ESPÍRITO SANTO</text>
  <text x="70" y="250" font-family="${FONTE}" font-size="120" fill="${COR.texto}">VIVENDO O</text>
  <text x="70" y="375" font-family="${FONTE}" font-size="132" fill="${COR.amarela}">EXTRAORDINÁRIO</text>
  ${LOGO ? '' : `<text x="70" y="470" font-family="${FONTE}" font-size="54" fill="${COR.texto}" letter-spacing="2">CONEXÃO CAPIXABA</text>`}
  <text x="70" y="540" font-family="Arial, sans-serif" font-weight="bold" font-size="30" fill="${COR.texto}" opacity="0.85">Para quem vive a estrada · Envio para todo o Brasil</text>
</svg>`;
}

async function comLogo(base, tamanhoLogo, posicao) {
  if (!LOGO) return base;
  const logo = await sharp(LOGO)
    .resize({ width: tamanhoLogo, height: tamanhoLogo, fit: 'inside' })
    .png()
    .toBuffer();
  return sharp(base)
    .composite([{ input: logo, ...posicao }])
    .png()
    .toBuffer();
}

async function gerarPng(svg, arquivo, tamanho, logo) {
  let buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  if (logo) buffer = await comLogo(buffer, logo.tamanho, logo.posicao ?? { gravity: 'centre' });
  await sharp(buffer)
    .resize(tamanho.w, tamanho.h)
    .png({ compressionLevel: 9 })
    .toFile(join(PUBLICO, arquivo));
  console.log(`  ✔ public/${arquivo} (${tamanho.w}×${tamanho.h})`);
}

async function main() {
  console.log(
    LOGO ? `Usando o logo: ${LOGO}` : 'Sem logo em src/assets/marca/: gerando versões tipográficas.',
  );

  await writeFile(join(PUBLICO, 'favicon.svg'), svgIcone(64));
  console.log('  ✔ public/favicon.svg');
  await gerarPng(svgIcone(512), 'favicon-32.png', { w: 32, h: 32 }, LOGO && { tamanho: 360 });
  await gerarPng(
    svgIcone(512, { cantos: false }),
    'apple-touch-icon.png',
    { w: 180, h: 180 },
    LOGO && { tamanho: 360 },
  );
  await gerarPng(svgIcone(512), 'icone-192.png', { w: 192, h: 192 }, LOGO && { tamanho: 360 });
  await gerarPng(svgIcone(512), 'icone-512.png', { w: 512, h: 512 }, LOGO && { tamanho: 360 });
  // Maskable: conteúdo dentro da zona segura central (80%).
  await gerarPng(
    svgIcone(512, { sangria: 0.1, cantos: false }),
    'icone-maskable-512.png',
    { w: 512, h: 512 },
    LOGO && { tamanho: 280 },
  );
  await gerarPng(
    svgCompartilhamento(),
    'og-padrao.png',
    { w: 1200, h: 630 },
    LOGO && { tamanho: 200, posicao: { top: 400, left: 70 } },
  );
}

main().catch((erro) => {
  console.error(`✖ ${erro.message}`);
  process.exit(1);
});
