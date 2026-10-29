# Attack Shark X3 Studio — Design System

## Direção

O Studio deve parecer um instrumento de precisão, não um painel gamer genérico. A identidade combina superfícies de policarbonato, grafite azulado e um azul frio inspirado no indicador óptico do mouse. O elemento memorável é a representação técnica do X3; o restante da interface permanece silencioso e funcional.

O resultado automático da pesquisa UI/UX sugeriu neon roxo, tipografia de e-sports e 3D pesado. Essa direção foi deliberadamente descartada porque conflita com o briefing minimalista premium, aumenta o consumo de recursos e aproxima o produto de interfaces gamer estereotipadas.

## Tokens principais

| Papel | Claro | Escuro |
| --- | --- | --- |
| Fundo | `#F3F6F8` | `#10161D` |
| Superfície | `#FFFFFF` | `#18212B` |
| Superfície elevada | `#F8FAFB` | `#202B36` |
| Texto | `#15202B` | `#F1F5F8` |
| Texto secundário | `#607080` | `#A6B4C2` |
| Divisor | `#DDE5EB` | `#33414F` |
| Acento | `#2768A2` | `#78B7E9` |
| Acento suave | `#E8F1F8` | `#213A50` |
| Sucesso | `#2F7D5B` | `#6AC49A` |
| Atenção | `#9B651F` | `#E5B462` |
| Erro | `#B43C45` | `#FF8B92` |

## Tipografia

- Títulos e números técnicos: `Bahnschrift`, com alternativas `DIN Alternate` e `Segoe UI Variable`.
- Interface e texto: `Segoe UI Variable`, com alternativa `Segoe UI`.
- Escala: 12, 13, 14, 16, 20, 28 e 36 px.
- Sentenças e rótulos em caixa normal. Caixa alta apenas no wordmark existente.

## Layout

```text
┌──────────────┬────────────────────────────────────────────────────┐
│ Marca        │ contexto                         status · idioma   │
│              ├────────────────────────────────────────────────────┤
│ Navegação    │ título e explicação curta                         │
│              │                                                    │
│              │ painel principal de configuração + contexto visual │
│              │                                                    │
│ Dispositivo  │ ações e estado seguro                              │
└──────────────┴────────────────────────────────────────────────────┘
```

- Barra lateral fixa no desktop e compacta em janelas estreitas.
- Conteúdo alinhado à esquerda, largura máxima de 1180 px e ritmo de 4/8 px.
- Controles agrupados por efeito no dispositivo, sem mosaicos decorativos repetitivos.

## Componentes e interação

- Ícones Lucide com traço de 1,75 px; nenhum emoji estrutural.
- Alvos interativos com pelo menos 36 px no desktop e foco visível de 2 px.
- Controles nativos sempre que possível; nomes acessíveis e rótulos visíveis.
- Pressão em botões: `scale(.98)` por 120 ms. Transições de estado: 160–220 ms.
- Nunca animar navegação por teclado. Respeitar `prefers-reduced-motion`.
- Estado não validado nunca pode parecer conectado ou aplicado ao dispositivo.

## Internacionalização

- Português do Brasil é o idioma padrão e usa termos técnicos consagrados, com a sigla internacional quando ela ajuda: “Taxa de leitura (polling rate)” e “Distância de levantamento (LOD)”.
- A troca de idioma é imediata e não exige reiniciar.
- Textos devem suportar expansão de 35% sem truncar controles essenciais.

## Segurança funcional

- Enquanto a camada HID não estiver validada, controles de desempenho operam apenas como prévia local.
- A ação de aplicar ao dispositivo permanece bloqueada e explica o motivo.
- Nenhum estado visual pode afirmar que uma configuração foi gravada sem confirmação de leitura posterior do dispositivo.
