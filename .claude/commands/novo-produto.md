---
description: Cadastra um produto novo no produtos.json fazendo perguntas simples e valida com o build
---

Você vai adicionar um produto novo em `src/data/produtos.json`. Fale em português, de forma simples
(o usuário não é programador). Siga o guia `docs/COMO-EDITAR-PRODUTOS.md` e o schema em
`src/lib/catalogo/schema.ts`.

## 1. Perguntas

Pergunte (de uma vez, numa lista curta). Se o usuário já deu alguma resposta na mensagem, não repita:

1. **Nome** do produto (como aparece no site).
2. **Categoria**: mostre as opções lendo `src/data/categorias.json` (ex.: polo, camisetas, moletons,
   bones, adesivos).
3. **Preço** em reais. Se estiver em promoção, o **preço antigo** também.
4. **Opções**: tem tamanho? Quais (ex.: P, M, G, GG)? Tem cor? Quais? Outra opção (modelo)?
5. Alguma combinação com **preço diferente** ou **esgotada**? (ex.: GG custa mais)
6. **Descrição curta** (uma frase, até ~120 caracteres) e **descrição** (1 a 3 parágrafos).
   Se o usuário não quiser escrever, proponha um texto com base no nome, **sem inventar características
   técnicas** (tecido, gramatura, medidas). O que faltar vira `_notas` com "TODO: ...".
7. Já aparece como **destaque** na página inicial? É **novidade** (selo NOVO)?

## 2. Gerar

- `id`: em kebab-case, curto e estável (ex.: `camiseta-motor-diesel`). Confira que não existe outro igual.
- `slug`: a partir do nome completo (ex.: `camiseta-motor-diesel`). Também precisa ser único.
- Preços com ponto: `79.90`. `"ativo": true`. `"fotos": []`. `ordem`: depois do último da categoria.
- Variações só para exceções, usando exatamente os nomes e valores de `opcoes`.
- Mostre o JSON do produto para o usuário e **peça confirmação** antes de gravar.

## 3. Gravar e validar

- Adicione o produto **antes do `]` final**, com vírgula depois do produto anterior, mantendo a
  formatação do arquivo.
- Rode `npm run build`. Se der erro, explique em linguagem simples e corrija.
- Rode `npm test`.
- Diga como o produto ficou: `/produto/<slug>` e em qual categoria.

## 4. Próximos passos

- Lembre que as fotos entram com `/fotos` (nomes `<id>__1.jpg`, `<id>__<cor>__1.jpg` em `fotos-brutas/`).
- Liste os `TODO` que ficaram em `_notas`.
- Sugira o commit (não faça sem o usuário pedir):

```
git add src/data/produtos.json
git commit -m "feat: adiciona produto <nome>"
```
