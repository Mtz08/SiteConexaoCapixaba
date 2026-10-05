/**
 * "Você também pode gostar": primeiro da mesma categoria, depois destaques, depois o resto.
 * Mantém a ordem do catálogo dentro de cada grupo e nunca inclui o próprio produto.
 */
export function escolherRelacionados<T extends { id: string; categoria: string; destaque: boolean }>(
  atual: T,
  todos: T[],
  limite = 4,
): T[] {
  const outros = todos.filter((p) => p.id !== atual.id);
  const grupo = (p: T) => (p.categoria === atual.categoria ? 0 : p.destaque ? 1 : 2);
  return outros
    .map((p, i) => ({ p, i }))
    .sort((a, b) => grupo(a.p) - grupo(b.p) || a.i - b.i)
    .slice(0, limite)
    .map(({ p }) => p);
}
