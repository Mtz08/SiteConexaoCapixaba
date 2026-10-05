import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Loader, LoaderContext } from 'astro/loaders';

/**
 * Loader dos JSON do catálogo.
 *
 * Substitui o `file()` do Astro porque ele apenas REGISTRA erros de leitura e segue o build
 * com a coleção vazia — o site iria ao ar sem produtos. Aqui, no build, qualquer erro
 * (arquivo ausente, JSON inválido, id repetido) derruba o build com a mensagem completa.
 * No `npm run dev`, um erro após editar o arquivo é mostrado e os dados anteriores ficam.
 */
export function catalogoLoader(arquivo: string, ler: (texto: string) => Record<string, unknown>[]): Loader {
  return {
    name: 'catalogo-loader',
    load: async (contexto: LoaderContext) => {
      const caminho = fileURLToPath(new URL(arquivo, contexto.config.root));
      const caminhoRelativo = relative(fileURLToPath(contexto.config.root), caminho).replaceAll('\\', '/');

      async function sincronizar(): Promise<void> {
        const texto = await readFile(caminho, 'utf8').catch(() => {
          throw new Error(`Arquivo não encontrado: ${arquivo}`);
        });
        const itens = ler(texto);

        // Valida tudo antes de mexer no store: ou entra o arquivo inteiro, ou nada.
        const entradas = [];
        for (const item of itens) {
          const id = String(item.id);
          const data = await contexto.parseData({ id, data: item, filePath: caminho });
          entradas.push({ id, data, filePath: caminhoRelativo, digest: contexto.generateDigest(item) });
        }

        contexto.store.clear();
        for (const entrada of entradas) contexto.store.set(entrada);
      }

      await sincronizar();

      contexto.watcher?.add(caminho);
      contexto.watcher?.on('change', async (alterado) => {
        if (alterado !== caminho) return;
        try {
          await sincronizar();
          contexto.logger.info(`${arquivo} recarregado.`);
        } catch (erro) {
          contexto.logger.error(erro instanceof Error ? erro.message : String(erro));
        }
      });
    },
  };
}
