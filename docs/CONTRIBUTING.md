# Como contribuir com o Rastro

Este documento é o resumo prático de `CLAUDE.md` para quem vai abrir um PR ou
fazer um commit. Em caso de conflito entre os dois, `CLAUDE.md` é a fonte
oficial.

---

## Regra primordial: o CHANGELOG

**Todo commit exige uma entrada correspondente em `CHANGELOG.md`.** Não há
exceção para "mudança pequena", "só um ajuste", "só documentação" ou "só um
typo". Se a alteração merece um commit, ela merece uma linha no changelog.
Commitar sem tocar em `CHANGELOG.md` é trabalho incompleto e deve ser
corrigido antes de seguir adiante.

O fluxo obrigatório, nesta ordem exata:

1. Fazer a alteração.
2. Rodar `npm run lint` e `npm run typecheck` — ambos limpos.
3. Escrever a entrada em `CHANGELOG.md` sob `## [Não lançado]`.
4. `git add`, incluindo `CHANGELOG.md`.
5. `git commit`.

### Formato da entrada

Seguimos [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Categorias, sempre em PT-BR: `Adicionado`, `Alterado`, `Corrigido`,
`Removido`, `Descontinuado`, `Segurança`.

```markdown
## [Não lançado]

### Adicionado
- Painel lateral de lugar com ações contextuais

### Alterado
- Pins passam a codificar favorito como anel externo em vez de cor
```

Escreva a entrada para quem vai ler daqui a seis meses: o que mudou do ponto
de vista de quem usa o produto, não o nome do arquivo que você editou.

---

## Definição de concluído

Uma etapa só está concluída quando:

- [ ] `npm run lint` passa sem warnings (`--max-warnings=0`)
- [ ] `npm run typecheck` passa (`tsc --noEmit`)
- [ ] `npm test` passa (Vitest, camada de domínio)
- [ ] `CHANGELOG.md` atualizado
- [ ] A aplicação continua rodando (`npm run dev` sem erro em console)
- [ ] Nenhum `any` novo, nenhum `@ts-ignore` novo, nenhum `console.log`
      esquecido

Não relate uma etapa como pronta sem ter executado os comandos. Cole a saída
real quando houver dúvida.

---

## Convenção de mensagem de commit

Prefixo em inglês, minúsculo, seguido de dois-pontos e uma descrição curta em
português, no imperativo:

- `feat:` — funcionalidade nova
- `fix:` — correção de bug
- `chore:` — manutenção sem impacto de produto (dependências, configuração)
- `docs:` — documentação
- `refactor:` — mudança de estrutura interna sem mudança de comportamento

Exemplos reais do histórico do projeto: `docs: arquitetura, roadmap e
briefings de skills`, `feat: painel lateral do lugar`.

---

## Quando escrever um ADR

Escreva um ADR (`docs/decisions/NNNN-titulo-curto.md`) sempre que uma decisão:

- rejeitar uma alternativa óbvia por um motivo não trivial (ex.: por que
  `maplibre-gl` v5 e não v6, por que não PostGIS ainda);
- fixar um comportamento que alguém, lendo só o código, tentaria "consertar"
  mais tarde (ex.: `router.replace` em vez de `push`, o anel de favorito em
  osso e não âmbar);
- estabelecer um padrão estrutural que o resto do projeto vai seguir (ex.: o
  mapa persistente no layout, o estado de filtros na URL).

Modelo de quatro seções, sempre nesta ordem:

1. **Contexto** — o problema, sem ainda revelar a decisão.
2. **Decisão** — o que foi escolhido, em termos concretos e verificáveis.
3. **Consequências** — o que se ganha e o que se aceita perder, sem esconder
   o lado ruim da escolha.
4. **Alternativas recusadas** — o que foi considerado e por que não foi
   escolhido. Uma decisão sem alternativa recusada geralmente significa que
   a alternativa não foi levada a sério.

**Nunca altere uma decisão registrada em silêncio.** Se um ADR existente
parecer errado, levante o ponto, explique o motivo, e só então mude —
registrando um novo ADR que substitui o anterior. Mudança calada de
arquitetura é o pior resultado possível neste repositório.

---

## Dependências

Antes de instalar qualquer dependência relevante, verifique se ela é
realmente necessária. Este projeto prefere ~80 linhas de código próprio a um
wrapper. Recusados deliberadamente até aqui: `react-map-gl`, bibliotecas de
estado global, bibliotecas de data (ver
[ADR 0001](./decisions/0001-stack-e-limite-de-dependencias.md)).

Se for instalar algo relevante mesmo assim, justifique no commit/PR — o
motivo pelo qual ~80 linhas próprias não bastam desta vez — e considere
registrar um ADR se a decisão for estrutural o suficiente para alguém
questionar depois.

---

## Camadas e estilo de código

Ver `CLAUDE.md` para a tabela completa de camadas e a direção visual
não-negociável. Resumo:

- `src/domain/` nunca importa React, Next, componentes ou dados.
- `src/lib/data/` importa `domain`, nunca componentes.
- Componente visual não calcula distância, não filtra, não ordena — isso é
  domínio.
- TypeScript `strict`, sem `any` desnecessário; textos de interface em
  PT-BR, identificadores em inglês.
- Antes de trabalho visual relevante, leia `docs/skills/README.md`.
