# Como editar os produtos

Todos os produtos ficam num arquivo só: **`src/data/produtos.json`**.
As categorias ficam em **`src/data/categorias.json`**.

Você não precisa saber programar. Se algo for digitado errado, **o site não vai ao ar
quebrado**: o build para e mostra uma mensagem dizendo o produto, o campo e o que corrigir.

> **Dica:** abra o projeto no VS Code e rode `npm run dev` uma vez. Depois disso, ao editar o
> `produtos.json`, o VS Code sublinha erros em vermelho e sugere os nomes dos campos
> enquanto você digita (Ctrl + Espaço).

---

## 1. Regras básicas do arquivo

O arquivo é uma **lista** (começa com `[` e termina com `]`). Cada produto fica entre `{ }`,
separado do próximo por **vírgula**.

```json
[
  { ...produto 1... },
  { ...produto 2... }
]
```

As 5 regras que mais evitam erro:

1. **Textos entre aspas duplas**: `"nome": "Boné Conexão"`. Nunca aspas simples (`'`).
2. **Números sem aspas e com ponto**: `"precoBase": 59.90`. Nunca `"59,90"`.
3. **Sim/não sem aspas**: `true` ou `false`.
4. **Vírgula entre campos**, mas **nunca depois do último** campo antes de `}` ou `]`.
5. Os nomes dos campos são exatos: `precoBase` ≠ `precobase` ≠ `preço`.

---

## 2. O que é cada campo

| Campo            | Obrigatório? | O que é                                                                             | Exemplo                                |
| ---------------- | ------------ | ----------------------------------------------------------------------------------- | -------------------------------------- |
| `id`             | sim          | Identificador fixo. **Nunca mude** depois de publicado (carrinhos e fotos usam ele) | `"bone-conexao"`                       |
| `slug`           | sim          | Endereço da página: `/produto/<slug>`                                               | `"bone-conexao-capixaba"`              |
| `nome`           | sim          | Nome que aparece no site (até 80 letras)                                            | `"Boné Conexão Capixaba"`              |
| `categoria`      | sim          | Uma de: `polo`, `camisetas`, `moletons`, `bones`, `adesivos`                        | `"bones"`                              |
| `descricaoCurta` | sim          | Frase do cartão na loja (até 140 letras; ideal até 120)                             | `"Ajustável, com a logo em destaque."` |
| `descricao`      | sim          | Texto da página do produto. Uma lista: cada item é um parágrafo                     | `["Parágrafo 1.", "Parágrafo 2."]`     |
| `precoBase`      | sim          | Preço em reais, com ponto                                                           | `59.90`                                |
| `precoDe`        | não          | Preço antigo, riscado (promoção). Precisa ser maior que o preço                     | `79.90`                                |
| `ativo`          | sim          | `true` aparece no site; `false` esconde sem apagar                                  | `true`                                 |
| `destaque`       | não          | `true` aparece em "Destaques" na página inicial                                     | `true`                                 |
| `novo`           | não          | `true` mostra o selo amarelo "NOVO"                                                 | `true`                                 |
| `ordem`          | não          | Posição na loja (1 aparece primeiro)                                                | `3`                                    |
| `opcoes`         | não          | Tamanhos, cores, modelos. Vazio `[]` = produto sem variação                         | ver seção 5                            |
| `variacoes`      | não          | Só para exceções de preço ou estoque                                                | ver seção 6                            |
| `fotos`          | não          | Preenchido automaticamente pelo comando `/fotos`. Não edite à mão                   | `[]`                                   |
| `cuidados`       | não          | Lista de cuidados com a peça                                                        | `["Lavar do avesso"]`                  |
| `tags`           | não          | Palavras extras para a busca da loja                                                | `["boné", "sol"]`                      |
| `_notas`         | não          | Anotações suas (TODO). O site ignora                                                | `"TODO: confirmar cores"`              |

