import { map } from 'nanostores';

/**
 * Seleção de opções do produto aberto na página (Tamanho, Cor…).
 * Compartilhada entre o painel (seletor) e a galeria (troca as fotos pela cor).
 */
export const $selecao = map<Record<string, string | undefined>>({});
