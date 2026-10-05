/**
 * Motor de armazenamento à prova de falhas para o @nanostores/persistent.
 *
 * O persistent grava direto no localStorage (`storage[chave] = valor`). Em aba anônima,
 * Safari com bloqueio de dados ou cota cheia, isso lança exceção. Aqui toda leitura e
 * escrita passa por try/catch; se o localStorage falhar, os dados ficam só em memória
 * (o carrinho funciona, mas não é salvo) e `aoFicarIndisponivel` é avisado.
 */

export interface MotorArmazenamento {
  /** Compatível com o PersistentStore do @nanostores/persistent. */
  motor: Record<string, string>;
  disponivel: () => boolean;
}

function localStorageFunciona(): boolean {
  try {
    const teste = '__cc_teste__';
    window.localStorage.setItem(teste, '1');
    window.localStorage.removeItem(teste);
    return true;
  } catch {
    return false;
  }
}

export function criarMotorSeguro(aoFicarIndisponivel: () => void = () => {}): MotorArmazenamento {
  const memoria = new Map<string, string>();
  let disponivel = typeof window !== 'undefined' && localStorageFunciona();

  const falhou = () => {
    if (!disponivel) return;
    disponivel = false;
    aoFicarIndisponivel();
  };

  const ler = (chave: string): string | undefined => {
    if (disponivel) {
      try {
        const valor = window.localStorage.getItem(chave);
        if (valor !== null) return valor;
      } catch {
        falhou();
      }
    }
    return memoria.get(chave);
  };

  const motor = new Proxy({} as Record<string, string>, {
    get: (_alvo, chave) => (typeof chave === 'string' ? ler(chave) : undefined),
    has: (_alvo, chave) => typeof chave === 'string' && ler(chave) !== undefined,
    set: (_alvo, chave, valor) => {
      if (typeof chave !== 'string') return true;
      const texto = String(valor);
      memoria.set(chave, texto);
      if (disponivel) {
        try {
          window.localStorage.setItem(chave, texto);
        } catch {
          falhou();
        }
      }
      return true;
    },
    deleteProperty: (_alvo, chave) => {
      if (typeof chave !== 'string') return true;
      memoria.delete(chave);
      if (disponivel) {
        try {
          window.localStorage.removeItem(chave);
        } catch {
          falhou();
        }
      }
      return true;
    },
  });

  if (typeof window !== 'undefined' && !disponivel) aoFicarIndisponivel();
  return { motor, disponivel: () => disponivel };
}
