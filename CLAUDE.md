# Conexão Capixaba — regras do projeto

Site oficial da loja Conexão Capixaba ("Vivendo o extraordinário"): roupas e acessórios para
caminhoneiros. **Não há pagamento no site**: o cliente monta o pedido e é levado ao WhatsApp
com a mensagem pronta. Público majoritariamente no celular, com internet fraca.

Todo texto do site e da documentação em **português do Brasil**.

## Stack (não trocar sem perguntar)

- **Astro 7** (saída estática, `build.format: 'file'`, `trailingSlash: 'never'`)
- **Ilhas Preact 10** (`@astrojs/preact` não aceita Preact 11) — só onde há estado
- **Tailwind CSS 4** via `@tailwindcss/vite`; tokens em `src/styles/global.css`
- **nanostores** + `@nanostores/persistent` para o carrinho
- **Content Collections** + Zod para o catálogo (`src/content.config.ts`)
- `astro:assets` + **sharp** para imagens
- **TypeScript 6** estrito (`@astrojs/check` ainda não aceita TS 7)
- ESLint 10 (flat config), Prettier, Vitest
- Hospedagem: **Netlify** (`netlify.toml`)

## Comandos

| Comando           | O que faz                                          |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Servidor local em http://localhost:4321            |
| `npm run build`   | Gera `dist/`                                       |
| `npm run preview` | Serve o `dist/` (CSP só funciona aqui, não no dev) |
| `npm run check`   | Checagem de tipos (`astro check`)                  |
| `npm run lint`    | ESLint                                             |
| `npm run format`  | Prettier                                           |
| `npm test`        | Vitest                                             |

**Antes de concluir qualquer tarefa:** `npm run build`, `npm run check`, `npm run lint` e
`npm test` precisam passar sem erro nem aviso (o único aviso aceito é o do número de WhatsApp
de exemplo, enquanto ele não for trocado).

## Onde fica cada coisa

- `src/config/site.ts` — **único lugar** com dados da loja (WhatsApp, Instagram, horário, URL)
- `src/config/navegacao.ts` — links do menu e do rodapé
- `src/styles/global.css` — tokens de cor, tipografia, utilitários de marca
- `src/components/marca/Logo.astro` — **único lugar** do logotipo
- `src/components/icones/Icone.astro` — ícones SVG próprios
- `src/layouts/Base.astro` — HTML base, fonte, SEO, cabeçalho e rodapé
- `src/lib/` — lógica pura e testada (dinheiro, WhatsApp, carrinho)
  - `dinheiro.ts` — tipo `Centavos`, conversão e formatação
  - `catalogo/schema.ts` — schemas Zod (mensagens para quem não programa)
  - `catalogo/variacoes.ts` — resolução de preço/disponibilidade por combinação
  - `catalogo/lerJson.ts` + `catalogo/loader.ts` — leitura do JSON com erro amigável
  - `catalogo/consultas.ts` — **única** porta de acesso ao catálogo nas páginas
    (filtra `ativo`, ordena). Não use `getCollection` direto
- `src/content.config.ts` — coleções `produtos` e `categorias`
- `src/data/` — `produtos.json`, `categorias.json` (e `medidas.json`, fase 4)
- `docs/COMO-EDITAR-PRODUTOS.md` — guia do catálogo. **Atualize ao mudar o schema**

### Catálogo

- O loader `file()` do Astro só registra erro e segue com a coleção vazia. Por isso usamos
  `catalogoLoader` (`src/lib/catalogo/loader.ts`), que derruba o build.
- `variacoes[].combinacao` pode ser parcial (`{ "Tamanho": "GG" }` vale para todas as cores).
  A mais específica vence, atributo por atributo; empate com valores diferentes é erro.
- Linha do carrinho: `idLinha()` = `produtoId` + combinação canônica (ordem das opções não importa).

### Carrinho

- Lógica pura em `src/lib/carrinho.ts` (testada); estado em `src/stores/carrinho.ts` (nanostores).
- Persistência: `@nanostores/persistent` com o motor seguro de `src/lib/armazenamento.ts` (cai para
  memória se o localStorage falhar). Chaves `carrinho:v1` e `cliente:v1`; vazio = chave apagada.
