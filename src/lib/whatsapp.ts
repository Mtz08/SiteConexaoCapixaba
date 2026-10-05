import { site } from '../config/site';
import { formatarPrecoTexto, multiplicar, somar, type Centavos } from './dinheiro';

/**
 * Mensagem e link do WhatsApp — funções puras e testadas.
 * Usadas pelo "Comprar pelo WhatsApp" (um item) e pelo carrinho (vários).
 */

/** Acima disso, a mensagem passa para o formato compacto (uma linha por item). */
export const LIMITE_URL = 1800;

export interface ItemMensagem {
  nome: string;
  /** Opções escolhidas, na ordem do produto. Ex.: [['Tamanho','G'], ['Cor','Preta']] */
  opcoes: [nome: string, valor: string][];
  quantidade: number;
  precoUnitario: Centavos;
}

export interface ClienteMensagem {
  nome?: string | undefined;
  cidade?: string | undefined;
}

export interface OpcoesMensagem {
  codigo: string;
  cliente?: ClienteMensagem | undefined;
  compacta?: boolean;
}

/** Link wa.me: abre o app no celular e o WhatsApp Web no computador. */
export function montarLinkWhatsApp(mensagem?: string, numero: string = site.whatsapp): string {
  const base = `https://wa.me/${numero}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

export const mensagemContato = `Olá, ${site.nome}! Vim pelo site e queria tirar uma dúvida.`;

/** Mensagem simples para quando o JavaScript não carregou (link estático). */
export function mensagemInteresse(nomeProduto: string): string {
  return `Olá, ${site.nome}! Tenho interesse no produto: ${nomeProduto}. Vim pelo site.`;
}

/** Tira quebras de linha e espaços repetidos de texto digitado pelo cliente. */
function limparCampo(texto: string | undefined): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function linhaOpcoes(opcoes: ItemMensagem['opcoes']): string {
  return opcoes.map(([nome, valor]) => `${nome}: ${valor}`).join(' | ');
}

function blocoItem(item: ItemMensagem, indice: number): string {
  const subtotal = multiplicar(item.precoUnitario, item.quantidade);
  const linhas = [`${indice + 1}) ${item.nome}`];
  if (item.opcoes.length > 0) linhas.push(`   ${linhaOpcoes(item.opcoes)}`);
  linhas.push(
    `   ${item.quantidade} x ${formatarPrecoTexto(item.precoUnitario)} = ${formatarPrecoTexto(subtotal)}`,
  );
  return linhas.join('\n');
}

function linhaItemCompacta(item: ItemMensagem, indice: number): string {
  const subtotal = multiplicar(item.precoUnitario, item.quantidade);
  const opcoes = item.opcoes.length > 0 ? ` (${item.opcoes.map(([, v]) => v).join(', ')})` : '';
  return `${indice + 1}) ${item.nome}${opcoes} — ${item.quantidade} x ${formatarPrecoTexto(item.precoUnitario)} = ${formatarPrecoTexto(subtotal)}`;
}

export function totalDosItens(itens: ItemMensagem[]): Centavos {
  return somar(...itens.map((i) => multiplicar(i.precoUnitario, i.quantidade)));
}

/** Monta o texto do pedido. Não decide o formato: use `montarPedidoWhatsApp` para isso. */
export function montarMensagemPedido(itens: ItemMensagem[], opcoes: OpcoesMensagem): string {
  const nome = limparCampo(opcoes.cliente?.nome);
  const cidade = limparCampo(opcoes.cliente?.cidade);
  const corpo = opcoes.compacta ? itens.map(linhaItemCompacta).join('\n') : itens.map(blocoItem).join('\n\n');

  const partes = [
    `Olá, ${site.nome}! Quero fazer este pedido:`,
    `*Pedido #${opcoes.codigo}*`,
    corpo,
    `*Total dos produtos: ${formatarPrecoTexto(totalDosItens(itens))}*\n(frete a combinar)`,
  ];
  const dadosCliente = [nome && `Nome: ${nome}`, cidade && `Cidade: ${cidade}`].filter(Boolean).join('\n');
  if (dadosCliente) partes.push(dadosCliente);
  partes.push('Pedido feito pelo site.');

  return partes.join('\n\n');
}

/**
 * Mensagem + link prontos. Se o link completo passar de LIMITE_URL caracteres,
 * usa automaticamente o formato compacto.
 */
export function montarPedidoWhatsApp(
  itens: ItemMensagem[],
  opcoes: Omit<OpcoesMensagem, 'compacta'>,
  numero: string = site.whatsapp,
): { mensagem: string; link: string; compacta: boolean } {
  const completa = montarMensagemPedido(itens, opcoes);
  const linkCompleto = montarLinkWhatsApp(completa, numero);
  if (linkCompleto.length <= LIMITE_URL) return { mensagem: completa, link: linkCompleto, compacta: false };

  const compacta = montarMensagemPedido(itens, { ...opcoes, compacta: true });
  return { mensagem: compacta, link: montarLinkWhatsApp(compacta, numero), compacta: true };
}
