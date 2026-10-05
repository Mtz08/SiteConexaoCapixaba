---
description: Processa as fotos de fotos-brutas/ (renomeia com confirmação, otimiza, remove GPS e atualiza o catálogo)
---

Você vai processar as fotos de produtos que estão em `fotos-brutas/`. Siga os passos **em ordem**
e fale com o usuário em português, de forma simples (ele não é programador).

Convenção de nomes (detalhes em `fotos-brutas/LEIA-ME.md`):

```
<id-do-produto>__<numero>.jpg            → polo-conexao__1.jpg
<id-do-produto>__<cor>__<numero>.jpg     → polo-conexao__preta__1.jpg
```

## 1. Ver o que chegou

- Liste os arquivos de `fotos-brutas/` (ignore `LEIA-ME.md` e a pasta `_processadas/`).
- Se a pasta estiver vazia, diga isso, explique a convenção em duas linhas e pare.
- Leia `src/data/produtos.json` para conhecer os `id`, os nomes e as cores (`opcoes` com `"nome": "Cor"`).
- Rode `npm run fotos -- --verificar` e leia o relatório (ele não altera nada).

## 2. Nomes fora da convenção → olhar as imagens e perguntar

Para cada arquivo que o relatório marcar como ignorado por nome, produto ou cor:

- **Abra a imagem** (ferramenta Read) e identifique o produto e, se houver, a cor.
- Monte uma tabela para o usuário:

  | Arquivo atual | Produto proposto (id) | Cor | Nº  | Novo nome |
  | ------------- | --------------------- | --- | --- | --------- |

- O número 1 é a foto principal; numere as demais na ordem que fizer sentido (frente, costas, detalhe).
- Se não der para identificar com segurança, escreva "não sei" e pergunte. **Nunca adivinhe em silêncio.**
- **Peça confirmação** antes de renomear. Só renomeie (dentro de `fotos-brutas/`) o que o usuário aprovar.
- Se a foto for de um produto que não existe no catálogo, sugira usar `/novo-produto` primeiro.

## 3. Processar

- Rode `npm run fotos`.
- O script remove os metadados (inclusive GPS), corrige a rotação, recorta em 4:5, salva em WebP em
  `src/assets/produtos/<id>/`, atualiza o campo `fotos` no `produtos.json` e move os originais para
  `fotos-brutas/_processadas/`.

## 4. Conferir

- Rode `npm run build`. Se falhar, mostre o erro e corrija antes de seguir.
- Rode `npm test`.

## 5. Relatório para o usuário

- Quais fotos entraram (produto e cor), quais foram ignoradas e por quê.
- Quais produtos ativos continuam **sem foto** (o relatório do script lista).
- Lembre que os originais estão em `fotos-brutas/_processadas/` (fora do git) e podem ser apagados quando
  quiser.

## 6. Commit

Sugira o commit (não faça sem o usuário pedir):

```
git add src/assets/produtos src/data/produtos.json
git commit -m "feat: adiciona fotos de <produtos>"
```

Nunca adicione `fotos-brutas/` ao git.
