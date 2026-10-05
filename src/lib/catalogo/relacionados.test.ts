import { describe, expect, it } from 'vitest';
import { escolherRelacionados } from './relacionados';

const p = (id: string, categoria: string, destaque = false) => ({ id, categoria, destaque });
const polo = p('polo', 'polo', true);
const rei = p('rei', 'camisetas', true);
const adesivo = p('adesivo', 'adesivos');
const todos = [
  polo,
  rei,
  p('vida', 'camisetas'),
  p('moletom', 'moletons', true),
  adesivo,
  p('bone', 'bones', true),
];

describe('escolherRelacionados', () => {
  it('mesma categoria, depois destaques, depois o resto', () => {
    expect(escolherRelacionados(rei, todos).map((x) => x.id)).toEqual(['vida', 'polo', 'moletom', 'bone']);
  });

  it('nunca inclui o próprio produto e respeita o limite', () => {
    const r = escolherRelacionados(adesivo, todos, 3);
    expect(r.map((x) => x.id)).not.toContain('adesivo');
    expect(r).toHaveLength(3);
  });

  it('catálogo pequeno', () => {
    expect(escolherRelacionados(polo, [polo])).toEqual([]);
  });
});
