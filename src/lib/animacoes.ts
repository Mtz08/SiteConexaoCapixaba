/**
 * Microinteração: um "+1" sai do botão e voa até o ícone do carrinho.
 * Não faz nada com prefers-reduced-motion, sem Web Animations API ou sem o ícone na tela.
 */
export function voarParaCarrinho(origem: Element | null): void {
  if (!origem || typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const destino = document.querySelector('[data-abrir-carrinho]');
  if (!destino || typeof Element.prototype.animate !== 'function') return;

  const de = origem.getBoundingClientRect();
  const para = destino.getBoundingClientRect();
  const tamanho = 44;
  const x0 = de.left + de.width / 2 - tamanho / 2;
  const y0 = de.top + de.height / 2 - tamanho / 2;
  const dx = para.left + para.width / 2 - tamanho / 2 - x0;
  const dy = para.top + para.height / 2 - tamanho / 2 - y0;

  const bolha = document.createElement('div');
  bolha.className = 'voo-carrinho';
  bolha.setAttribute('aria-hidden', 'true');
  bolha.textContent = '+1';
  // Posição via CSSOM (permitido pela CSP, ao contrário de style="" no HTML).
  bolha.style.setProperty('left', `${x0}px`);
  bolha.style.setProperty('top', `${y0}px`);
  document.body.append(bolha);

  const animacao = bolha.animate(
    [
      { transform: 'translate(0, 0) scale(0.6)', opacity: 0 },
      { transform: 'translate(0, -12px) scale(1.1)', opacity: 1, offset: 0.15 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) scale(0.9)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.4 },
    ],
    { duration: 750, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
  );
  const remover = () => bolha.remove();
  animacao.addEventListener('finish', remover);
  animacao.addEventListener('cancel', remover);
}
