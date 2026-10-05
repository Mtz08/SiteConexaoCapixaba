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

/**
 * Caminho limpo e canônico: sem .html, sem barra final, e /index vira /.
 * (Com build.format 'file', a página inicial é servida como /index.html.)
 */
export function caminhoLimpo(caminho: string): string {
  const semHtml = caminho.replace(/\.html$/, '').replace(/(^|\/)index$/, '$1');
  return semHtml.replace(/\/+$/, '') || '/';
}

/** Compara caminhos ignorando barra final, .html e /index. */
export function ehPaginaAtual(href: string, caminhoAtual: string, prefixo = false): boolean {
  const atual = caminhoLimpo(caminhoAtual);
  const alvo = caminhoLimpo(href);
  if (alvo === '/') return atual === '/';
  return prefixo ? atual === alvo || atual.startsWith(`${alvo}/`) : atual === alvo;
}
