# Cores e contraste

Todas as cores ficam em `src/styles/global.css` (bloco `:root`). Os contrastes abaixo foram
calculados pela fórmula do WCAG 2.2 (luminância relativa). Meta: **4,5:1** para texto normal,
**3:1** para texto grande (≥ 24 px, ou ≥ 18,66 px em negrito) e para bordas de controles.

## Ajustes feitos em relação ao protótipo

| Token                | Antes     | Agora     | Motivo                                                                                                                                                     |
| -------------------- | --------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--placa-verde`      | `#2e9e4f` | `#23803f` | Texto branco sobre o verde original dava 3,43:1 (reprova). Agora 4,96:1                                                                                    |
| `--whatsapp-tx`      | `#ffffff` | `#0d1117` | Texto branco sobre `#1faa59` dava 3,02:1 (reprova). Com texto asfalto: 6,27:1. A cor do botão foi mantida                                                  |
| `--placa-pare-claro` | —         | `#ff5a5f` | Novo. O vermelho `#e0262b` como **texto** sobre o asfalto dá 4,04:1 (reprova). Use `pare-claro` para texto vermelho; `pare` só como fundo com texto branco |
| `--borda-controle`   | —         | `#64707f` | Novo. Borda de campos, steppers e botões contornados precisa de 3:1 (WCAG 1.4.11)                                                                          |

## Tabela de combinações aprovadas

| Texto                      | Fundo                        | Contraste       |
| -------------------------- | ---------------------------- | --------------- |
| texto `#f2efe6`            | asfalto `#0d1117`            | 16,46:1         |
| texto `#f2efe6`            | asfalto-2 `#161c25`          | 14,89:1         |
| texto-mudo `#9aa4b0`       | asfalto `#0d1117`            | 7,49:1          |
| texto-mudo `#9aa4b0`       | asfalto-2 `#161c25`          | 6,77:1          |
| texto-mudo `#9aa4b0`       | asfalto-3 `#1d2530`          | 6,11:1          |
| branco                     | placa-pare `#e0262b`         | 4,69:1          |
| branco                     | placa-pare-2 `#c0392b`       | 5,44:1          |
| branco                     | placa-verde `#23803f`        | 4,96:1          |
| branco                     | placa-azul `#1f4fbf`         | 7,17:1          |
| asfalto                    | placa-amarela `#f5b700`      | 10,50:1         |
| asfalto                    | placa-branca `#e9e7e0`       | 15,29:1         |
| asfalto                    | whatsapp `#1faa59`           | 6,27:1          |
| asfalto                    | whatsapp-2 `#23bf64` (hover) | 7,85:1          |
| placa-amarela              | asfalto                      | 10,50:1         |
| placa-pare-claro `#ff5a5f` | asfalto / asfalto-2          | 6,20:1 / 5,61:1 |
| borda-controle `#64707f`   | asfalto / asfalto-2          | 3,75:1 / 3,40:1 |

## Regras

- **Verde WhatsApp (`--whatsapp`) só em botões e links que levam ao WhatsApp.** Nunca em outro lugar.
- Cor da categoria: aplique `data-cor="azul|vermelha|verde|amarela|branca"` no elemento. Isso
  define `--cor-placa`, `--cor-placa-2` e `--cor-placa-tx` (texto com contraste garantido).
  Não use `style="..."` inline: a CSP do site bloqueia.
- `--faixa` e `--faixa-2` são decorativas (divisórias). Para borda de controle, use `--borda-controle`.
