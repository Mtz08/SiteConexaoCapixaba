import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarMotorSeguro } from './armazenamento';

function falsoLocalStorage(falhar: { ler?: boolean; gravar?: boolean } = {}) {
  const dados = new Map<string, string>();
  return {
    getItem: (k: string) => {
      if (falhar.ler) throw new Error('SecurityError');
      return dados.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (falhar.gravar) throw new Error('QuotaExceededError');
      dados.set(k, v);
    },
    removeItem: (k: string) => dados.delete(k),
    dados,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('criarMotorSeguro', () => {
  it('usa o localStorage quando funciona', () => {
    const ls = falsoLocalStorage();
    vi.stubGlobal('window', { localStorage: ls });
    const { motor, disponivel } = criarMotorSeguro();
    motor.chave = 'valor';
    expect(ls.dados.get('chave')).toBe('valor');
    expect('chave' in motor).toBe(true);
    expect(motor.chave).toBe('valor');
    delete motor.chave;
    expect('chave' in motor).toBe(false);
    expect(disponivel()).toBe(true);
  });

  it('localStorage bloqueado: funciona em memória e avisa, sem lançar erro', () => {
    vi.stubGlobal('window', { localStorage: falsoLocalStorage({ ler: true, gravar: true }) });
    const aviso = vi.fn();
    const { motor, disponivel } = criarMotorSeguro(aviso);
    expect(aviso).toHaveBeenCalledOnce();
    expect(() => {
      motor.chave = 'valor';
    }).not.toThrow();
    expect(motor.chave).toBe('valor');
    expect(disponivel()).toBe(false);
  });

  it('cota cheia no meio do uso: passa para memória e avisa uma vez', () => {
    const ls = falsoLocalStorage();
    vi.stubGlobal('window', { localStorage: ls });
    const aviso = vi.fn();
    const { motor } = criarMotorSeguro(aviso);
    const original = ls.setItem;
    ls.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    motor.a = '1';
    motor.b = '2';
    expect(aviso).toHaveBeenCalledOnce();
    expect(motor.b).toBe('2');
    ls.setItem = original;
  });

  it('no servidor (sem window) não quebra', () => {
    const { motor } = criarMotorSeguro();
    motor.x = 'y';
    expect(motor.x).toBe('y');
  });
});
