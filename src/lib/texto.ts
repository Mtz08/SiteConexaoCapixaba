/** Remove acentos e passa para minúsculas: "Boné Capixabá" → "bone capixaba". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** "Camiseta Rei da Estrada!" → "camiseta-rei-da-estrada". */
export function slugificar(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Texto onde a busca procura: nome, categoria, tags e descrição curta, normalizados. */
export function textoDeBusca(partes: (string | undefined)[]): string {
  return normalizar(partes.filter(Boolean).join(' ')).replace(/\s+/g, ' ');
}

/** Todas as palavras da consulta aparecem no texto? (ordem livre, sem acento) */
export function casaBusca(consulta: string, textoIndexado: string): boolean {
  const palavras = normalizar(consulta).split(/\s+/).filter(Boolean);
  return palavras.every((p) => textoIndexado.includes(p));
}
