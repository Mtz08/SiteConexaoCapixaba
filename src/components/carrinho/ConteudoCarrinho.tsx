import { useStore } from '@nanostores/preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { TargetedMouseEvent } from 'preact';
import { PlaceholderPlaca } from '../produto/PlaceholderPlaca';
import {
  $armazenamentoIndisponivel,
  $avisosCarrinho,
  $carrinho,
  $catalogo,
  $cliente,
  apagarDadosDoAparelho,
  desfazerRemocaoDoCarrinho,
  limparCarrinho,
  mudarQuantidade,
  removerDoCarrinho,
  type ProdutoCatalogoCliente,
} from '../../stores/carrinho';
import { idLinha, subtotal, totalDeItens, totalDoCarrinho, type LinhaCarrinho } from '../../lib/carrinho';
import { formatarPreco } from '../../lib/dinheiro';
import { gerarCodigoPedido } from '../../lib/codigoPedido';
import { montarPedidoWhatsApp } from '../../lib/whatsapp';
import { site } from '../../config/site';
import { useMontado } from './useMontado';

interface Props {
  variante: 'gaveta' | 'pagina';
  /** Fecha a gaveta (links internos). */
  aoNavegar?: (() => void) | undefined;
}

const SEGUNDOS_DESFAZER = 5;

function opcoesDaLinha(
  linha: LinhaCarrinho,
  produto: ProdutoCatalogoCliente | undefined,
): [string, string][] {
  const ordem = produto?.opcoes.map((o) => o.nome) ?? Object.keys(linha.combinacao);
  return ordem
    .filter((nome) => linha.combinacao[nome] !== undefined)
    .map((nome) => [nome, linha.combinacao[nome] ?? '']);
}

function Miniatura({
  linha,
  produto,
}: {
  linha: LinhaCarrinho;
  produto: ProdutoCatalogoCliente | undefined;
}) {
  if (produto?.miniatura) {
    return (
      <img
        src={produto.miniatura}
        alt=""
        width={80}
        height={100}
        class="linha-carrinho__foto"
        loading="lazy"
      />
    );
  }
  if (produto) {
    return (
      <div class="linha-carrinho__foto" aria-hidden="true">
        <PlaceholderPlaca nome={linha.nome} categoria={produto.categoria} variante="mini" />
      </div>
    );
  }
  return <div class="linha-carrinho__foto linha-carrinho__foto--vazia" aria-hidden="true" />;
}

