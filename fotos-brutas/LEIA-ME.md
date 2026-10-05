# Fotos brutas

Coloque aqui as fotos originais dos produtos (do celular ou da câmera). Esta pasta **não vai para o
GitHub**: as fotos podem conter dados pessoais escondidos, como a localização GPS.

Depois rode `npm run fotos`, ou digite `/fotos` no Claude Code.

## Como nomear

```
<id-do-produto>__<numero>.jpg            → polo-conexao__1.jpg
<id-do-produto>__<cor>__<numero>.jpg     → polo-conexao__preta__1.jpg
```

- **Dois sublinhados** (`__`) separam as partes.
- O **id** é o campo `"id"` do produto em `src/data/produtos.json` (ex.: `camiseta-rei-da-estrada`).
- A **cor** precisa ser uma das cores do produto (`Preta`, `Branca`…). Maiúsculas e acentos não importam.
- O **número 1 é a foto principal**. Use 2, 3, 4… para as outras.
- Fotos com cor aparecem quando o cliente escolhe aquela cor no site.
- Formatos aceitos: `.jpg`, `.jpeg`, `.png`, `.webp` e `.heic`.
  - HEIC (padrão do iPhone) pode não funcionar neste computador. Se o relatório avisar, converta
    para JPG ou, no iPhone, use **Ajustes > Câmera > Formatos > Mais Compatível**.

## O que o processamento faz

1. Confere se o produto e a cor existem. Se o nome não bater, a foto é **ignorada** e o relatório
   sugere o nome certo. Nada é adivinhado em silêncio.
2. Corrige a rotação, **remove todos os metadados (inclusive GPS)**, recorta em 4:5 sem distorcer e
   reduz para no máximo 1280 × 1600 px, em WebP.
3. Salva em `src/assets/produtos/<id>/` e atualiza o campo `fotos` do produto.
4. Move o original para `fotos-brutas/_processadas/` (não apaga nada).

Rodar de novo não duplica fotos. Para trocar uma foto, coloque outra com o mesmo nome e rode de novo.

Fotos boas: fundo limpo, luz natural, peça inteira na foto, de preferência na vertical.
