/**
 * Perguntas frequentes. Usadas na página /perguntas-frequentes, no resumo da página inicial
 * (destaque: true) e no JSON-LD FAQPage.
 *
 * `pendente` lista o que a loja precisa confirmar antes de publicar (aparece no relatório de TODOs,
 * nunca no site).
 */
export interface PerguntaFrequente {
  id: string;
  pergunta: string;
  /** Um item por parágrafo. Texto puro (vai também para o Google). */
  resposta: string[];
  link?: { href: string; rotulo: string };
  destaque?: boolean;
  pendente?: string;
}

export const perguntasFrequentes: PerguntaFrequente[] = [
  {
    id: 'pagamento',
    pergunta: 'Como funciona o pagamento?',
    resposta: [
      'Você não paga nada no site. Monte o pedido e envie pelo WhatsApp: a gente confirma a disponibilidade, o valor do frete e combina com você a forma de pagamento.',
      'Só depois de tudo confirmado o pedido é separado e enviado.',
    ],
    destaque: true,
    pendente: 'Informar as formas de pagamento aceitas (Pix, cartão, boleto…).',
  },
  {
    id: 'envio',
    pergunta: 'Vocês enviam para todo o Brasil?',
    resposta: [
      'Sim. Enviamos do Espírito Santo para todo o Brasil. O valor e a forma de envio são combinados no atendimento, de acordo com o seu endereço.',
    ],
    destaque: true,
  },
  {
    id: 'tamanho',
    pergunta: 'Como escolho o tamanho?',
    resposta: [
      'Cada peça com tamanho tem uma tabela de medidas na própria página. Compare com uma roupa sua que veste bem. Ficou em dúvida entre dois tamanhos? Chama a gente no WhatsApp antes de pedir.',
    ],
    link: { href: '/guia-de-medidas', rotulo: 'Ver o guia de medidas' },
    destaque: true,
  },
  {
    id: 'varios-produtos',
    pergunta: 'Posso pedir vários produtos de uma vez?',
    resposta: [
      'Pode. Use "Adicionar ao carrinho" em cada produto e, no fim, "Enviar pedido pelo WhatsApp". A mensagem vai com todos os itens, tamanhos, quantidades e o total.',
    ],
    destaque: true,
  },
  {
    id: 'prazo',
    pergunta: 'Qual o prazo de entrega?',
    resposta: [
      'O prazo depende da sua região e da forma de envio escolhida. A gente informa o prazo certinho no atendimento, antes de você fechar o pedido.',
    ],
    pendente: 'Informar o prazo de postagem após a confirmação do pagamento.',
  },
  {
    id: 'troca',
    pergunta: 'Como funciona a troca?',
    resposta: [
      'Se a peça não serviu ou chegou com algum problema, fale com a gente pelo WhatsApp. Explicamos as condições e o passo a passo na página de trocas e devoluções.',
    ],
    link: { href: '/trocas', rotulo: 'Ver trocas e devoluções' },
    pendente: 'Revisar quando a política de trocas estiver definida.',
  },
  {
    id: 'personalizado',
    pergunta: 'Vocês fazem pedido personalizado ou no atacado?',
    resposta: [
      'Fale com a gente pelo WhatsApp contando o que você precisa: quantidade, modelo e prazo. A gente responde se consegue atender e como fica.',
    ],
    pendente: 'Confirmar se a loja faz personalizados e/ou atacado, e se há pedido mínimo.',
  },
  {
    id: 'cadastro',
    pergunta: 'Preciso fazer cadastro?',
    resposta: [
      'Não. Você escolhe os produtos e envia o pedido pelo WhatsApp. Nome e cidade são opcionais e servem só para agilizar o atendimento.',
    ],
  },
  {
    id: 'whatsapp-computador',
    pergunta: 'Não tenho WhatsApp no computador. E agora?',
    resposta: [
      'Sem problema. No computador, o botão abre o WhatsApp Web no navegador: é só entrar com o seu celular (lendo o QR Code) e a mensagem do pedido já aparece pronta. Se preferir, monte o carrinho pelo celular.',
    ],
  },
];