export default function ConteudoCarrinho({ variante, aoNavegar }: Props) {
  const carrinho = useStore($carrinho);
  const catalogo = useStore($catalogo);
  const cliente = useStore($cliente);
  const avisos = useStore($avisosCarrinho);
  const semArmazenamento = useStore($armazenamentoIndisponivel);

  const [desfazer, setDesfazer] = useState<{ linha: LinhaCarrinho; indice: number } | null>(null);
  const [perguntarLimpeza, setPerguntarLimpeza] = useState(false);
  const [statusDados, setStatusDados] = useState('');
  const [avisoLinha, setAvisoLinha] = useState<{ id: string; texto: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const montado = useMontado();

  useEffect(() => () => clearTimeout(timer.current), []);

  const porId = new Map((catalogo ?? []).map((p) => [p.id, p]));
  const itens = totalDeItens(carrinho);
  const total = totalDoCarrinho(carrinho);

  const aoRemover = (linha: LinhaCarrinho) => {
    const removida = removerDoCarrinho(idLinha(linha));
    if (!removida) return;
    setDesfazer(removida);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDesfazer(null), SEGUNDOS_DESFAZER * 1000);
  };

  const aoDesfazer = () => {
    if (desfazer) desfazerRemocaoDoCarrinho(desfazer.linha, desfazer.indice);
    clearTimeout(timer.current);
    setDesfazer(null);
  };

  const aoMudar = (linha: LinhaCarrinho, quantidade: number) => {
    const id = idLinha(linha);
    const r = mudarQuantidade(id, quantidade);
    setAvisoLinha(
      r.limitada
        ? { id, texto: `Máximo de ${site.quantidadeMaximaPorItem} por item. Para mais, fale com a gente.` }
        : null,
    );
  };

  const aoEnviar = (evento: TargetedMouseEvent<HTMLAnchorElement>) => {
    if (carrinho.linhas.length === 0) {
      evento.preventDefault();
      return;
    }
    const { link } = montarPedidoWhatsApp(
      carrinho.linhas.map((linha) => ({
        nome: linha.nome,
        opcoes: opcoesDaLinha(linha, porId.get(linha.produtoId)),
        quantidade: linha.quantidade,
        precoUnitario: linha.precoUnitario,
      })),
      { codigo: gerarCodigoPedido(), cliente },
    );
    evento.currentTarget.href = link;
    // Não limpa sozinho: o cliente pode ter desistido de enviar.
    setPerguntarLimpeza(true);
  };

  const aoApagarDados = () => {
    apagarDadosDoAparelho();
    setPerguntarLimpeza(false);
    setDesfazer(null);
    setStatusDados('Pronto: carrinho, nome e cidade foram apagados deste aparelho.');
  };

  const fechar = () => aoNavegar?.();

  // O carrinho vem do aparelho: o HTML do build não o conhece. Até montar, mostra um marcador
  // igual no servidor e no navegador (evita a hidratação reaproveitar elementos errados).
  if (!montado) return <div class={`carrinho carrinho--${variante} carrinho--carregando`} aria-busy="true" />;

  return (
    <div class={`carrinho carrinho--${variante}`}>
      {semArmazenamento && (
        <p class="carrinho__aviso" role="status">
          Seu navegador não está deixando salvar o carrinho. Ele funciona normalmente, mas some se você fechar
          esta aba.
        </p>
      )}

      {avisos.length > 0 && (
        <div class="carrinho__aviso" role="status">
          <ul>
            {avisos.map((a, i) => (
              <li key={i}>{a.mensagem}</li>
            ))}
          </ul>
          <button type="button" class="carrinho__link" onClick={() => $avisosCarrinho.set([])}>
            Entendi
          </button>
        </div>
      )}

      {desfazer && (
        <div class="carrinho__desfazer" role="status">
          <span>{desfazer.linha.nome} saiu do carrinho.</span>
          <button type="button" class="carrinho__link" onClick={aoDesfazer}>
            Desfazer
          </button>
        </div>
      )}

      {carrinho.linhas.length === 0 ? (
        <div class="carrinho__vazio">
          <svg
            viewBox="0 0 24 24"
            width="64"
            height="64"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            aria-hidden="true"
          >
            <path d="M2 6.5h11.5v9.5H2zM13.5 9.5h4.2l3.3 3.6V16h-7.5" stroke-linejoin="round" />
            <circle cx="6" cy="17.5" r="1.9" />
            <circle cx="17" cy="17.5" r="1.9" />
          </svg>
          <p class="carrinho__vazio-titulo">Seu caminhão está vazio.</p>
          <p>Bora carregar? Escolha seus produtos na loja.</p>
          <a href="/loja" class="botao botao--primario" onClick={fechar}>
            Ir para a loja
          </a>
          {statusDados && (
            <p class="carrinho__status" role="status">
              {statusDados}
            </p>
          )}
        </div>
      ) : (
        <>
          <ul class="carrinho__linhas" aria-label="Itens do carrinho">
            {carrinho.linhas.map((linha) => {
              const produto = porId.get(linha.produtoId);
              const id = idLinha(linha);
              const opcoes = opcoesDaLinha(linha, produto);
              const idQtd = `qtd-${variante}-${id.replace(/[^a-z0-9]+/gi, '-')}`;
              return (
                <li key={id} class="linha-carrinho">
                  <Miniatura linha={linha} produto={produto} />
                  <div class="linha-carrinho__info">
                    <a href={`/produto/${linha.slug}`} class="linha-carrinho__nome" onClick={fechar}>
                      {linha.nome}
                    </a>
                    {opcoes.length > 0 && (
                      <p class="linha-carrinho__opcoes">{opcoes.map(([n, v]) => `${n}: ${v}`).join(' · ')}</p>
                    )}
                    <p class="linha-carrinho__unitario">{formatarPreco(linha.precoUnitario)} cada</p>
                    <div class="linha-carrinho__acoes">
                      <div class="quantidade__controle quantidade__controle--compacto">
                        <button
                          type="button"
                          class="quantidade__botao"
                          disabled={linha.quantidade <= 1}
                          onClick={() => aoMudar(linha, linha.quantidade - 1)}
                          aria-label={`Diminuir quantidade de ${linha.nome}`}
                        >
                          −
                        </button>
                        <label for={idQtd} class="sr-only">
                          Quantidade de {linha.nome}
                        </label>
                        <input
                          id={idQtd}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={site.quantidadeMaximaPorItem}
                          class="quantidade__campo"
                          value={linha.quantidade}
                          onChange={(e) => aoMudar(linha, Number(e.currentTarget.value))}
                        />
                        <button
                          type="button"
                          class="quantidade__botao"
                          disabled={linha.quantidade >= site.quantidadeMaximaPorItem}
                          onClick={() => aoMudar(linha, linha.quantidade + 1)}
                          aria-label={`Aumentar quantidade de ${linha.nome}`}
                        >
                          +
                        </button>
                      </div>
                      <button type="button" class="carrinho__link" onClick={() => aoRemover(linha)}>
                        Remover<span class="sr-only"> {linha.nome}</span>
                      </button>
                    </div>
                    {avisoLinha?.id === id && (
                      <p class="quantidade__aviso" role="status">
                        {avisoLinha.texto}
                      </p>
                    )}
                  </div>
                  <p class="linha-carrinho__subtotal">
                    <span class="sr-only">Subtotal: </span>
                    {formatarPreco(subtotal(linha))}
                  </p>
                </li>
              );
            })}
          </ul>

          <div class="carrinho__total">
            <p>
              Total dos produtos{' '}
              <span class="carrinho__qtd">({itens === 1 ? '1 item' : `${itens} itens`})</span>
            </p>
            <p class="carrinho__valor">{formatarPreco(total)}</p>
          </div>
          <p class="carrinho__frete">Frete, pagamento e envio você combina com a gente no WhatsApp.</p>

          <fieldset class="carrinho__cliente">
            <legend class="seletor__legenda">Para agilizar o atendimento (opcional)</legend>
            <div class="carrinho__campos">
              <div>
                <label for={`nome-${variante}`} class="carrinho__rotulo">
                  Seu nome
                </label>
                <input
                  id={`nome-${variante}`}
                  class="campo"
                  autocomplete="given-name"
                  maxLength={80}
                  value={cliente.nome ?? ''}
                  onInput={(e) => $cliente.set({ ...cliente, nome: e.currentTarget.value })}
                />
              </div>
              <div>
                <label for={`cidade-${variante}`} class="carrinho__rotulo">
                  Cidade/UF
                </label>
                <input
                  id={`cidade-${variante}`}
                  class="campo"
                  autocomplete="address-level2"
                  placeholder="Ex.: Vitória/ES"
                  maxLength={80}
                  value={cliente.cidade ?? ''}
                  onInput={(e) => $cliente.set({ ...cliente, cidade: e.currentTarget.value })}
                />
              </div>
            </div>
            <p class="carrinho__privacidade">
              Não guardamos esses dados em nenhum servidor: eles ficam só neste aparelho e vão na mensagem que
              você mesmo envia. <a href="/privacidade">Privacidade</a>
            </p>
          </fieldset>

          <a
            href={`https://wa.me/${site.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            class="botao botao--whatsapp botao--bloco botao--grande"
            data-esconde-flutuante
            onClick={aoEnviar}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" stroke-linejoin="round" />
            </svg>
            Enviar pedido pelo WhatsApp
            <span class="sr-only"> (abre em nova aba)</span>
          </a>

          {perguntarLimpeza && (
            <div class="carrinho__pergunta" role="status">
              <p>Pedido enviado?</p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="botao botao--contorno"
                  onClick={() => {
                    limparCarrinho();
                    setPerguntarLimpeza(false);
                  }}
                >
                  Sim, limpar carrinho
                </button>
                <button type="button" class="carrinho__link" onClick={() => setPerguntarLimpeza(false)}>
                  Ainda não
                </button>
              </div>
            </div>
          )}

          <button type="button" class="carrinho__link carrinho__apagar" onClick={aoApagarDados}>
            Apagar meus dados deste aparelho
          </button>
        </>
      )}
    </div>
  );
}
