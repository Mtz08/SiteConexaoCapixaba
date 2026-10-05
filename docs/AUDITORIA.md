# Auditoria final — 05/10/2026

Build de produção (`npm run build` + `npm run preview`) testado no Chrome 2026 da máquina de
desenvolvimento. Ferramentas: Lighthouse 13.5 (mobile padrão: Moto G Power, 4G lento simulado,
CPU 4× mais lenta), axe-core (WCAG 2.0/2.1/2.2 A e AA + boas práticas) e testes de navegador com
puppeteer-core.

> O servidor local de preview **não comprime** HTML/CSS/JS; o Netlify comprime (gzip/brotli).
> Em produção, os números de desempenho tendem a ser iguais ou melhores.

## Lighthouse (mobile)

| Página                         | Desempenho | Acessib. | Boas práticas | SEO |    LCP |   CLS |  TBT |
| ------------------------------ | ---------: | -------: | ------------: | --: | -----: | ----: | ---: |
| Início                         |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| Loja                           |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| Categoria (camisetas)          |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| Produto com variações (polo)   |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| Produto sem variação (adesivo) |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| Carrinho                       |         99 |      100 |           100 | 66¹ | 1,96 s | 0,009 | 0 ms |
| Sobre                          |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| Como comprar                   |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| Guia de medidas                |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| Perguntas frequentes           |        100 |      100 |           100 | 100 | 1,81 s |     0 | 0 ms |
| Contato                        |        100 |      100 |           100 | 100 | 1,51 s |     0 | 0 ms |
| Trocas                         |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| Privacidade                    |         99 |      100 |           100 | 100 | 1,96 s |     0 | 0 ms |
| 404                            |         99 |      100 |           100 | 66¹ | 1,96 s |     0 | 0 ms |

¹ Carrinho e 404 têm `noindex` **de propósito**: não devem aparecer no Google. O único item de SEO
que "falha" é exatamente esse (`is-crawlable`).

**Metas:** desempenho ≥ 95 ✔ · acessibilidade 100 ✔ · boas práticas 100 ✔ · SEO 100 ✔ (exceto as
duas páginas `noindex`) · LCP < 2,0 s ✔ · CLS < 0,05 ✔ · INP < 200 ms ✔ (TBT 0 ms em todas; o INP
só se mede com usuários reais).

**JavaScript enviado (gzip):** página inicial **18,1 kB** (meta < 40 kB ✔), loja 20,2 kB, produto
21,8 kB. Inclui o Preact, o carrinho, a gaveta e o botão flutuante; as páginas de loja e produto
somam as ilhas de filtro e de compra.

## Acessibilidade

- **axe-core: 0 violações** nas 14 páginas, em 390 px e 1280 px, com os acordeões abertos.
- **Teclado:** em todas as páginas o 1º Tab é "Pular para o conteúdo", que funciona. Todo elemento
  focável tem foco visível (contorno amarelo de 3 px). Nenhuma parada de Tab invisível. A gaveta do
  carrinho prende o foco, fecha com Esc e devolve o foco a quem a abriu.
