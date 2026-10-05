#!/usr/bin/env node
/**
 * Processa as fotos de fotos-brutas/ para o site.
 *
 *   npm run fotos              → processa
 *   npm run fotos -- --verificar → só mostra o que faria (não altera nada)
 *
 * Para cada foto com nome na convenção (<id>__<n>.jpg ou <id>__<cor>__<n>.jpg):
 *  - confere se o produto (e a cor) existem em src/data/produtos.json;
 *  - corrige a rotação (EXIF), REMOVE todos os metadados (inclusive GPS), recorta em 4:5
 *    sem distorcer, limita a 1600 px de altura e salva em WebP (qualidade 82) em
 *    src/assets/produtos/<id>/;
 *  - atualiza o campo "fotos" do produto, preservando o resto do arquivo;
 *  - move o original para fotos-brutas/_processadas/ (nunca apaga).
 * Rodar duas vezes não duplica nada.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  atualizarFotosNoTexto,
  interpretarNome,
  nomeFinal,
  ordenarFotos,
  slugificar,
  sugerirProduto,
} from './lib-fotos.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_BRUTAS = join(RAIZ, 'fotos-brutas');
const PASTA_PROCESSADAS = join(PASTA_BRUTAS, '_processadas');
const PASTA_SAIDA = join(RAIZ, 'src', 'assets', 'produtos');
const ARQUIVO_PRODUTOS = join(RAIZ, 'src', 'data', 'produtos.json');

const LARGURA_MAX = 1280; // 1280 × 1600 (4:5)
const QUALIDADE = 82;
const SOMENTE_VERIFICAR = process.argv.includes('--verificar');

const relativo = (caminho) => relative(RAIZ, caminho).replaceAll('\\', '/');

function coresDo(produto) {
  return produto.opcoes?.find((o) => o.nome === 'Cor')?.valores ?? [];
}

/** Dimensões já considerando a orientação EXIF (fotos de celular "deitadas"). */
function dimensoesOrientadas(meta) {
  if (meta.autoOrient) return meta.autoOrient;
  const girada = (meta.orientation ?? 1) >= 5;
  return girada ? { width: meta.height, height: meta.width } : { width: meta.width, height: meta.height };
}

async function processarArquivo(entrada, destino) {
  const meta = await sharp(entrada).metadata();
  const { width, height } = dimensoesOrientadas(meta);
  const largura = Math.min(LARGURA_MAX, Math.floor(Math.min(width, height * 0.8)));
  const altura = Math.round(largura * 1.25);
  await mkdir(dirname(destino), { recursive: true });
  // Sem .withMetadata(): o sharp descarta EXIF, GPS, XMP e IPTC.
  await sharp(entrada)
    .rotate()
    .resize({ width: largura, height: altura, fit: 'cover', position: 'attention' })
    .toColourspace('srgb')
    .webp({ quality: QUALIDADE, effort: 5 })
    .toFile(destino);
  const saida = await sharp(destino).metadata();
  if (saida.exif || saida.xmp || saida.iptc) throw new Error('metadados não foram removidos');
  return { largura, altura };
}

