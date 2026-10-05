export interface LinkNavegacao {
  href: string;
  rotulo: string;
}

/** Menu principal (cabeçalho). */
export const navegacaoPrincipal: LinkNavegacao[] = [
  { href: '/loja', rotulo: 'Loja' },
  { href: '/como-comprar', rotulo: 'Como comprar' },
  { href: '/sobre', rotulo: 'Sobre' },
  { href: '/contato', rotulo: 'Contato' },
];

/** Links de ajuda (rodapé). */
export const navegacaoAjuda: LinkNavegacao[] = [
  { href: '/como-comprar', rotulo: 'Como comprar' },
  { href: '/guia-de-medidas', rotulo: 'Guia de medidas' },
  { href: '/perguntas-frequentes', rotulo: 'Perguntas frequentes' },
  { href: '/trocas', rotulo: 'Trocas e devoluções' },
  { href: '/privacidade', rotulo: 'Política de privacidade' },
];

/** Links institucionais (rodapé). */
export const navegacaoInstitucional: LinkNavegacao[] = [
  { href: '/', rotulo: 'Início' },
  { href: '/loja', rotulo: 'Loja' },
  { href: '/sobre', rotulo: 'Sobre' },
  { href: '/contato', rotulo: 'Contato' },
  { href: '/carrinho', rotulo: 'Carrinho' },
];

/** Compara caminhos ignorando barra final e .html. */
export function ehPaginaAtual(href: string, caminhoAtual: string, prefixo = false): boolean {
  const normalizar = (c: string) => c.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  const atual = normalizar(caminhoAtual);
  const alvo = normalizar(href);
  if (alvo === '/') return atual === '/';
  return prefixo ? atual === alvo || atual.startsWith(`${alvo}/`) : atual === alvo;
}
