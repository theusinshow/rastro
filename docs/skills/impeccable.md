# Briefing — `/impeccable` no Rastro

Cole este arquivo inteiro junto do pedido ao invocar `/impeccable` sobre
qualquer tela do Rastro. Ele existe para que a revisão seja sobre este
produto especificamente, não sobre interface em geral.

## O produto em uma frase

O mapa é a memória visual da vida do motociclista. O Google Maps responde
"como chego lá?"; o Rastro responde "para onde eu vou?".

## Restrições invioláveis

- **O mapa é estrutura, nunca conteúdo de card.** Ele não vive dentro de uma
  caixa pequena — ocupa a área da aplicação e as telas são camadas de leitura
  sobre ele (ver ADR 0002).
- **Raio máximo `2px`** (`--radius-xs`) em todo o produto. Nada é
  arredondado por decoração.
- **Nenhuma sombra difusa.** Separação entre regiões é sempre hairline de
  1px (`--color-line` ou `--color-line-strong`), nunca `box-shadow` com blur.
- **Nenhum card contendo conteúdo primário.**
- **Todo dado numérico usa `.instrument-value`** — distância, coordenada,
  duração, zoom, contagem. Texto comum (nomes, descrições) nunca usa esta
  classe.
- **Âmbar `#f0a32b` é exclusivo da interface e dos pins**, nunca da base do
  mapa. Nenhuma cor de camada de base (água, vegetação, estradas) pode
  disputar esse tom.
- **Blur apenas por legibilidade sobre o mapa** (`backdrop-blur-sm` em
  `TopBar` e `OverlayPanel`, por exemplo) — nunca como efeito decorativo de
  glassmorphism.

## Vocabulário visual

Navegação, cartas topográficas, instrumentos de viagem, expedição, GPS
outdoor, interfaces automotivas premium. A statusbar inferior em mono
(`StatusBar`, com coordenadas, zoom e contagem de lugares) é o elemento
âncora dessa leitura — é o painel de instrumento do produto.

## O que já está decidido e não deve ser reaberto

- **Os três canais visuais do pin** — cor do miolo para status de visita,
  anel externo para favorito, ponto satélite para fotos — cada um
  independente, nenhum reduzido a uma única cor por pin
  ([ADR 0005](../decisions/0005-pins-como-camadas-data-driven.md)).
- **O painel contextual lateral** (`OverlayPanel` + `PlacePanel`) no lugar de
  modal central. Selecionar um lugar não interrompe a visão do mapa.
- **O mapa persistente no layout**, montado uma única vez em
  `(app)/layout.tsx`
  ([ADR 0002](../decisions/0002-mapa-persistente-no-layout.md)).
- **A paleta e os tokens** de `docs/DESIGN-SYSTEM.md` — void, base, raised,
  overlay; ink, ink-muted, ink-faint; accent âmbar; visited/wanted/unvisited.

## O que ainda está aberto a crítica

- **Densidade e hierarquia dentro do painel do lugar** (`PlacePanel`) — a
  ordem faixa de foto → distância/tempo → status/data → descrição → tags →
  ações é a primeira tentativa, não uma decisão fechada.
- **A trilha de filtros à esquerda** (`FilterRail`) é hoje uma coluna fixa de
  232px; poderia ser colapsável.
- **O tratamento do estado vazio da descoberta** (`DiscoveryResults`, quando
  `results.length === 0`) é hoje só duas linhas de texto.
- **A ausência de transição ao abrir e fechar painéis** — `OverlayPanel`
  aparece e desaparece sem animação.
- **O comportamento em telas menores** — mobile ainda não tem navegação
  própria; `OverlayPanel` e `FilterRail` assumem largura de desktop fixa em
  pixels.

## Anti-padrões que já rejeitamos

Excesso de cards, gradientes aleatórios, glassmorphism decorativo,
arredondamento universal, ícones sem função (decorativos), dashboards de
widgets, sombras difusas. Sugerir qualquer um destes significa que este
briefing não foi lido — não é um sinal de que o produto deveria reconsiderar
a direção visual.