async function main() {
  if (!existsSync(PASTA_BRUTAS)) {
    console.log('Pasta fotos-brutas/ não encontrada. Crie a pasta e coloque as fotos nela.');
    return;
  }

  const textoOriginal = await readFile(ARQUIVO_PRODUTOS, 'utf8');
  const produtos = JSON.parse(textoOriginal);
  const porId = new Map(produtos.map((p) => [p.id, p]));

  const nomes = (await readdir(PASTA_BRUTAS, { withFileTypes: true }))
    .filter((e) => e.isFile() && !e.name.startsWith('.') && e.name !== 'LEIA-ME.md')
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));

  const processadas = [];
  const ignoradas = [];
  const novasPorProduto = new Map();
  const destinosUsados = new Set();

  for (const nome of nomes) {
    const entrada = join(PASTA_BRUTAS, nome);
    const info = interpretarNome(nome);
    if (info.erro) {
      ignoradas.push({ nome, motivo: info.erro });
      continue;
    }

    const produto = porId.get(info.id);
    if (!produto) {
      const sugestao = sugerirProduto(info.id, produtos);
      ignoradas.push({
        nome,
        motivo:
          `o produto "${info.id}" não existe.` +
          (sugestao
            ? ` Você quis dizer "${sugestao.id}" (${sugestao.nome})? Renomeie para ${sugestao.id}__${info.cor ? `${info.cor}__` : ''}${info.numero}${info.extensao}`
            : ' Confira o "id" no produtos.json.'),
      });
      continue;
    }

    let cor = null;
    if (info.cor) {
      const cores = coresDo(produto);
      cor = cores.map(slugificar).find((c) => c === info.cor) ?? null;
      if (!cor) {
        ignoradas.push({
          nome,
          motivo: cores.length
            ? `a cor "${info.cor}" não existe em "${produto.id}". Cores: ${cores.join(', ')}.`
            : `"${produto.id}" não tem a opção "Cor". Use ${produto.id}__${info.numero}${info.extensao}.`,
        });
        continue;
      }
    }

    const arquivoFinal = nomeFinal(cor, info.numero);
    const caminhoJson = `${produto.id}/${arquivoFinal}`;
    if (destinosUsados.has(caminhoJson)) {
      ignoradas.push({ nome, motivo: `outra foto desta rodada já gerou ${caminhoJson}. Use outro número.` });
      continue;
    }

    if (info.extensao === '.heic') {
      try {
        await sharp(entrada).metadata();
      } catch {
        ignoradas.push({
          nome,
          motivo:
            'HEIC (foto de iPhone) não é suportado neste computador. Converta para JPG, ou no iPhone use ' +
            'Ajustes > Câmera > Formatos > "Mais Compatível" e tire/exporte de novo.',
        });
        continue;
      }
    }

    destinosUsados.add(caminhoJson);
    const destino = join(PASTA_SAIDA, produto.id, arquivoFinal);

    if (SOMENTE_VERIFICAR) {
      processadas.push({ nome, destino: relativo(destino), dimensoes: '(verificação)' });
    } else {
      try {
        const { largura, altura } = await processarArquivo(entrada, destino);
        processadas.push({ nome, destino: relativo(destino), dimensoes: `${largura}×${altura}` });
      } catch (erro) {
        destinosUsados.delete(caminhoJson);
        ignoradas.push({ nome, motivo: `não foi possível ler a imagem (${erro.message}).` });
        continue;
      }
    }
    const lista = novasPorProduto.get(produto.id) ?? [];
    lista.push(caminhoJson);
    novasPorProduto.set(produto.id, lista);
  }

  // Atualiza o produtos.json (só os arrays "fotos" tocados).
  let texto = textoOriginal;
  for (const [id, novas] of novasPorProduto) {
    const produto = porId.get(id);
    const existentes = (produto.fotos ?? []).filter(
      (f) => SOMENTE_VERIFICAR || existsSync(join(PASTA_SAIDA, f)),
    );
    const fotos = ordenarFotos([...existentes, ...novas], coresDo(produto));
    texto = atualizarFotosNoTexto(texto, id, fotos);
    produto.fotos = fotos;
  }
  JSON.parse(texto); // garante que o arquivo continua válido

  if (!SOMENTE_VERIFICAR) {
    if (texto !== textoOriginal) await writeFile(ARQUIVO_PRODUTOS, texto, 'utf8');
    if (processadas.length > 0) await mkdir(PASTA_PROCESSADAS, { recursive: true });
    for (const p of processadas) {
      let alvo = join(PASTA_PROCESSADAS, p.nome);
      if (existsSync(alvo) && (await stat(alvo)).isFile()) {
        const ponto = p.nome.lastIndexOf('.');
        alvo = join(PASTA_PROCESSADAS, `${p.nome.slice(0, ponto)}.${Date.now()}${p.nome.slice(ponto)}`);
      }
      await rename(join(PASTA_BRUTAS, p.nome), alvo);
    }
  }

  // Relatório
  const titulo = SOMENTE_VERIFICAR ? 'VERIFICAÇÃO (nada foi alterado)' : 'RELATÓRIO DE FOTOS';
  console.log(`\n=== ${titulo} ===\n`);
  console.log(`Processadas: ${processadas.length}`);
  for (const p of processadas) console.log(`  ✔ ${p.nome} → ${p.destino} ${p.dimensoes}`);
  console.log(`\nIgnoradas: ${ignoradas.length}`);
  for (const i of ignoradas) console.log(`  ✘ ${i.nome}: ${i.motivo}`);
  const semFoto = produtos.filter((p) => p.ativo && (p.fotos ?? []).length === 0);
  console.log(`\nProdutos ativos ainda sem foto: ${semFoto.length}`);
  for (const p of semFoto) console.log(`  • ${p.id} (${p.nome})`);
  if (!SOMENTE_VERIFICAR && processadas.length > 0) {
    console.log('\nMetadados (EXIF/GPS) removidos de todas as fotos geradas.');
    console.log('Originais movidos para fotos-brutas/_processadas/. Rode "npm run build" para conferir.');
  }
  console.log('');
}

main().catch((erro) => {
  console.error(`\n✖ Erro ao processar fotos: ${erro.message}\n`);
  process.exit(1);
});