**`id` e `slug`:** só letras minúsculas sem acento, números e hífen. Ex.: `camiseta-rei-da-estrada`.
Cada produto precisa de `id` e `slug` diferentes de todos os outros.

---

## 3. Adicionar um produto

Copie este modelo, cole **antes do `]` final** e coloque uma vírgula depois do `}` do produto
anterior.

```json
{
  "id": "camiseta-exemplo",
  "slug": "camiseta-exemplo",
  "nome": "Camiseta Exemplo",
  "categoria": "camisetas",
  "descricaoCurta": "Frase curta que aparece no cartão da loja.",
  "descricao": ["Primeiro parágrafo da página do produto.", "Segundo parágrafo."],
  "precoBase": 79.9,
  "ativo": true,
  "opcoes": [{ "nome": "Tamanho", "valores": ["P", "M", "G", "GG"] }]
}
```

> Atalho: no Claude Code, digite **`/novo-produto`** e responda às perguntas. Ele gera o
> `id`/`slug`, adiciona ao arquivo e confere se está tudo certo.

---

## 4. Tarefas comuns

### Mudar o preço

Troque o número de `precoBase`. Sempre com ponto: `"precoBase": 89.90`.

### Esconder um produto (sem apagar)

`"ativo": false`. Ele some da loja, da busca e da página inicial. Quem já tinha ele no
carrinho recebe um aviso e o item sai do carrinho.

### Colocar em promoção

Adicione `precoDe` com o preço antigo e baixe o `precoBase`:

```json
    "precoBase": 99.90,
    "precoDe": 129.90,
```

Para tirar a promoção, **apague a linha `precoDe`** e volte o `precoBase`.

### Marcar como destaque ou novidade

`"destaque": true` (vai para a página inicial) e/ou `"novo": true` (selo "NOVO").

---

## 5. Tamanhos, cores e outras opções

Cada opção tem um `nome` e uma lista de `valores`. A ordem dos valores é a ordem em que
aparecem no site.

```json
    "opcoes": [
      { "nome": "Tamanho", "valores": ["P", "M", "G", "GG", "XG"] },
      { "nome": "Cor", "valores": ["Preta", "Branca", "Azul"] }
    ]
```

- **Adicionar um tamanho:** inclua na lista, ex.: `"XG"` depois de `"GG"`.
- **Produto sem opção** (adesivo, por exemplo): `"opcoes": []`.
- Se o produto tem opções, o cliente **precisa escolher** antes de pedir: o botão mostra
  "Escolha o tamanho" até ele escolher.

---

## 6. Exceções: preço diferente ou esgotado

Use `variacoes` **só** quando uma combinação foge do padrão. Tudo o que não estiver aqui usa o
`precoBase` e está disponível.

```json
    "variacoes": [
      { "combinacao": { "Tamanho": "GG" }, "preco": 139.90 },
      { "combinacao": { "Tamanho": "P", "Cor": "Branca" }, "disponivel": false }
    ]
```

Lendo o exemplo:

- **GG custa R$ 139,90 em qualquer cor** (a combinação só cita o tamanho).
- **P Branca está esgotada.** No site ela aparece riscada e não pode ser escolhida; as outras
  cores do P continuam disponíveis.

Regras:

- Os nomes e valores da `combinacao` têm que ser **iguais** aos de `opcoes` (inclusive
  maiúsculas e acentos).
- Quando duas exceções valem para a mesma peça, vence a **mais específica** (a que cita mais
  opções). Ex.: `{ "Tamanho": "GG" }` com preço 139.90 e `{ "Tamanho": "GG", "Cor": "Preta" }`
  com preço 149.90 → GG Preta custa 149,90; GG das outras cores, 139,90.
- Se duas exceções igualmente específicas dão preços diferentes para a mesma peça, o build
  avisa e pede para você criar uma mais específica que desempate.
- **Esgotou tudo?** Prefira `"ativo": false`, ou marque cada combinação com `"disponivel": false`.

---

## 7. Categorias

Em `src/data/categorias.json`. Cada categoria tem:

