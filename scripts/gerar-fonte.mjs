#!/usr/bin/env node
/**
 * Gera um subconjunto leve da Archivo variável para o site.
 *
 *   npm run fonte
 *
 * Origem: @fontsource-variable/archivo (latin, eixos wdth + wght).
 * - Mantém só os caracteres do português (ASCII, Latin-1 e pontuação tipográfica).
 * - Restringe os eixos ao que o site usa: largura 62–100% e peso 400–900.
 * Resultado: ~54 KB em vez de ~88 KB — o título (LCP) aparece antes em 4G fraco.
 * Rode de novo só se mudar a faixa de pesos/larguras usada no CSS.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ORIGEM = require.resolve('@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2');
const DESTINO = join(RAIZ, 'src', 'assets', 'fontes', 'archivo-subset.woff2');

const EIXOS = { wdth: { min: 62, max: 100 }, wght: { min: 400, max: 900 } };

function caracteres() {
  let texto = '';
  const faixa = (de, ate) => {
    for (let c = de; c <= ate; c++) texto += String.fromCodePoint(c);
  };
  faixa(0x20, 0x7e); // ASCII
  faixa(0xa0, 0xff); // Latin-1 (á, ã, ç, é, õ, º, ª…)
  // – — ‘ ’ “ ” • … € → ↗ − ×
  for (const c of [
    0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2026, 0x20ac, 0x2192, 0x2197, 0x2212, 0xd7,
  ]) {
    texto += String.fromCodePoint(c);
  }
  return texto;
}

const original = await readFile(ORIGEM);
const subconjunto = await subsetFont(original, caracteres(), { targetFormat: 'woff2', variationAxes: EIXOS });
await writeFile(DESTINO, subconjunto);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(
  `✔ ${DESTINO.replace(RAIZ, '.').replaceAll('\\', '/')}: ${kb(original.length)} → ${kb(subconjunto.length)}`,
);
