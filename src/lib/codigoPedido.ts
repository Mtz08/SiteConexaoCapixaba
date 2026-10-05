/**
 * Código curto do pedido, gerado no clique, para a loja referenciar no WhatsApp.
 * Sem caracteres ambíguos: nada de 0/O, 1/I/L, 5/S, 2/Z, 8/B.
 */
export const ALFABETO_CODIGO = '34679ACDEFGHJKMNPQRTUVWXY';
export const TAMANHO_CODIGO = 5;

/** `aleatorio` devolve inteiros em [0, 2^32). Injetável para teste. */
export function gerarCodigoPedido(
  aleatorio: (quantidade: number) => Uint32Array = (q) => crypto.getRandomValues(new Uint32Array(q)),
): string {
  const valores = aleatorio(TAMANHO_CODIGO);
  let codigo = '';
  for (const valor of valores) codigo += ALFABETO_CODIGO[valor % ALFABETO_CODIGO.length];
  return `CC-${codigo}`;
}
