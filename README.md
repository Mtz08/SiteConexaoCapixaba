# Conexão Capixaba — site oficial

> **Vivendo o extraordinário.** Roupas e acessórios para caminhoneiros, famílias e apaixonados pelo
> mundo do transporte. Direto do Espírito Santo, com envio para todo o Brasil.

Site estático e rápido (Astro), pensado para o celular e para internet fraca. **Não há pagamento no
site**: o cliente escolhe os produtos e o pedido vai pronto para o WhatsApp da loja.

## Rodar no computador

Requisitos: **Node.js 24** (LTS) e npm.

```bash
npm install
cp .env.example .env   # libera o número de WhatsApp de exemplo nos builds locais
npm run dev            # http://localhost:4321
```

## Comandos

| Comando           | O que faz                                                                       |
| ----------------- | ------------------------------------------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento                                                     |
| `npm run build`   | Gera o site em `dist/`                                                          |
| `npm run preview` | Serve o `dist/` como em produção (a CSP só vale aqui)                           |
| `npm run check`   | Checagem de tipos                                                               |
| `npm run lint`    | ESLint                                                                          |
| `npm run format`  | Prettier                                                                        |
| `npm test`        | Testes (Vitest)                                                                 |
| `npm run fotos`   | Processa as fotos de `fotos-brutas/` (`npm run fotos -- --verificar` só simula) |
| `npm run icones`  | Gera favicon, ícones do app e imagem de compartilhamento em `public/`           |
| `npm run fonte`   | Gera o subconjunto da fonte Archivo (só se mudar pesos/larguras usados)         |

No **Claude Code** (VS Code), há também:

- `/fotos`: processa as fotos, olhando as imagens com nome errado e pedindo confirmação;
- `/novo-produto`: cadastra um produto fazendo perguntas simples.

## Publicar no Netlify

1. No Netlify: **Add new site → Import an existing project** e escolha este repositório do GitHub.
2. As configurações já vêm do `netlify.toml`: comando `npm run build`, pasta `dist`, Node 24,
   cabeçalhos de segurança e cache.
3. Antes, troque o **número de WhatsApp** e o **domínio** em `src/config/site.ts`. Com o número de
   exemplo, **o build de produção falha de propósito**.
   - Para uma prévia antes do número real: em _Site configuration → Environment variables_, crie
     `PERMITIR_NUMERO_FICTICIO=true`. Remova a variável quando o número real entrar.
4. Cada `git push` na `main` publica automaticamente.

## Onde editar cada coisa

| Quero mudar…                                           | Arquivo                                                                                               |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| WhatsApp, Instagram, horário, domínio, máximo por item | `src/config/site.ts`                                                                                  |
| Produtos, preços, tamanhos, cores, promoções           | `src/data/produtos.json`. Guia: [`docs/COMO-EDITAR-PRODUTOS.md`](docs/COMO-EDITAR-PRODUTOS.md)        |
| Categorias (nome, cor da placa, ordem)                 | `src/data/categorias.json`                                                                            |
| Tabelas de medidas                                     | `src/data/medidas.json`                                                                               |
| Perguntas frequentes                                   | `src/data/faq.ts`                                                                                     |
| Fotos dos produtos                                     | coloque em `fotos-brutas/` e rode `/fotos`. Veja [`fotos-brutas/LEIA-ME.md`](fotos-brutas/LEIA-ME.md) |
| Logo                                                   | `src/assets/marca/` + `src/components/marca/Logo.astro`, depois `npm run icones`                      |
| Menu e links do rodapé                                 | `src/config/navegacao.ts`                                                                             |
| Cores e tipografia                                     | `src/styles/global.css`. Contrastes em [`docs/CORES.md`](docs/CORES.md)                               |
| Textos das páginas                                     | `src/pages/*.astro`                                                                                   |

## Documentação

- [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md): **o que falta a loja confirmar** antes de publicar.
- [`docs/COMO-EDITAR-PRODUTOS.md`](docs/COMO-EDITAR-PRODUTOS.md): guia do catálogo para quem não programa.
- [`docs/AUDITORIA.md`](docs/AUDITORIA.md): resultados de desempenho, acessibilidade e testes.
- [`docs/CORES.md`](docs/CORES.md): paleta e contraste.
- [`docs/ANALYTICS-E-CONSENTIMENTO.md`](docs/ANALYTICS-E-CONSENTIMENTO.md): como medir acessos no
  futuro sem quebrar a LGPD.
- [`CLAUDE.md`](CLAUDE.md): regras do projeto, para quem desenvolve e para o Claude Code.

## Tecnologia

Astro 7 (estático) · ilhas Preact · Tailwind CSS 4 · nanostores · TypeScript estrito · Zod
(validação do catálogo) · sharp (imagens) · Vitest · ESLint · Prettier · Netlify.

Privacidade: sem cookies, sem analytics, sem chamadas a terceiros no carregamento. Nome e cidade do
cliente (opcionais) ficam só no aparelho dele.
