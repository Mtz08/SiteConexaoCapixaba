import { useStore } from '@nanostores/preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { TargetedMouseEvent } from 'preact';
import { Preco } from '../produto/Preco';
import { $selecao } from '../../stores/produto';
import { gerarCodigoPedido } from '../../lib/codigoPedido';
import { montarPedidoWhatsApp } from '../../lib/whatsapp';
import { escolherValor, limitarQuantidade, rotuloCompra } from '../../lib/catalogo/selecao';
import {
  combinacaoCompleta,
  faixaDePreco,
  opcoesFaltando,
  resolverCombinacao,
  valorDisponivel,
  type DadosVariacao,
} from '../../lib/catalogo/variacoes';
import { slugificar } from '../../lib/texto';
import type { Centavos } from '../../lib/dinheiro';
import { $totalItens, abrirGaveta, adicionarAoCarrinho } from '../../stores/carrinho';
import { voarParaCarrinho } from '../../lib/animacoes';

export interface ProdutoPainel extends DadosVariacao {
  id: string;
  slug: string;
  nome: string;
  precoDe?: Centavos | undefined;
}

function textoItens(n: number): string {
  return n === 1 ? '1 item' : `${n} itens`;
}

interface Props {
  produto: ProdutoPainel;
  quantidadeMaxima: number;
  /** Link usado sem JavaScript (mensagem simples com o nome do produto). */
  linkSemJs: string;
  /** Âncora da tabela de medidas na página, se houver. */
  ancoraMedidas?: string | undefined;
}

