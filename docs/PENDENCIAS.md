# Pendências que dependem da loja

Tudo o que precisa de **confirmação, dado real ou revisão** antes (ou logo depois) de publicar.
Marque `[x]` conforme resolver. No código, cada item tem um comentário `TODO` no lugar indicado.

## 🚨 Antes de publicar (bloqueia o lançamento)

- [ ] **Número do WhatsApp** — `src/config/site.ts` → `whatsapp`. Só dígitos, com 55 + DDD
      (ex.: `5527912345678`). Enquanto for o número de exemplo, **o build de produção falha de
      propósito**.
- [ ] **Domínio final** — `src/config/site.ts` → `url`. Usado nas URLs canônicas, no sitemap, no
      `robots.txt` e nas imagens de compartilhamento.
- [ ] **Revisão jurídica da página de Trocas** — `src/pages/trocas.astro`.
- [ ] **Revisão jurídica da Política de Privacidade** — `src/pages/privacidade.astro`.
- [ ] **Medidas reais** — `src/data/medidas.json`. Os valores atuais são de **exemplo**. Meça as
      peças, troque os números e mude `"confirmado"` para `true` em cada tabela. Enquanto isso, o
      site mostra o aviso "Medidas de referência".

## Configuração geral (`src/config/site.ts`)

- [ ] Horário de atendimento (`horarioAtendimento`, hoje "Seg a Sáb, 8h às 18h").
- [ ] Confirmar o Instagram (`_conexaocapixaba`).

## Marca

- [ ] **Logo** — salve em `src/assets/marca/logo.svg` (ou `.png`) e:
  1. troque o conteúdo de `src/components/marca/Logo.astro` (instrução no próprio arquivo);
  2. rode `npm run icones` para refazer favicon, ícones do app e imagem de compartilhamento.

## Produtos (`src/data/produtos.json` → campo `_notas`)

| Produto                       | O que confirmar                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Camisa Polo                   | Cores (Preta, Branca); tecido/composição; cuidados de lavagem. **Exemplos a ajustar ou apagar:** GG a R$ 139,90 e P Branca esgotada |
| Camiseta Rei da Estrada       | Cores disponíveis, gramatura, cuidados                                                                                              |
| Camiseta Vida de Caminhoneiro | Se é lançamento (selo NOVO); tecido; cuidados                                                                                       |
| Moletom                       | Modelo (com/sem capuz ou zíper), cores, tecido, cuidados                                                                            |
| Adesivo                       | Medidas e instruções de aplicação                                                                                                   |
| Boné                          | Tipo de aba, regulagem e cores                                                                                                      |
| Todos                         | **Fotos**: coloque em `fotos-brutas/` e rode `/fotos` (ou `npm run fotos`)                                                          |

Depois de confirmar, preencha `cuidados` (lista) e ajuste as descrições. Apague as `_notas` resolvidas.

## Por página

### Como comprar (`src/pages/como-comprar.astro`)

- [ ] Formas de pagamento e prazo de postagem, para detalhar "O que acontece no WhatsApp".

### Sobre (`src/pages/sobre.astro`)

- [ ] Ano de fundação, cidade de origem e quem fundou (se quiserem contar). O texto atual não afirma
      nenhum desses dados.

### Perguntas frequentes (`src/data/faq.ts` → campo `pendente`)

- [ ] Formas de pagamento aceitas (Pix, cartão, boleto…).
- [ ] Prazo de postagem após a confirmação do pagamento.
- [ ] Revisar a resposta de troca quando a política estiver definida.
- [ ] Se a loja faz personalizados e/ou atacado, e se há pedido mínimo.

### Trocas e devoluções (`src/pages/trocas.astro`) — revisão jurídica

- [ ] Como é feito o envio de volta no arrependimento (quem gera a postagem e como).
- [ ] Política de troca da loja: prazo, condição da peça, quem paga o frete, quantas trocas por pedido.
- [ ] Conferir a base legal citada: CDC (Lei nº 8.078/1990), arts. 18, 26 e 49; Decreto
      nº 7.962/2013, art. 5º.

### Política de privacidade (`src/pages/privacidade.astro`) — revisão jurídica

- [ ] Razão social, CNPJ e endereço do controlador.
- [ ] Nome e contato do encarregado (DPO) ou responsável pelos dados.
- [ ] Por quanto tempo conversas e dados de pedidos ficam guardados, e com quem são compartilhados
      (transportadora, meio de pagamento).
- [ ] Data da última atualização no momento da publicação.
- [ ] Conferir a base legal citada: LGPD (Lei nº 13.709/2018), arts. 7º e 18.

## Netlify

- [ ] Conectar o repositório no Netlify (o `netlify.toml` já tem build, headers e cache).
- [ ] **Não** definir `PERMITIR_NUMERO_FICTICIO` no Netlify. Se precisar de uma prévia antes do
      número real, defina-a temporariamente e remova depois.
- [ ] Depois do primeiro deploy, conferir os cabeçalhos de segurança em
      <https://securityheaders.com> e rodar o Lighthouse no endereço publicado.
