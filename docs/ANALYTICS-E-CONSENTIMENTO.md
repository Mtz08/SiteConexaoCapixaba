# Analytics e consentimento (para o futuro)

**Hoje o site não tem nenhuma ferramenta de análise, pixel ou cookie de rastreamento.** Isso é
proposital: o site é mais leve, não precisa de banner de cookies e a política de privacidade fica
simples. Este documento explica como adicionar medição no futuro **sem quebrar a LGPD nem a CSP**.

## Opção recomendada: Netlify Analytics (sem cookie)

- É medido **no servidor da Netlify**, a partir dos acessos às páginas. Não roda JavaScript no
  navegador do cliente e não grava cookie.
- Ativa-se no painel da Netlify (_Site configuration → Analytics_). É um serviço pago da Netlify.
  Confira o preço atual antes de ativar.
- **Nenhuma mudança no código é necessária.**
- Atualize a seção "Hospedagem" da página `/privacidade` (`src/pages/privacidade.astro`), dizendo
  que a hospedagem gera estatísticas agregadas de acesso.

## Se um dia usar ferramenta com cookie ou script de terceiros

Exemplos: Google Analytics, Meta Pixel, Hotjar. **Não implementado.** Caminho a seguir:

1. **Consentimento prévio (opt-in).** A ferramenta só pode carregar **depois** que o visitante
   aceitar, num banner com "Aceitar" e "Recusar" do mesmo tamanho. Nada de caixa pré-marcada. Base
   legal: LGPD (Lei nº 13.709/2018), art. 7º, I, e art. 8º. Leia também o guia de cookies da ANPD.
   A regra precisa de revisão jurídica.
2. **Ponto de extensão.** Crie um componente `src/components/islands/Consentimento.tsx`. Ele guarda
   a escolha em `localStorage` (chave `consentimento:v1`) e só então injeta o script da ferramenta.
   Coloque o componente no `src/layouts/Base.astro`, junto do `WhatsAppFlutuante`.
3. **CSP.** Libere **só** os domínios necessários no `netlify.toml` (`script-src`, `connect-src`,
   `img-src`). Para scripts externos, use os hashes da CSP do Astro (`security.csp.scriptDirective`
   em `astro.config.mjs`).
4. **Privacidade.** Atualize `/privacidade` com a ferramenta, a finalidade, o prazo de retenção e como
   revogar o consentimento. O botão "Apagar meus dados deste aparelho" também deve apagar a escolha.
5. **Desempenho.** Carregue o script com `defer` e depois da interação, para não estourar a meta de
   menos de 40 kB de JS na home.

## O que NÃO fazer

- Não use embed do Instagram, vídeos do YouTube ou fontes do Google carregados direto: todos chamam
  servidores de terceiros na abertura da página. Isso fere a política atual e a CSP.
- Não salve nome, cidade ou pedido em servidor sem atualizar a política de privacidade e sem revisão
  jurídica.
