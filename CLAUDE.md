# CLAUDE.md — Rastro

Instruções operacionais para agentes trabalhando neste repositório.

---

## ⚠️ REGRA PRIMORDIAL — CHANGELOG

**Todo commit exige uma entrada correspondente em `CHANGELOG.md`.**

Não existe exceção para "mudança pequena", "só um ajuste", "só documentação" ou
"só um typo". Se a alteração merece um commit, ela merece uma linha no changelog.

O fluxo obrigatório, nesta ordem:

1. Fazer a alteração
2. Rodar `npm run lint` e `npm run typecheck` — ambos limpos
3. **Escrever a entrada em `CHANGELOG.md` sob `## [Não lançado]`**
4. `git add` incluindo `CHANGELOG.md`
5. `git commit`

Commitar sem tocar no `CHANGELOG.md` é considerado trabalho incompleto e deve ser
corrigido antes de seguir adiante.

### Formato

Seguimos [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Categorias: `Adicionado`, `Alterado`, `Corrigido`, `Removido`, `Descontinuado`,
`Segurança`.

```markdown
## [Não lançado]

### Adicionado
- Painel lateral de lugar com ações contextuais

### Alterado
- Pins passam a codificar favorito como anel externo em vez de cor
```

Escreva a entrada para quem vai ler daqui a seis meses: o que mudou do ponto de
vista de quem usa o produto, não o nome do arquivo que você editou.

---

## Definição de concluído

Uma etapa só está concluída quando:

- [ ] `npm run lint` passa sem warnings
- [ ] `npm run typecheck` passa
- [ ] `CHANGELOG.md` atualizado
- [ ] A aplicação continua rodando (`npm run dev` sem erro em console)
- [ ] Nenhum `any` novo, nenhum `@ts-ignore` novo, nenhum `console.log` esquecido

Não relate uma etapa como pronta sem ter executado os comandos. Cole a saída real
quando houver dúvida.

---

## Decisões arquiteturais

**Nunca altere uma decisão arquitetural em silêncio.**

Se você concluir que uma decisão registrada em `docs/decisions/` está errada:
levante o ponto, explique o motivo, e só então mude — registrando um novo ADR que
substitui o anterior. Mudanças caladas de arquitetura são o pior resultado
possível deste repositório.

Decisões vigentes em `docs/decisions/`. Leia antes de propor mudanças estruturais.

---

## Dependências

Antes de instalar qualquer dependência relevante, verifique se ela é realmente
necessária. Este projeto prefere ~80 linhas de código próprio a um wrapper.

Já recusamos deliberadamente: `react-map-gl`, bibliotecas de estado global,
bibliotecas de data. Se for instalar algo relevante, justifique no PR/commit e
considere um ADR.

---

## Camadas

Regra verificável por leitura de imports:

| Camada | Pode importar | Nunca importa |
|---|---|---|
| `src/domain/` | nada do projeto além de `domain` | React, Next, componentes, dados |
| `src/lib/data/` | `domain` | componentes |
| `src/lib/map/` | `domain` | componentes de página |
| `src/components/` | `domain`, `lib` | outros repositórios diretamente |

**Componente visual não contém lógica de negócio.** Não calcula distância, não
filtra, não ordena, não decide elegibilidade. Isso vive em `src/domain/` como
função pura e testável.

---

## Estilo de código

- TypeScript `strict`. Nenhum `any` desnecessário — prefira `unknown` + narrowing.
- Componentes pequenos. Um arquivo grande é sinal de responsabilidade demais.
- Nomes claros em inglês no código; textos de interface em PT-BR.
- Evite abstração prematura. Duplicar duas vezes é melhor que abstrair cedo errado.
- Sem comentário que apenas repete o código. Comente o *porquê*, não o *quê*.

---

## Direção visual — não negociável

Este produto não pode parecer template SaaS genérico nem "AI slop".

**Proibido:** excesso de cards, gradientes aleatórios, glassmorphism decorativo,
arredondamento universal, ícones sem função, dashboards de widgets, sombras difusas.

**Obrigatório:** raio máximo 2px, separação por hairlines de 1px, mapa como
estrutura (nunca dentro de um card pequeno), todo dado numérico em fonte mono,
acento âmbar de instrumento.

Detalhes em `docs/DESIGN-SYSTEM.md`. Antes de trabalho visual relevante, leia
`docs/skills/README.md` — há briefings prontos para invocar as skills de design com
o contexto do Rastro.

---

## Dados de desenvolvimento

Tudo em `src/mocks/` é dado de desenvolvimento. Coordenadas, distâncias e
avaliações **não são informação verificada** e não devem ser apresentadas como
tal ao usuário nem tratadas como reais em nenhuma decisão.

---

## Princípio do produto

Sempre que houver dúvida sobre escopo ou prioridade, volte a isto:

> O Google Maps responde *"como chego lá?"*.
> O Rastro responde *"para onde eu vou?"*, *"onde eu já estive?"*,
> *"o que ainda quero conhecer?"* e *"quais histórias ficaram dessas viagens?"*.
>
> O mapa é a memória visual da vida do motociclista.

Se uma funcionalidade proposta serve melhor ao Google Maps que ao Rastro, ela
provavelmente não pertence a este produto.