| Campo                   | O que é                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `id`                    | Também é o endereço: `/loja/<id>`. Não mude depois de publicado            |
| `nome` / `nomeSingular` | "Camisetas" / "Camiseta"                                                   |
| `cor`                   | Cor da placa: `vermelha`, `verde`, `azul`, `amarela` ou `branca`           |
| `icone`                 | Desenho do placeholder: `polo`, `camiseta`, `moletom`, `bone` ou `adesivo` |
| `ordem`                 | Posição (1 primeiro). Não pode repetir                                     |
| `descricao`             | Frase da categoria (até 200 letras)                                        |

Ao criar uma categoria nova, o `id` dela passa a valer automaticamente no campo `categoria`
dos produtos.

---

## 8. Erros comuns e o que significam

A mensagem do build sempre começa dizendo **qual produto** (pelo `id`) e **qual campo**.

| Mensagem (resumo)                                    | Causa                                                                       | Como corrigir                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| `O arquivo não é um JSON válido — linha X, coluna Y` | Erro de digitação na estrutura                                              | Vá à linha indicada. A seta `^` mostra o ponto exato |
| `vírgula sobrando antes de "}" ou "]"`               | Vírgula depois do último campo                                              | Apague a vírgula                                     |
| `falta uma vírgula no fim da linha anterior`         | Esqueceu a vírgula entre dois campos                                        | Coloque a vírgula no fim da linha de cima            |
| `Há duas vírgulas seguidas`                          | `,,`                                                                        | Apague uma                                           |
| `Use aspas duplas`                                   | Usou `'texto'`                                                              | Troque por `"texto"`                                 |
| `deve ser um número sem aspas, com ponto`            | `"precoBase": "79,90"`                                                      | Escreva `"precoBase": 79.90`                         |
| `tem mais de 2 casas decimais`                       | `79.999`                                                                    | Use no máximo 2: `79.99`                             |
| `deve ser maior que zero`                            | Preço `0` ou negativo                                                       | Corrija o preço                                      |
| `"categoria" deve ser uma destas: …`                 | Categoria escrita errado (`"bone"` em vez de `"bones"`)                     | Use exatamente um dos nomes listados                 |
| `Campo desconhecido: "Destaque"`                     | Nome de campo com grafia diferente                                          | Confira na tabela da seção 2                         |
| `"ativo" é obrigatório`                              | Faltou o campo `ativo`                                                      | Adicione `"ativo": true`                             |
| `deve ser true ou false (sem aspas)`                 | `"ativo": "true"`                                                           | Tire as aspas: `"ativo": true`                       |
| `só pode ter letras minúsculas sem acento…`          | `id`/`slug` com maiúscula, espaço ou acento                                 | Ex.: `camiseta-rei-da-estrada`                       |
| `"slug" repetido: … aparece em "A" e em "B"`         | Dois produtos com o mesmo endereço                                          | Mude o `slug` de um deles                            |
| `"id" repetido`                                      | Dois produtos com o mesmo `id`                                              | Mude o `id` do produto **novo** (nunca o do antigo)  |
| `"XG" não é um valor de "Tamanho"`                   | A exceção cita um valor que não está em `opcoes`                            | Adicione o valor em `opcoes` ou corrija a exceção    |
| `A opção "Tamaho" não existe`                        | Nome da opção digitado errado na `combinacao`                               | Use o mesmo nome de `opcoes`                         |
| `"precoDe" … precisa ser MAIOR que o preço atual`    | Promoção com preço antigo menor ou igual ao atual (inclusive das variações) | Aumente o `precoDe` ou apague a linha                |
| `Esta variação não muda nada`                        | Exceção sem `preco` nem `disponivel`                                        | Adicione um deles ou apague a exceção                |
| `passou de N caracteres`                             | Texto longo demais                                                          | Encurte                                              |

Depois de corrigir, rode de novo `npm run build` (ou salve o arquivo com o `npm run dev`
aberto) para confirmar.
