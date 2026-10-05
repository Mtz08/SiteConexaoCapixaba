/**
 * Configuração central da loja.
 * Este é o ÚNICO lugar para trocar dados de contato, número de WhatsApp,
 * Instagram e horário. Todo o site lê daqui.
 */

/** Número de exemplo. Enquanto `site.whatsapp` for igual a ele, o build de produção falha. */
export const NUMERO_WHATSAPP_FICTICIO = '5527999999999';

export const site = {
  nome: 'Conexão Capixaba',
  slogan: 'Vivendo o extraordinário',
  descricao:
    'Camisas polo, camisetas, moletons, adesivos e bonés para quem vive a estrada. Direto do Espírito Santo, com envio para todo o Brasil.',
  url: 'https://conexaocapixaba.netlify.app', // TODO: domínio final
  whatsapp: NUMERO_WHATSAPP_FICTICIO, // TODO: número real (só dígitos, com 55 + DDD)
  instagram: '_conexaocapixaba',
  horarioAtendimento: 'Seg a Sáb, 8h às 18h', // TODO: confirmar
  quantidadeMaximaPorItem: 20,
  locale: 'pt-BR',
  moeda: 'BRL',
} as const;

export const instagramUrl = `https://www.instagram.com/${site.instagram}/`;

/** Celular brasileiro: 55 + DDD (2 dígitos) + 8 ou 9 dígitos. */
export function numeroWhatsappValido(numero: string): boolean {
  return /^55\d{2}9?\d{8}$/.test(numero);
}

export function numeroWhatsappFicticio(numero: string): boolean {
  return numero === NUMERO_WHATSAPP_FICTICIO;
}
