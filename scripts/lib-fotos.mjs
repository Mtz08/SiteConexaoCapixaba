// Funções puras do processamento de fotos (testadas em lib-fotos.test.mjs).

export const EXTENSOES_ACEITAS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

/** "Camiseta Preta!" → "camiseta-preta" (mesma regra de src/lib/texto.ts). */
export function slugificar(texto) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Interpreta o nome do arquivo bruto.
 *   polo-conexao__1.jpg          → { id: 'polo-conexao', cor: null, numero: 1 }
 *   polo-conexao__preta__2.jpeg  → { id: 'polo-conexao', cor: 'preta', numero: 2 }
 * Devolve { erro } quando não segue a convenção.
 */
export function interpretarNome(nomeArquivo) {
  const ponto = nomeArquivo.lastIndexOf('.');
  const extensao = ponto >= 0 ? nomeArquivo.slice(ponto).toLowerCase() : '';
  if (!EXTENSOES_ACEITAS.includes(extensao)) {
    return { erro: `extensão "${extensao || '(nenhuma)'}" não aceita. Use ${EXTENSOES_ACEITAS.join(', ')}.` };
  }
  const base = nomeArquivo.slice(0, ponto).trim().toLowerCase();
  const partes = base.split('__');
  if (partes.length < 2 || partes.length > 3) {
    return { erro: 'nome fora da convenção. Use <id>__<numero> ou <id>__<cor>__<numero>.' };
  }
  const numeroTexto = partes.at(-1);
  if (!/^\d+$/.test(numeroTexto) || Number(numeroTexto) < 1) {
    return { erro: `"${numeroTexto}" não é um número de foto válido (1, 2, 3…).` };
  }
  const id = partes[0];
  const cor = partes.length === 3 ? slugificar(partes[1]) : null;
  if (!id) return { erro: 'falta o id do produto antes de "__".' };
  if (cor === '') return { erro: 'a cor está vazia.' };
  return { id, cor, numero: Number(numeroTexto), extensao };
}

/** Distância de edição (Levenshtein), para sugerir o produto mais parecido. */
function distancia(a, b) {
  const linha = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = linha[j];
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = temp;
    }
  }
  return linha[b.length];
}

/**
 * Sugere o produto mais parecido com um id desconhecido (por id, slug ou nome).
 * Só sugere — nunca decide sozinho. Devolve null se nada for razoavelmente parecido.
 */
export function sugerirProduto(idDesconhecido, produtos) {
  const alvo = slugificar(idDesconhecido);
  let melhor = null;
  for (const p of produtos) {
    for (const candidato of [p.id, p.slug, slugificar(p.nome ?? '')]) {
      if (!candidato) continue;
      const d = distancia(alvo, candidato);
      const contem = candidato.includes(alvo) || alvo.includes(candidato);
      const nota = contem ? Math.min(d, 1) : d;
      if (!melhor || nota < melhor.nota) melhor = { produto: p, nota, d };
    }
  }
  if (!melhor) return null;
  const limite = Math.max(3, Math.ceil(alvo.length * 0.4));
  return melhor.nota <= limite ? melhor.produto : null;
}

/** Nome do arquivo final: "1.webp" ou "preta-1.webp" (lido por src/lib/catalogo/fotos.ts). */
export function nomeFinal(cor, numero) {
  return `${cor ? `${cor}-` : ''}${numero}.webp`;
}

/**
 * Ordena a lista de fotos do produto: gerais primeiro (por número), depois por cor
 * na ordem das opções do produto, e por número dentro de cada cor.
 */
export function ordenarFotos(caminhos, coresDoProduto = []) {
  const ordemCor = new Map(coresDoProduto.map((c, i) => [slugificar(c), i]));
  const info = (caminho) => {
    const arquivo = caminho.split('/').at(-1) ?? '';
    const m = /^(?:(.+)-)?(\d+)\.[a-z0-9]+$/.exec(arquivo);
    const cor = m?.[1] ?? null;
    return { cor, numero: Number(m?.[2] ?? 0) };
  };
  return [...new Set(caminhos)].sort((a, b) => {
    const ia = info(a);
    const ib = info(b);
    const ca = ia.cor === null ? -1 : (ordemCor.get(ia.cor) ?? 999);
    const cb = ib.cor === null ? -1 : (ordemCor.get(ib.cor) ?? 999);
    return ca - cb || (ia.cor ?? '').localeCompare(ib.cor ?? '') || ia.numero - ib.numero;
  });
}

/** Acha o índice do colchete que fecha o que abre em `inicio`, respeitando strings. */
function fecharColchete(texto, inicio) {
  let profundidade = 0;
  let emString = false;
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i];
    if (emString) {
      if (c === '\\') i++;
      else if (c === '"') emString = false;
      continue;
    }
    if (c === '"') emString = true;
    else if (c === '[') profundidade++;
    else if (c === ']') {
      profundidade--;
      if (profundidade === 0) return i;
    }
  }
  return -1;
}

/**
 * Troca só o array "fotos" de um produto no texto do produtos.json, preservando todo o resto
 * (formatação, ordem dos campos, comentários em _notas). Lança erro se não encontrar.
 */
export function atualizarFotosNoTexto(texto, idProduto, fotos) {
  const marcaId = new RegExp(`"id"\\s*:\\s*"${idProduto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
  const posId = texto.search(marcaId);
  if (posId < 0) throw new Error(`Produto "${idProduto}" não encontrado no produtos.json.`);
  const proximoId = texto.slice(posId + 1).search(/"id"\s*:/);
  const fimProduto = proximoId < 0 ? texto.length : posId + 1 + proximoId;
  const trecho = texto.slice(posId, fimProduto);
  const posFotosRel = trecho.search(/"fotos"\s*:\s*\[/);
  const novoArray = `[${fotos.map((f) => JSON.stringify(f)).join(', ')}]`;

  if (posFotosRel < 0) {
    // Produto sem campo "fotos": insere logo depois do "id".
    const fimLinhaId = texto.indexOf(',', posId);
    return `${texto.slice(0, fimLinhaId + 1)} "fotos": ${novoArray},${texto.slice(fimLinhaId + 1)}`;
  }
  const abre = texto.indexOf('[', posId + posFotosRel);
  const fecha = fecharColchete(texto, abre);
  if (fecha < 0) throw new Error(`Não consegui ler o campo "fotos" de "${idProduto}".`);
  return texto.slice(0, abre) + novoArray + texto.slice(fecha + 1);
}
