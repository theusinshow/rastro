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
| `src/lib/supabase/` | nada do projeto | `domain`, componentes |
| `src/lib/data/` | `domain`, `lib/supabase` | componentes |
| `src/lib/map/` | `domain` | componentes de página |
| `src/app/actions/` | `domain`, `lib` | componentes |
| `src/components/` | `domain`, `lib` | outros repositórios diretamente |

**Server Actions são a fronteira de escrita.** Validam com funções puras do
domínio, chamam os repositórios e revalidam. Nenhuma regra de negócio vive nelas.

**Autorização é responsabilidade do banco.** Os repositórios não recebem
`userId` nem repetem `.eq('user_id', …)`: a RLS filtra por `auth.uid()`. Ver
[ADR 0008](./docs/decisions/0008-rls-como-fronteira-de-autorizacao.md) — e
`docs/VERIFICACAO-RLS.md` antes de alterar qualquer política.

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

A direção é **couro e instrumento**, registrada no
[ADR 0009](./docs/decisions/0009-direcao-visual-couro-e-instrumento.md).

**Proibido:** card com conteúdo primário, gradientes, glassmorphism decorativo,
ícones sem função, dashboards de widgets, sombras difusas, grade de botões de
peso idêntico, toast, tooltip só de hover, skeleton, modal.

**Única exceção de ícone:** a navegação principal, sempre com rótulo ao lado, com
glifos desenhados em `src/components/layout/nav-icons.tsx`. Ver
[ADR 0011](./docs/decisions/0011-icones-na-navegacao-principal.md). Glifo em
qualquer outro lugar continua proibido.

**Obrigatório:** separação por hairlines de 1px, raio escolhido na escala e
proporcional ao elemento, mapa como estrutura (nunca dentro de um card), todo
dado numérico em fonte mono, acento âmbar de instrumento, piso de corpo de 17px.

**O mapa não lê variável CSS.** MapLibre desenha em WebGL: as cores de
`src/lib/map/style.ts` e `layers.ts` são hex literal e espelham a paleta à mão.
Mudar uma sem a outra faz a interface e o mapa divergirem.

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