const IconeWhatsApp = () => (
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
    <path
      d="M8.6 8.2c.2-.5.5-.6.8-.6h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.6l-.6.7a5.6 5.6 0 0 0 2.6 2.4l.7-.7c.2-.2.4-.2.6-.1l1.9.9c.2.1.3.3.3.5v.6c0 .3-.2.7-.6.9-.6.3-1.4.4-2.3.1a8.5 8.5 0 0 1-5.4-5.3c-.3-.9-.2-1.7.2-2.3Z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

export default function PainelProduto({ produto, quantidadeMaxima, linkSemJs, ancoraMedidas }: Props) {
  const selecao = useStore($selecao);
  const [quantidade, setQuantidade] = useState(1);
  const [textoQuantidade, setTextoQuantidade] = useState('1');
  const [avisoQuantidade, setAvisoQuantidade] = useState('');
  const [opcaoComErro, setOpcaoComErro] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);
  const [adicionado, setAdicionado] = useState<{ vez: number; texto: string } | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const painel = useRef<HTMLDivElement>(null);

  // Cada página começa sem seleção. "Adicionar ao carrinho" só aparece com JavaScript.
  useEffect(() => {
    $selecao.set({});
    setMontado(true);
  }, []);

  const completa = combinacaoCompleta(produto.opcoes, selecao);
  const faixa = faixaDePreco(produto);
  const resolucao = completa ? resolverCombinacao(produto, selecao as Record<string, string>) : null;
  const indisponivel = resolucao ? !resolucao.disponivel : faixa.esgotado;
  const preco = resolucao?.preco ?? faixa.min;
  const aPartirDe = !resolucao && faixa.min !== faixa.max;

  const escolher = (nomeOpcao: string, valor: string) => {
    $selecao.set(escolherValor(produto, selecao, nomeOpcao, valor));
    if (opcaoComErro === nomeOpcao) setOpcaoComErro(null);
  };

  const aplicarQuantidade = (valor: number) => {
    const { quantidade: q, ajustada } = limitarQuantidade(valor, quantidadeMaxima);
    setQuantidade(q);
    setTextoQuantidade(String(q));
    setAvisoQuantidade(
      ajustada && valor > quantidadeMaxima
        ? `Máximo de ${quantidadeMaxima} por item. Para mais, fale com a gente no WhatsApp.`
        : ajustada
          ? 'A quantidade mínima é 1.'
          : '',
    );
  };

  const destacarFaltando = (): boolean => {
    const [primeira] = opcoesFaltando(produto.opcoes, selecao);
    if (!primeira) return false;
    setOpcaoComErro(primeira.nome);
    const radio = painel.current?.querySelector<HTMLInputElement>(
      `fieldset[data-opcao="${slugificar(primeira.nome)}"] input:not(:disabled)`,
    );
    radio?.focus();
    return true;
  };

  const aoComprar = (evento: TargetedMouseEvent<HTMLAnchorElement>) => {
    if (indisponivel) {
      evento.preventDefault();
      return;
    }
    if (destacarFaltando()) {
      evento.preventDefault();
      return;
    }
    const { link } = montarPedidoWhatsApp(
      [
        {
          nome: produto.nome,
          opcoes: produto.opcoes.map((o) => [o.nome, selecao[o.nome] ?? ''] as [string, string]),
          quantidade,
          precoUnitario: preco,
        },
      ],
      { codigo: gerarCodigoPedido() },
    );
    // Troca o href no próprio clique: o navegador segue o link (nova aba) sem bloqueio de pop-up.
    evento.currentTarget.href = link;
  };

  const aoAdicionar = (evento: TargetedMouseEvent<HTMLButtonElement>) => {
    if (indisponivel || destacarFaltando()) return;
    voarParaCarrinho(evento.currentTarget);
    const combinacao = Object.fromEntries(produto.opcoes.map((o) => [o.nome, selecao[o.nome] ?? '']));
    const { limitada } = adicionarAoCarrinho({
      produtoId: produto.id,
      combinacao,
      quantidade,
      precoUnitario: preco,
      nome: produto.nome,
      slug: produto.slug,
    });
    // Ex.: "Camiseta Rei da Estrada, tamanho G, adicionada. 3 itens no carrinho."
    const descricao = produto.opcoes.map((o) => `${o.nome.toLowerCase()} ${selecao[o.nome]}`).join(', ');
    const itens = textoItens($totalItens.get());
    const texto = limitada
      ? `${produto.nome} chegou ao limite de ${quantidadeMaxima} unidades. ${itens} no carrinho.`
      : `${produto.nome}${descricao ? `, ${descricao},` : ''} adicionada. ${itens} no carrinho.`;
    setAdicionado({ vez: Date.now(), texto: limitada ? texto : 'Adicionado ao carrinho!' });
    // Limpa e reescreve para o leitor de tela anunciar mesmo se o texto for igual ao anterior.
    setAnuncio('');
    requestAnimationFrame(() => setAnuncio(texto));
  };

  const rotulo = indisponivel ? 'Indisponível' : rotuloCompra(produto, selecao, 'Comprar pelo WhatsApp');
  const rotuloAdicionar = indisponivel
    ? 'Indisponível'
    : rotuloCompra(produto, selecao, 'Adicionar ao carrinho');

  return (
    <div class="painel" ref={painel}>
      <div class="painel__preco">
        <Preco preco={preco} precoDe={produto.precoDe} aPartirDe={aPartirDe} tamanho="lg" />
        <p class="painel__frete">Frete e pagamento combinados no WhatsApp.</p>
      </div>

      {produto.opcoes.map((opcao) => {
        const nomeCampo = `opcao-${produto.id}-${slugificar(opcao.nome)}`;
        const comErro = opcaoComErro === opcao.nome;
        const idErro = `${nomeCampo}-erro`;
        return (
          <fieldset
            key={opcao.nome}
            class="seletor"
            data-opcao={slugificar(opcao.nome)}
            data-erro={comErro ? '' : undefined}
            aria-describedby={comErro ? idErro : undefined}
          >
            <legend class="seletor__legenda">
              {opcao.nome}
              {selecao[opcao.nome] && <span class="seletor__escolhido">: {selecao[opcao.nome]}</span>}
            </legend>
            <div class="seletor__valores">
              {opcao.valores.map((valor) => {
                const possivel = valorDisponivel(produto, selecao, opcao.nome, valor);
                const id = `${nomeCampo}-${slugificar(valor)}`;
                return (
                  <span key={valor} class="seletor__item">
                    <input
                      type="radio"
                      id={id}
                      name={nomeCampo}
                      value={valor}
                      class="seletor__radio"
                      checked={selecao[opcao.nome] === valor}
                      disabled={!possivel}
                      onChange={() => escolher(opcao.nome, valor)}
                    />
                    <label for={id} class="seletor__opcao">
                      {valor}
                      {!possivel && <span class="sr-only"> (esgotado)</span>}
                    </label>
                  </span>
                );
              })}
            </div>
            {comErro && (
              <p id={idErro} class="seletor__erro" role="alert">
                Escolha {opcao.nome.toLowerCase() === 'cor' ? 'uma cor' : `um ${opcao.nome.toLowerCase()}`}{' '}
                para continuar.
              </p>
            )}
            {opcao.nome === 'Tamanho' && ancoraMedidas && (
              <a href={`#${ancoraMedidas}`} class="seletor__medidas">
                Qual é o meu tamanho? Ver guia de medidas
              </a>
            )}
          </fieldset>
        );
      })}

      <div class="quantidade">
        <label for={`quantidade-${produto.id}`} class="seletor__legenda">
          Quantidade
        </label>
        <div class="quantidade__controle">
          <button
            type="button"
            class="quantidade__botao"
            onClick={() => aplicarQuantidade(quantidade - 1)}
            disabled={quantidade <= 1}
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <input
            id={`quantidade-${produto.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={quantidadeMaxima}
            class="quantidade__campo"
            value={textoQuantidade}
            onInput={(e) => setTextoQuantidade(e.currentTarget.value)}
            onBlur={(e) => aplicarQuantidade(Number(e.currentTarget.value))}
            onKeyDown={(e) => e.key === 'Enter' && aplicarQuantidade(Number(e.currentTarget.value))}
            aria-describedby={avisoQuantidade ? `quantidade-${produto.id}-aviso` : undefined}
          />
          <button
            type="button"
            class="quantidade__botao"
            onClick={() => aplicarQuantidade(quantidade + 1)}
            disabled={quantidade >= quantidadeMaxima}
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
        <p id={`quantidade-${produto.id}-aviso`} class="quantidade__aviso" aria-live="polite">
          {avisoQuantidade}
        </p>
      </div>

      <div class="painel__acoes" data-esconde-flutuante>
        <a
          href={linkSemJs}
          target="_blank"
          rel="noopener noreferrer"
          class="botao botao--whatsapp botao--bloco botao--grande"
          aria-disabled={indisponivel ? 'true' : undefined}
          onClick={aoComprar}
        >
          <IconeWhatsApp />
          {rotulo}
          <span class="sr-only"> (abre o WhatsApp em nova aba)</span>
        </a>
        <button
          type="button"
          class="botao botao--contorno botao--bloco"
          hidden={!montado}
          aria-disabled={indisponivel ? 'true' : undefined}
          onClick={aoAdicionar}
        >
          {rotuloAdicionar}
        </button>
        {adicionado && (
          <div key={adicionado.vez} class="painel__adicionado">
            <span>{adicionado.texto}</span>
            <button type="button" class="carrinho__link" onClick={abrirGaveta}>
              Ver carrinho
            </button>
          </div>
        )}
        <p class="sr-only" aria-live="polite" aria-atomic="true">
          {anuncio}
        </p>
        {indisponivel && (
          <p class="painel__indisponivel">
            {completa
              ? 'Esta combinação está esgotada. Escolha outra opção.'
              : 'Produto esgotado no momento.'}
          </p>
        )}
      </div>
    </div>
  );
}