- **Alvos de toque:** ≥ 44×44 px em links, botões, chips e seletores.
- **Contraste:** todas as combinações estão em `docs/CORES.md` (mínimo 4,5:1 para texto).
- Um `h1` por página, `lang="pt-BR"`, landmarks, `alt` e `width`/`height` em todas as imagens.
- Anúncio por `aria-live` ao adicionar ao carrinho ("Camiseta Rei da Estrada, tamanho G, adicionada.
  2 itens no carrinho.").

## Responsividade e console

- Sem rolagem horizontal em **320 px** em nenhuma das 14 páginas.
- **Console limpo** (nenhum erro ou aviso, inclusive de CSP) em todas as páginas.
- **Links:** 782 links/recursos internos verificados, **nenhum quebrado**. Domínios externos só como
  links: `wa.me` e `instagram.com`. Nada é carregado de terceiros ao abrir as páginas.

## O que foi encontrado e corrigido nesta auditoria

| Problema                                                                  | Correção                                                             |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| LCP de 2,11 s (fonte de 88 KB chegando tarde em 4G)                       | Subconjunto da Archivo (pt-BR, eixos usados): 88 → 53 KB. LCP 1,96 s |
| Contraste 4,0:1 na contagem das placas de categoria (texto com `opacity`) | Texto sobre cor de placa sem opacidade em todo o site                |
| Tabela de medidas com rolagem horizontal inalcançável pelo teclado        | Região rolável com `tabindex="0"` e rótulo                           |
| Ordem de títulos no guia de medidas (h3 sem h2)                           | Um h2 por tabela                                                     |
| Botão flutuante fora de landmark                                          | Dentro de `<aside aria-label="Atendimento pelo WhatsApp">`           |
| Links de uma palavra só (rodapé, trilha) menores que 44 px                | Largura mínima de 44 px                                              |

Correções de fases anteriores, encontradas nos testes: o loader de arquivo do Astro publicava o site
sem produtos quando o JSON tinha erro; descompasso de hidratação no carrinho; URL canônica da home
(`/index`); espaços perdidos antes de negrito; estouros em 320 px.

## Cenários de falha (seção 11 do prompt)

| Cenário                                 | Como foi verificado                                                                                                             | Resultado                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Erro de digitação no `produtos.json`    | Build com vírgula sobrando/dupla, slug repetido, categoria errada, campo com grafia errada, preço como texto, variação inválida | ✔ Build falha com produto, campo e dica                                       |
| Produto removido/desativado no carrinho | Teste de navegador + unitário                                                                                                   | ✔ Sai com aviso                                                               |
| Preço mudou                             | Teste de navegador + unitário                                                                                                   | ✔ Atualiza e avisa                                                            |
| localStorage bloqueado                  | Navegador com `getItem`/`setItem` lançando erro                                                                                 | ✔ Funciona em memória, aviso discreto, console limpo                          |
| localStorage corrompido/versão antiga   | Navegador + unitário                                                                                                            | ✔ Carrinho vazio, sem erro                                                    |
| Sem WhatsApp no computador              | `wa.me` abre o WhatsApp Web; `/como-comprar` explica                                                                            | ✔                                                                             |
| Pedido muito grande                     | Unitário (14 itens)                                                                                                             | ✔ Formato compacto automático                                                 |
| Variação obrigatória não escolhida      | Navegador                                                                                                                       | ✔ Botão orienta e foca o seletor                                              |
| Combinação indisponível                 | Navegador                                                                                                                       | ✔ Riscada, desabilitada, "(esgotado)" para leitor de tela                     |
| Quantidade acima do máximo ou inválida  | Navegador + unitário                                                                                                            | ✔ Limita a 20 e informa                                                       |
| JS desativado                           | Navegador sem JS                                                                                                                | ✔ Páginas legíveis; comprar vira link com o nome do produto; carrinho explica |
| Foto ausente ou caminho errado          | Unitário + build                                                                                                                | ✔ Placeholder de placa                                                        |
| Foto com nome que não bate              | `npm run fotos` com 4 nomes errados                                                                                             | ✔ Relata, sugere e não processa                                               |
| Número fictício em produção             | Build sem `PERMITIR_NUMERO_FICTICIO`                                                                                            | ✔ Build falha com instrução                                                   |
| Abas diferentes abertas                 | Duas abas no navegador                                                                                                          | ✔ Sincroniza (evento `storage`)                                               |

## Checklist da seção 13

- [x] `npm run build`, `check`, `lint` e `test` sem erro nem aviso (o único aviso é o do número de
      WhatsApp de exemplo, intencional até o número real entrar).
- [x] Metas do Lighthouse (tabela acima).
- [x] Cenários da seção 11 (tabela acima).
- [x] Mensagem do WhatsApp testada: 1 item sem variação, 1 item com 2 variações, 7 itens, com e sem
      nome/cidade (`src/lib/whatsapp.test.ts` e teste de navegador).
- [x] Trocar o número em `site.ts` muda todos os botões: build com outro número gerou 85 links
      `wa.me`, todos com o número novo.
- [x] Adicionar produto só pelo JSON: produto temporário gerou página e apareceu na loja, na
      categoria, no catálogo e no sitemap (removido depois).
- [x] `npm run fotos` testado com 2 imagens geradas (uma com GPS e rotação EXIF) + 4 nomes
      errados, depois removidas. O comando `/fotos` do Claude Code orquestra esse mesmo script.
- [x] `README.md`.
- [x] Lista de TODOs por página: `docs/PENDENCIAS.md`.

## Testes automatizados

`npm test`: 220 testes em 15 arquivos. Cobrem dinheiro, variações, schema e mensagens de erro do
catálogo, filtro da loja, seleção, carrinho (incluindo persistência e revalidação), armazenamento
seguro, mensagem e link do WhatsApp, código do pedido, JSON-LD e processamento de fotos.
