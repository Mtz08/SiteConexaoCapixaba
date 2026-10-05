import { useEffect, useState } from 'preact/hooks';

/**
 * false no HTML do build e na primeira renderização do navegador; true logo depois.
 * Use em componentes que mostram dados salvos no aparelho (localStorage), para o HTML
 * do servidor e a hidratação coincidirem.
 */
export function useMontado(): boolean {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
}