- `/catalogo.json` (gerado no build) é baixado pelo navegador para revalidar o carrinho.
- Gaveta: `<dialog>` em `GavetaCarrinho.tsx`; qualquer elemento com `data-abrir-carrinho` a abre.
- A mensagem do WhatsApp sai SEMPRE de `montarPedidoWhatsApp()` (`src/lib/whatsapp.ts`).
- `src/integrations/` — integrações do Astro (checagem do número de WhatsApp)
- `docs/` — guias para quem edita o site (`CORES.md`, `COMO-EDITAR-PRODUTOS.md`)
- `fotos-brutas/` — fotos originais (fora do git); processadas por `npm run fotos`

## Regras invioláveis

1. **Verde WhatsApp (`--whatsapp`) só em botões/links que levam ao WhatsApp.** Nunca em outro lugar.
2. **Dinheiro em centavos (inteiros)** em todo o código. O JSON usa reais (`129.90`); a conversão
   acontece no schema. Formatar só na exibição, com `Intl.NumberFormat('pt-BR', BRL)`.
3. **Sem `style="..."` inline e sem `define:vars`**: a CSP (hashes gerados pelo Astro) bloqueia.
   Cor de categoria vai por `data-cor="azul|vermelha|verde|amarela|branca"`.
4. **Nenhuma chamada a terceiros no carregamento** (sem Google Fonts, pixels, embeds, CDNs).
   Fontes e scripts auto-hospedados. Sem analytics/cookies (ver `docs/`).
5. **Nenhum dado pessoal vai para servidor.** Nome/cidade opcionais ficam só no localStorage
   e na mensagem que o próprio cliente envia.
6. **Contraste WCAG AA** — consultar `docs/CORES.md` antes de combinar cores. Vermelho como
   texto usa `--placa-pare-claro`; texto sobre o verde WhatsApp é escuro (`--whatsapp-tx`).
7. Foco visível nunca é removido. Alvos de toque ≥ 44×44 px (`alvo-toque`).
8. Respeitar `prefers-reduced-motion`.
9. Fato não confirmado pela loja (ano de fundação, tecido, prazos…) fica marcado com `TODO`.
   No JSON, que não aceita comentário, use o campo `_notas`.

## Convenções de código

- Domínio em português (`produto`, `variacao`, `carrinho`, `precoBase`); termos técnicos em
  inglês (`store`, `props`, `slot`).
- Componentes pequenos, uma responsabilidade. Lógica de negócio em `src/lib/` com teste ao lado
  (`*.test.ts`).
- **Estilo escopado (`<style>` do componente) vence utilitário do Tailwind.** Não combine
  `class="minha-classe md:hidden"` se `.minha-classe` define `display`: faça a media query no
  próprio `<style>`.
- Componentes visuais reaproveitados por ilhas (placeholder, preço, ícones) são **TSX Preact**
  renderizados pelo Astro sem `client:` (zero JS). Como TSX não tem estilo escopado, o CSS deles
  fica em `src/styles/ui.css` e `src/styles/produto.css`, dentro de `@layer components`.
- Ilhas em `src/components/islands/`. A loja usa uma ilha só para a barra de filtros: os cartões
  são HTML do build e a ilha os esconde/reordena (movendo os nós, para a ordem do teclado acompanhar).
- **Dados do aparelho (localStorage) e hidratação:** o HTML do build não conhece o carrinho. Todo
  componente que mostra dado salvo no aparelho usa `useMontado()` (`src/components/carrinho/useMontado.ts`)
  e só renderiza o conteúdo real depois de montar. Sem isso o Preact reaproveita elementos do HTML
  do servidor com as classes erradas.
- **Espaço antes de tag inline:** o Astro comprime o HTML; texto no fim de uma linha seguido de
  `<strong>`/`<a>` na linha de baixo pode perder o espaço. Use `{' '}` (o Prettier costuma colocar) e
  confira o HTML gerado.
- Elementos que não podem ficar cobertos pelo botão flutuante de WhatsApp levam `data-esconde-flutuante`.
- Commits semânticos: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

## Testes visuais

O Chrome headless não renderiza janelas com menos de ~500 px. Para capturar em 320/390 px,
use uma página com `<iframe width="320">` apontando para `npm run preview`.

Testes de interação (clicar, teclado, sem JS): `puppeteer-core` instalado **fora do projeto**
(pasta temporária), usando o Chrome da máquina. Não adicionar ao package.json.
Fotos de teste geradas com sharp devem ser apagadas e o `produtos.json` restaurado ao final.

## Número de WhatsApp

Enquanto `site.whatsapp` for o número de exemplo, o **build de produção falha**. Para builds de
teste, `PERMITIR_NUMERO_FICTICIO=true` (já está no `.env` local, que não vai para o git). No
Netlify, **não** defina essa variável.
