import { site } from '../config/site';

/**
 * Monta o link do WhatsApp. Funciona no app (celular) e no WhatsApp Web (computador).
 * A montagem da mensagem do pedido entra na fase do carrinho.
 */
export function montarLinkWhatsApp(mensagem?: string, numero: string = site.whatsapp): string {
  const base = `https://wa.me/${numero}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

export const mensagemContato = `Olá, ${site.nome}! Vim pelo site e queria tirar uma dúvida.`;
