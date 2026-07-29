# 0011 — Ícones na navegação principal

**Abre uma exceção** à regra *"ícone só quando substitui texto"*, registrada no
`CLAUDE.md` e em `docs/DESIGN-SYSTEM.md`. A regra continua valendo em todo o
resto do produto.

## Contexto

O Rastro nunca teve conjunto de ícones, e isso foi decisão: a auditoria de design
listou *"introduzir um conjunto de ícones"* entre os itens considerados e
rejeitados, com o argumento de que o produto é melhor sem eles e de que nenhum
caso aberto justificava um.

A navegação principal era texto em caixa alta com tracking largo — a mesma
gramática dos rótulos de instrumento. Funciona, e tem dois custos medidos:

1. **Não cabe.** Quatro destinos em caixa alta com `0.12em` de tracking somam mais
   de 440px. Numa barra de 366px no celular, "Descobrir" saía cortado no meio da
   palavra, e "Memórias" ficava atrás de rolagem horizontal sem afordância.
2. **Compete com o dado.** Caixa alta e tracking largo são o vocabulário que o
   produto reserva para medição — coordenada, distância, contagem. Gastá-lo
   também na navegação enfraquece a leitura de instrumento onde ela importa.

## Decisão

**A navegação principal usa ícone mais rótulo em caixa normal.** Os quatro
destinos ganham um glifo próprio, desenhado à mão, e o rótulo perde a caixa alta
e o tracking.

Condições que tornam isto uma exceção estreita, e não o fim da regra:

- **Só a navegação principal.** Nenhum outro lugar do produto ganha ícone.
- **Sempre com rótulo ao lado.** Ícone sozinho não identifica destino para quem
  chega, e a convenção de navegação exige os dois.
- **Desenhados aqui**, em `src/components/layout/nav-icons.tsx`, com o mesmo
  traço da marca: `stroke` de 1.75, pontas arredondadas, sem preenchimento.
  Nenhuma biblioteca entra — `lucide-react` custaria uma dependência para quatro
  glifos, e o `ADR 0001` já recusa esse tipo de troca.
- **O ícone de Viagens é a curva da marca.** A perna do R é uma estrada; o glifo
  repete esse gesto. Ele não é decoração ao lado do rótulo: é a única peça do
  produto que amarra navegação e identidade.

## Motivos

- **Ícone com rótulo é mais estreito que caixa alta com tracking.** Um glifo de
  18px mais "Viagens" em caixa normal ocupa menos que "VIAGENS" espaçado. A
  navegação passa a caber, que era o problema concreto.
- **Devolve a caixa alta ao instrumento.** Com a navegação em caixa normal, o
  vocabulário de medição volta a ser exclusivo do que mede.
- **O ativo deixa de depender de cor.** Passa a ser pílula preenchida — diferença
  de forma, não só de tom, o que atende à regra de não usar cor sozinha melhor do
  que o traço fazia.

## Consequências

- Quatro glifos passam a existir e precisam ser mantidos coerentes entre si:
  mesma espessura, mesma caixa óptica, mesmas pontas.
- Um destino novo na navegação passa a exigir um glifo novo. É custo real, e é o
  freio que mantém a navegação curta.
- A regra geral **não muda**: fora da navegação principal, ícone continua entrando
  só quando substitui texto.

## Gatilho de revisão

Se os glifos começarem a aparecer fora da navegação — em botões, em rótulos de
seção, ao lado de texto que já diz a mesma coisa —, a exceção virou regra por
descuido, e é hora de reverter em vez de continuar abrindo casos.
