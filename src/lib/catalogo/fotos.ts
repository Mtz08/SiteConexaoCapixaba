import type { ImageMetadata } from 'astro';
import { slugificar } from '../texto';
import type { Produto } from './schema';

/**
 * Fotos dos produtos, geradas por `npm run fotos` em src/assets/produtos/<id>/.
 * No JSON, `fotos` guarda caminhos relativos a src/assets/produtos/:
 *   "polo-conexao/1.webp"         → foto geral nº 1
 *   "polo-conexao/preta-1.webp"   → foto nº 1 da cor "Preta"
 * Caminho inexistente gera aviso no build e o site mostra o placeholder.
 */

const arquivos = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/produtos/**/*.{webp,avif,jpg,jpeg,png}',
  { eager: true },
);

const PREFIXO = '/src/assets/produtos/';
const REGEX_ARQUIVO = /^(?:(.+)-)?(\d+)\.[a-z0-9]+$/;

export interface FotoResolvida {
  imagem: ImageMetadata;
  /** Valor da opção "Cor" a que a foto pertence (undefined = foto geral). */
  cor: string | undefined;
  numero: number;
  alt: string;
}

const avisados = new Set<string>();
function avisar(mensagem: string): void {
  if (avisados.has(mensagem)) return;
  avisados.add(mensagem);
  console.warn(`[fotos] ${mensagem}`);
}

export function textoAlternativo(nome: string, cor: string | undefined, numero: number): string {
  return `${nome}${cor ? `, cor ${cor.toLowerCase()}` : ''} — foto ${numero}`;
}

export function fotosDoProduto(produto: Pick<Produto, 'id' | 'nome' | 'fotos' | 'opcoes'>): FotoResolvida[] {
  const cores = produto.opcoes.find((o) => o.nome === 'Cor')?.valores ?? [];
  const fotos: FotoResolvida[] = [];

  for (const caminho of produto.fotos) {
    const modulo = arquivos[`${PREFIXO}${caminho}`];
    if (!modulo) {
      avisar(
        `"${produto.id}": arquivo não encontrado em src/assets/produtos/${caminho}. Usando placeholder.`,
      );
      continue;
    }
    const nomeArquivo = caminho.split('/').at(-1) ?? '';
    const partes = REGEX_ARQUIVO.exec(nomeArquivo);
    const numero = Number(partes?.[2] ?? fotos.length + 1);
    const slugCor = partes?.[1];
    const cor = slugCor ? cores.find((c) => slugificar(c) === slugCor) : undefined;
    if (slugCor && !cor) {
      avisar(
        `"${produto.id}": a foto ${caminho} cita a cor "${slugCor}", que não existe nas opções. Tratada como foto geral.`,
      );
    }
    fotos.push({ imagem: modulo.default, cor, numero, alt: textoAlternativo(produto.nome, cor, numero) });
  }

  return fotos;
}

/** Foto principal: a nº 1 geral; se não houver, a primeira que existir. */
export function fotoPrincipal(fotos: FotoResolvida[]): FotoResolvida | undefined {
  return fotos.find((f) => !f.cor && f.numero === 1) ?? fotos.find((f) => !f.cor) ?? fotos[0];
}
