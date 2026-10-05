import { useEffect, useRef, useState } from 'preact/hooks';
import type { TargetedMouseEvent } from 'preact';
import {
  ORDEM_PADRAO,
  ORDENACOES,
  filtrarEOrdenar,
  filtrosParaQuery,
  lerFiltrosDaUrl,
  type Filtros,
  type ItemFiltro,
  type Ordem,
} from '../../lib/catalogo/filtro';

interface CategoriaChip {
  id: string;
  nome: string;
  cor: string;
  quantidade: number;
}

interface Props {
  categorias: CategoriaChip[];
  /** Na página de uma categoria, ela fica fixa e os chips viram navegação. */
  categoriaFixa?: string;
  /** id do elemento <ul> com os cartões. */
  idGrade: string;
  total: number;
}

interface Grade {
  lista: HTMLElement;
  itens: ItemFiltro[];
  linhas: Map<string, HTMLElement>;
}

function lerGrade(idGrade: string): Grade | null {
  const lista = document.getElementById(idGrade);
  if (!lista) return null;
  const itens: ItemFiltro[] = [];
  const linhas = new Map<string, HTMLElement>();
  for (const cartao of lista.querySelectorAll<HTMLElement>('[data-produto]')) {
    const d = cartao.dataset;
    if (!d.produto) continue;
    itens.push({
      id: d.produto,
      categoria: d.categoria ?? '',
      busca: d.busca ?? '',
      preco: Number(d.preco ?? 0),
      posicao: Number(d.posicao ?? 0),
      nome: d.nome ?? '',
    });
    linhas.set(d.produto, cartao.closest('li') ?? cartao);
  }
  return { lista, itens, linhas };
}

function textoQuantidade(n: number): string {
  if (n === 0) return 'Nenhum produto';
  return n === 1 ? '1 produto' : `${n} produtos`;
}

export default function FiltroLoja({ categorias, categoriaFixa, idGrade, total }: Props) {
  const [filtros, setFiltros] = useState<Filtros>({
    categoria: categoriaFixa ?? null,
    busca: '',
    ordem: ORDEM_PADRAO,
  });
  const [hidratado, setHidratado] = useState(false);
  const [visiveis, setVisiveis] = useState(total);
  const grade = useRef<Grade | null>(null);

  // Primeira montagem: lê os cartões do HTML e os filtros da URL.
  useEffect(() => {
    grade.current = lerGrade(idGrade);
    const daUrl = lerFiltrosDaUrl(
      new URLSearchParams(window.location.search),
      categorias.map((c) => c.id),
    );
    setFiltros({ ...daUrl, categoria: categoriaFixa ?? daUrl.categoria });
    setHidratado(true);
  }, []);

  // A cada mudança: mostra/esconde, reordena de verdade (ordem do teclado = ordem visual) e atualiza a URL.
  useEffect(() => {
    if (!hidratado || !grade.current) return;
    const { lista, itens, linhas } = grade.current;
    const ordem = filtrarEOrdenar(itens, filtros);
    const visivel = new Set(ordem);

    for (const id of ordem) {
      const linha = linhas.get(id);
      if (linha) lista.appendChild(linha);
    }
    for (const [id, linha] of linhas) {
      linha.hidden = !visivel.has(id);
      if (!visivel.has(id)) lista.appendChild(linha);
    }
    setVisiveis(ordem.length);

    const query = filtrosParaQuery(filtros, !categoriaFixa);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query}`);
  }, [filtros, hidratado]);

  const atualizar = (parcial: Partial<Filtros>) => setFiltros((atual) => ({ ...atual, ...parcial }));

  const aoClicarChip = (categoria: string | null) => (evento: TargetedMouseEvent<HTMLAnchorElement>) => {
    // Na página de categoria, os chips navegam. Em /loja, filtram no lugar (sem recarregar).
    if (categoriaFixa || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.button !== 0) return;
    evento.preventDefault();
    atualizar({ categoria });
  };

  const limpar = () => atualizar({ categoria: categoriaFixa ?? null, busca: '', ordem: ORDEM_PADRAO });

  const chipAtual = (id: string | null) => {
    if (filtros.categoria !== id) return undefined;
    return categoriaFixa ? 'page' : 'true';
  };

  return (
    <div class="filtro" data-hidratado={hidratado ? '' : undefined}>
      <nav class="filtro__chips" aria-label="Categorias">
        <ul>
          <li>
            <a href="/loja" class="chip" aria-current={chipAtual(null)} onClick={aoClicarChip(null)}>
              Todos
              <span class="chip__quantidade">{total}</span>
            </a>
          </li>
          {categorias.map((c) => (
            <li key={c.id}>
              <a
                href={`/loja/${c.id}`}
                class="chip"
                data-cor={c.cor}
                aria-current={chipAtual(c.id)}
                onClick={aoClicarChip(c.id)}
              >
                <span class="chip__ponto" aria-hidden="true" />
                {c.nome}
                <span class="chip__quantidade">{c.quantidade}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div class="filtro__controles">
        <div class="filtro__busca">
          <label for="busca-loja" class="sr-only">
            Buscar produto
          </label>
          <svg class="filtro__lupa" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <input
            id="busca-loja"
            type="search"
            class="campo"
            placeholder="Buscar: camiseta, boné…"
            autocomplete="off"
            enterKeyHint="search"
            maxLength={80}
            value={filtros.busca}
            onInput={(e) => atualizar({ busca: e.currentTarget.value })}
          />
        </div>

        <div class="filtro__ordem">
          <label for="ordem-loja">Ordenar</label>
          <select
            id="ordem-loja"
            class="campo"
            value={filtros.ordem}
            onChange={(e) => atualizar({ ordem: e.currentTarget.value as Ordem })}
          >
            {ORDENACOES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </div>

        <p class="filtro__quantidade" aria-live="polite" aria-atomic="true">
          {textoQuantidade(visiveis)}
        </p>
      </div>

      {hidratado && visiveis === 0 && (
        <div class="filtro__vazio">
          <p class="filtro__vazio-titulo">Nada nessa pista.</p>
          <p>Não achamos produto com essa busca. Tente outra palavra ou veja tudo.</p>
          <button type="button" class="botao botao--contorno" onClick={limpar}>
            Limpar busca e filtros
          </button>
        </div>
      )}
    </div>
  );
}
