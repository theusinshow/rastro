# Entrar sem conta — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uma segunda porta na tela de entrada, que cria uma sessão anônima do Supabase e deixa a pessoa usar o Rastro inteiro sem conta — menos subir fotografia.

**Architecture:** `signInAnonymously()` cria um usuário real com `auth.uid()`, então middleware, repositórios e RLS ficam intocados. A única escrita fechada é a fotografia, barrada por duas políticas **restritivas** no banco; a interface apenas deixa de oferecer o que o banco vai recusar.

**Tech Stack:** Next 16 (App Router, Server Actions), React 19, Supabase (`@supabase/ssr`), PostgreSQL RLS, Vitest, Tailwind 4.

Spec: [`2026-08-01-entrar-sem-conta-design.md`](../specs/2026-08-01-entrar-sem-conta-design.md).

## Global Constraints

- **CHANGELOG:** o repositório exige entrada por commit (`CLAUDE.md`, regra primordial). Esta feature tem **uma** entrada, criada na Tarefa 1 sob `## [Não lançado]` → `### Adicionado`. Cada tarefa seguinte **estende essa mesma entrada** com sua linha, e inclui `CHANGELOG.md` no `git add`. Não criar oito bullets soltos.
- **Definição de concluído por tarefa:** `npm run lint` (zero warnings), `npm run typecheck`, `npm run test` — todos limpos antes do commit.
- Nenhum `any` novo, nenhum `@ts-ignore`, nenhum `console.log`.
- Textos de interface em **PT-BR**; nomes de código em **inglês**; identificadores SQL em português **sem acento**, como nas migrações existentes.
- **Proibido** (ADR 0016): gradiente decorativo, glassmorphism decorativo, ícone decorativo, toast, tooltip só de hover, skeleton, modal, número sem régua.
- Piso de corpo 17px, alvo de toque 44px.
- **Não** alterar `handle_new_user`. A spec §3.3 previa uma emenda; ela foi cortada — `display_name` não é renderizado em nenhum componente, e nulo ali não quebra nada. Ver Tarefa 1.
- Cuidado de vocabulário: em `docs/VERIFICACAO-RLS.md` a palavra **"anônimo"** já significa *requisição sem sessão nenhuma*. O conceito novo é **"visitante"**. Nunca usar "anônimo" para o visitante em documentação, ou os dois viram um só na cabeça de quem lê.

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `docs/decisions/0017-sessao-anonima-como-entrada-de-visitante.md` | **Criar.** A decisão: por que sessão anônima e não caminho sem sessão; por que a trava da foto é do banco |
| `supabase/migrations/0008_visitante.sql` | **Criar.** As duas políticas restritivas |
| `docs/VERIFICACAO-RLS.md` | **Modificar.** Bloco de verificação das duas políticas + SQL de faxina |
| `src/domain/guest.ts` | **Criar.** Tipo `Viewer` e o predicado `canUploadPhotos` |
| `src/domain/guest.test.ts` | **Criar.** Teste do predicado |
| `src/lib/data/session.ts` | **Criar.** `sessionContext()` movido de `index.ts` e memoizado por requisição |
| `src/lib/data/viewer.ts` | **Criar.** `getViewer()` — lê `is_anonymous` da sessão |
| `src/lib/data/index.ts` | **Modificar.** Passa a importar `sessionContext` de `session.ts` |
| `src/components/layout/viewer-context.tsx` | **Criar.** `ViewerProvider` / `useViewer` |
| `src/app/(app)/layout.tsx` | **Modificar.** Lê o viewer e embrulha a árvore |
| `src/app/entrar/actions.ts` | **Modificar.** `signInAsGuestAction` |
| `src/app/entrar/page.tsx` | **Modificar.** Segundo botão + mensagem de erro |
| `src/components/layout/TopBar.tsx` | **Modificar.** Esquina da sessão |
| `src/components/explore/PlacePhotos.tsx` | **Modificar.** Nota no lugar do controle de envio |

**Nota sobre testes:** o projeto tem Vitest apenas para `src/domain/` — não há teste de componente nem de RLS automatizado. TDD real acontece na Tarefa 3. As demais são verificadas por `lint` + `typecheck` + roteiro manual. Não invente um framework de teste novo para este trabalho.

---

### Tarefa 1: ADR 0017 e a entrada do CHANGELOG

Decisão arquitetural vem antes do código: `CLAUDE.md` proíbe mudar arquitetura em silêncio.

**Files:**
- Create: `docs/decisions/0017-sessao-anonima-como-entrada-de-visitante.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: nada.
- Produces: o número `0017`, citado nos comentários das Tarefas 2 e 3.

- [ ] **Step 1: Ler dois ADRs vizinhos para pegar o formato**

Ler `docs/decisions/0008-rls-como-fronteira-de-autorizacao.md` e `docs/decisions/0014-cliente-supabase-no-navegador.md`. O formato é `## Contexto` / `## Decisão` / `## Consequências`, em PT-BR, argumentando o *porquê*.

- [ ] **Step 2: Escrever o ADR**

Criar `docs/decisions/0017-sessao-anonima-como-entrada-de-visitante.md` cobrindo, nesta ordem:

**Contexto.** O produto precisa ser avaliado por outras pessoas, e exigir conta Google antes de qualquer olhada é um pedágio alto para quem só vai opinar. Toda autorização do Rastro é RLS por `auth.uid()` (ADR 0008) e `sessionContext()` lança sem usuário — um modo visitante *sem sessão* exigiria uma segunda implementação de cada leitura, e essa segunda ficaria fora da proteção do banco.

**Decisão.** `supabase.auth.signInAnonymously()`. O visitante recebe uma linha real em `auth.users` com a claim `is_anonymous = true`. Registrar as duas consequências centrais:

1. Middleware, repositórios e políticas existentes **não mudam**, porque `auth.uid()` passa a existir.
2. A única escrita fechada é a fotografia, e a trava é **do banco** — duas políticas restritivas (migração 0008). Interface que esconde botão é placa na porta, não tranca. Repetir aqui o motivo do `coalesce`: para o usuário do Google a claim não vem no JWT, e sem o `coalesce` a comparação daria `null`, que a política trata como negação — ninguém subiria foto.

**Consequências.** Incluir:
- Visitante sai e perde tudo, sem confirmação. É o desenho.
- `places.created_by` é `on delete set null`: apagar um visitante deixa lugares invisíveis e permanentes. A faxina tem ordem obrigatória — lugares antes do usuário.
- Depende de *Allow anonymous sign-ins* ligado no painel do Supabase. Já ligado.
- Não há conversão de visitante em conta (`linkIdentity`): o objetivo é avaliação, não adoção. Se mudar, é ADR novo.
- **A palavra "anônimo" fica sobrecarregada:** em `docs/VERIFICACAO-RLS.md` ela significa requisição sem sessão. Na documentação deste conceito, usar **"visitante"**.

**Step 3: Registrar a poda da spec §3.3**

No ADR, uma linha em Consequências: a emenda prevista para `handle_new_user` foi descartada porque `display_name` não é lido por nenhum componente — nulo ali não produz efeito visível, e mexer num trigger `security definer` sem motivo é risco sem retorno.

- [ ] **Step 4: Abrir a entrada do CHANGELOG**

Em `CHANGELOG.md`, sob `## [Não lançado]` → `### Adicionado`, **substituir** a entrada de spec adicionada no commit anterior (que começa com "Spec de **Entrar sem conta** fechada") por uma entrada de feature, que as próximas tarefas vão estendendo:

```markdown
- **Entrar sem conta.** A tela de entrada ganha uma segunda porta: dá para
  olhar o Rastro sem ter conta. O mapa chega cheio, porque o catálogo de
  lugares sempre foi público, e o visitante experimenta o produto inteiro —
  marcar visitado, favoritar, montar viagem, escrever memória. Só não sobe
  fotografia, que é a única coisa que deixaria arquivo permanente, e quem
  recusa é o banco, não um botão escondido. Nada do que o visitante faz
  sobrevive à sessão, e a barra de cima diz isso o tempo todo
```

- [ ] **Step 5: Verificar e commitar**

```bash
npm run lint && npm run typecheck && npm run test
git add docs/decisions/0017-sessao-anonima-como-entrada-de-visitante.md CHANGELOG.md
git commit -m "docs: ADR 0017 -- sessao anonima como entrada de visitante"
```

---

### Tarefa 2: As duas políticas restritivas

**Files:**
- Create: `supabase/migrations/0008_visitante.sql`
- Modify: `docs/VERIFICACAO-RLS.md`

**Interfaces:**
- Consumes: ADR 0017 (citado no comentário da migração).
- Produces: as políticas `fotos_insert_nao_visitante` e `trip_photos_insert_nao_visitante`.

- [ ] **Step 1: Escrever a migração**

Criar `supabase/migrations/0008_visitante.sql`. O comentário no topo é parte do entregável — as migrações deste repositório explicam o porquê, não o quê:

```sql
-- Visitante nao sobe fotografia.
--
-- A trava e do banco, e nao da interface. Esconder o controle de envio evita
-- OFERECER o que seria recusado; nao e o que recusa. Ver ADR 0008 e ADR 0017.
--
-- POLITICA RESTRITIVA, e nao mais uma permissiva: restritivas entram com AND
-- sobre as que ja existem, entao as regras de `fotos_insert_own` e
-- `trip_photos_own` continuam valendo inteiras e nao precisam ser reescritas.
--
-- O `coalesce` NAO e defensivo, e obrigatorio: para quem entrou pelo Google a
-- claim `is_anonymous` nao vem no JWT, `null = false` da `null`, e a politica
-- trata `null` como negacao. Sem ele, NINGUEM subiria foto.
--
-- As DUAS politicas, e nao so a do Storage: `addPhotoAction` grava o arquivo no
-- bucket E uma linha em `trip_photos`. Barrar um lado so deixaria lixo pela
-- metade -- arquivo sem linha, ou linha apontando para arquivo que nao existe.

-- `bucket_id <> 'fotos' or ...` limita o alcance a este bucket. Uma restritiva
-- crua barraria o visitante em qualquer bucket futuro sem ninguem lembrar por que.
create policy fotos_insert_nao_visitante on storage.objects
  as restrictive for insert
  with check (
    bucket_id <> 'fotos'
    or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

create policy trip_photos_insert_nao_visitante on trip_photos
  as restrictive for insert
  with check (
    coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
```

- [ ] **Step 2: Aplicar a migração no Supabase**

Rodar o conteúdo do arquivo no SQL Editor do projeto Supabase. Se `create policy` reclamar que já existe, apagar com `drop policy if exists <nome> on <tabela>;` antes — não editar a política existente.

- [ ] **Step 3: Verificar as quatro combinações**

Isto é o coração da tarefa. Duas identidades × dois alvos. No SQL Editor, ou pela aplicação depois da Tarefa 8.

| Identidade | Alvo | Esperado |
|---|---|---|
| Visitante (`is_anonymous = true`) | insert em `storage.objects` bucket `fotos` | **recusado**, `42501` |
| Visitante | insert em `trip_photos` | **recusado**, `42501` |
| Conta Google | insert em `storage.objects` bucket `fotos` | **aceito** |
| Conta Google | insert em `trip_photos` | **aceito** |

**As duas últimas linhas são o que prova o `coalesce`.** Verificar só as recusas passaria com uma política que barra todo mundo.

- [ ] **Step 4: Registrar em `docs/VERIFICACAO-RLS.md`**

Acrescentar uma seção `## Visitante — fotografia fechada`, com a tabela do Step 3 preenchida com o resultado real e a data. Seguir o formato das seções existentes (`## Storage `fotos` — verificada em 30/07/2026`).

Na mesma seção, o SQL de faxina, com o aviso de ordem:

```sql
-- Faxina de visitantes. Rodar a mao; nao ha cron.
--
-- A ORDEM E OBRIGATORIA. `places.created_by` e `on delete set null`: apagar o
-- usuario primeiro deixa os lugares dele com `created_by` nulo e
-- `is_public` falso -- invisiveis para todo mundo, inclusive para quem vier
-- limpar depois, e permanentes.
delete from places
where created_by in (
  select id from auth.users
  where is_anonymous and created_at < now() - interval '30 days'
);

delete from auth.users
where is_anonymous and created_at < now() - interval '30 days';
```

- [ ] **Step 5: Commit**

Estender a entrada do CHANGELOG com a linha da trava do banco.

```bash
npm run lint && npm run typecheck && npm run test
git add supabase/migrations/0008_visitante.sql docs/VERIFICACAO-RLS.md CHANGELOG.md
git commit -m "feat(db): visitante nao sobe fotografia, recusado pelo banco"
```

---

### Tarefa 3: O predicado no domínio

Componente visual não decide elegibilidade (`CLAUDE.md`). Esta é a única tarefa com TDD de verdade.

**Files:**
- Create: `src/domain/guest.ts`
- Test: `src/domain/guest.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `interface Viewer { isGuest: boolean }` e `canUploadPhotos(viewer: Viewer): boolean`. As Tarefas 4, 5, 7 e 8 importam ambos de `@/domain/guest`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/domain/guest.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { canUploadPhotos } from './guest'
import type { Viewer } from './guest'

function viewer(overrides: Partial<Viewer> = {}): Viewer {
  return { isGuest: false, ...overrides }
}

describe('canUploadPhotos', () => {
  it('libera quem entrou com conta', () => {
    expect(canUploadPhotos(viewer())).toBe(true)
  })

  it('recusa o visitante sem conta', () => {
    expect(canUploadPhotos(viewer({ isGuest: true }))).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/domain/guest.test.ts`
Expected: FAIL — `Failed to resolve import "./guest"`.

- [ ] **Step 3: Escrever a implementação mínima**

Criar `src/domain/guest.ts`:

```ts
/**
 * Quem está olhando.
 *
 * `isGuest` é o visitante sem conta — a sessão anônima do Supabase, que tem
 * `auth.uid()` como qualquer outra e por isso atravessa middleware,
 * repositórios e RLS sem tratamento especial. Ver ADR 0017.
 *
 * Não confundir com o "anônimo" de `docs/VERIFICACAO-RLS.md`: lá a palavra
 * significa requisição SEM sessão nenhuma.
 */
export interface Viewer {
  isGuest: boolean
}

/**
 * Fotografia é a única escrita que deixa arquivo permanente e custo, e por isso
 * a única fechada ao visitante.
 *
 * **Esta função não é a tranca, é a placa na porta.** Quem recusa de verdade
 * são as políticas restritivas da migração 0008 — aqui só evitamos oferecer o
 * que o banco vai negar.
 */
export function canUploadPhotos(viewer: Viewer): boolean {
  return !viewer.isGuest
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/domain/guest.test.ts`
Expected: PASS, 2 testes.

- [ ] **Step 5: Commit**

```bash
npm run lint && npm run typecheck && npm run test
git add src/domain/guest.ts src/domain/guest.test.ts CHANGELOG.md
git commit -m "feat(domain): predicado de envio de foto por visitante"
```

---

### Tarefa 4: O viewer chega à árvore

Duas coisas juntas porque uma sem a outra não é verificável: a leitura da sessão e o contexto que a distribui.

**Files:**
- Create: `src/lib/data/session.ts`
- Create: `src/lib/data/viewer.ts`
- Create: `src/components/layout/viewer-context.tsx`
- Modify: `src/lib/data/index.ts:28-39` (remover `sessionContext`, importar de `./session`)
- Modify: `src/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `Viewer` de `@/domain/guest` (Tarefa 3).
- Produces: `getViewer(): Promise<Viewer>` em `@/lib/data/viewer`; `ViewerProvider({ viewer, children })` e `useViewer(): Viewer` em `@/components/layout/viewer-context`. As Tarefas 7 e 8 chamam `useViewer()`.

- [ ] **Step 1: Mover `sessionContext` e memoizar**

Criar `src/lib/data/session.ts` com o conteúdo movido de `index.ts:28-39`, mais o `cache` e o `user`:

```ts
import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Cliente e usuário desta requisição.
 *
 * Os repositórios são funções, e não constantes, porque carregam a sessão da
 * requisição. Um singleton de módulo compartilharia sessão entre usuários.
 *
 * `cache` do React memoiza por requisição, e não entre requisições — a sessão
 * continua sendo de quem pediu. Sem ele, cada repositório de uma mesma
 * renderização paga uma ida à API de autenticação: uma página que lê lugares e
 * estado pessoal pagava duas, e o layout que lê perfil e visitante pagaria mais
 * duas. `getUser` valida o token contra o servidor, então não é leitura barata.
 */
export const sessionContext = cache(async () => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('sem sessão: o middleware deveria ter redirecionado')
  }

  return { supabase, user, userId: user.id }
})
```

- [ ] **Step 2: Apontar `index.ts` para o módulo novo**

Em `src/lib/data/index.ts`: apagar a função `sessionContext` local (linhas 28-39) e o import agora órfão de `createServerSupabaseClient`, e acrescentar `import { sessionContext } from './session'`. **Manter o bloco de comentário sobre o adapter em memória** — ele explica uma decisão que continua valendo; mover para junto do novo import. Nenhuma das sete funções `get*Repository` muda: continuam desestruturando `{ supabase, userId }`.

- [ ] **Step 3: Escrever `getViewer`**

Criar `src/lib/data/viewer.ts`:

```ts
import type { Viewer } from '@/domain/guest'
import { sessionContext } from './session'

/**
 * Quem está olhando, lido da sessão desta requisição.
 *
 * `is_anonymous` é a claim que o Supabase põe no JWT de quem entrou sem conta.
 * Vem opcional no tipo do usuário, e o `?? false` trata a ausência dela — para
 * quem entrou pelo Google ela simplesmente não existe. É a mesma leitura que a
 * política restritiva da migração 0008 faz do outro lado, e as duas precisam
 * concordar: se divergirem, a interface oferece o que o banco recusa.
 */
export async function getViewer(): Promise<Viewer> {
  const { user } = await sessionContext()
  return { isGuest: user.is_anonymous ?? false }
}
```

- [ ] **Step 4: Escrever o contexto**

Criar `src/components/layout/viewer-context.tsx`, no mesmo molde de `origin-context.tsx`:

```tsx
'use client'

import { createContext, useContext, useMemo } from 'react'
import type { Viewer } from '@/domain/guest'

/**
 * O padrão é "tem conta", e não "é visitante".
 *
 * O erro possível aqui é oferecer o envio de foto a um visitante — que o banco
 * recusa de qualquer forma (migração 0008). O erro oposto seria esconder o
 * envio de quem tem conta: um recurso que some sem explicação, e sem nada no
 * banco para contradizer. Entre um erro que o banco corrige e um que ninguém
 * percebe, o padrão fica no primeiro.
 */
const ViewerContext = createContext<Viewer>({ isGuest: false })

export function ViewerProvider({
  viewer,
  children,
}: {
  viewer: Viewer
  children: React.ReactNode
}) {
  const value = useMemo(() => ({ isGuest: viewer.isGuest }), [viewer.isGuest])
  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>
}

export function useViewer(): Viewer {
  return useContext(ViewerContext)
}
```

- [ ] **Step 5: Ligar no layout**

Em `src/app/(app)/layout.tsx`: importar `getViewer` de `@/lib/data/viewer` e `ViewerProvider` de `@/components/layout/viewer-context`.

Ler o viewer ao lado do perfil, com a mesma guarda de configuração que o perfil já usa:

```tsx
const viewer = isSupabaseConfigured() ? await getViewer() : { isGuest: false }
```

Embrulhar a árvore com `<ViewerProvider viewer={viewer}>` **por fora** de `<OriginProvider>`, fechando com `</ViewerProvider>` no fim. Nenhum outro trecho do layout muda.

- [ ] **Step 6: Verificar que nada quebrou**

```bash
npm run lint && npm run typecheck && npm run test
npm run dev
```

Abrir `/` logado e confirmar: a página carrega, o mapa desenha, os pins aparecem e o console fica limpo. O que se verifica aqui é a refatoração de `sessionContext` — o viewer ainda não tem consumidor.

- [ ] **Step 7: Commit**

```bash
git add src/lib/data/session.ts src/lib/data/viewer.ts src/lib/data/index.ts \
        src/components/layout/viewer-context.tsx "src/app/(app)/layout.tsx" CHANGELOG.md
git commit -m "feat: viewer da requisicao, e uma ida a autenticacao por render"
```

---

### Tarefa 5: A segunda porta na tela de entrada

**Files:**
- Modify: `src/app/entrar/actions.ts`
- Modify: `src/app/entrar/page.tsx:8-18` (mensagens) e `:79-99` (bloco do botão)

**Interfaces:**
- Consumes: nada das tarefas anteriores.
- Produces: `signInAsGuestAction(formData: FormData): Promise<void>`.

- [ ] **Step 1: Escrever a Server Action**

Acrescentar ao fim de `src/app/entrar/actions.ts`, antes de `signOutAction`:

```ts
/**
 * Entrada de visitante: sessão anônima do Supabase.
 *
 * **Isto não é um desvio de autenticação.** O visitante recebe uma linha real
 * em `auth.users` e um `auth.uid()` próprio — é por isso que middleware,
 * repositórios e RLS funcionam sem nenhum caso especial. O que ele não recebe é
 * identidade: nada do que faz sobrevive à sessão, e as políticas restritivas da
 * migração 0008 recusam a única escrita que deixaria rastro permanente.
 *
 * Escrever a sessão aqui, e não no navegador, é a mesma decisão do login pelo
 * Google: mantém `supabase-js` fora do bundle do cliente. Ver ADR 0014.
 */
export async function signInAsGuestAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInAnonymously()

  if (error) {
    redirect(
      `/entrar?erro=visitante&detalhe=${encodeURIComponent(error.message)}`,
    )
  }

  const next = formData.get('proximo')
  // Só caminho relativo, e `//` fora: mesma proteção contra redirecionamento
  // aberto que `signInWithGoogleAction` faz.
  redirect(
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/',
  )
}
```

Atenção: `redirect()` funciona lançando uma exceção. Não envolver nada disto em `try/catch`.

- [ ] **Step 2: Acrescentar a mensagem de erro**

Em `src/app/entrar/page.tsx`, no objeto `ERROR_MESSAGES`:

```ts
  visitante:
    'A entrada de visitante está desligada no projeto. Ligue em ' +
    'Authentication → Sign In / Providers → Allow anonymous sign-ins, ' +
    'no painel do Supabase.',
```

Nomear a chave exata do painel é o mesmo critério da mensagem `provedor` que já existe: é o que torna o erro acionável em vez de misterioso.

- [ ] **Step 3: Acrescentar o botão**

Em `src/app/entrar/page.tsx`, dentro do ramo `configured ? (...)`, envolver o formulário existente e o novo num fragmento. O do Google fica **primeiro e inalterado** — `solid` continua sendo dele, porque o sistema reserva o cheio para a ação principal da tela.

```tsx
<>
  <form action={signInWithGoogleAction} className="mt-8">
    <input type="hidden" name="proximo" value={proximo ?? '/'} />
    <Button type="submit" variant="solid" size="lg" className="w-full">
      Entrar com o Google
    </Button>
  </form>

  {/* Segunda porta, e visivelmente segunda: `outline` é o peso que o
      sistema dá à ação secundária. Quem chega para avaliar entra por
      aqui; quem vai usar o produto entra por cima. */}
  <form action={signInAsGuestAction} className="mt-3">
    <input type="hidden" name="proximo" value={proximo ?? '/'} />
    <Button type="submit" variant="outline" size="lg" className="w-full">
      Entrar sem conta
    </Button>
  </form>

  {/* O trato dito ANTES de ser aceito. Depois de entrar, a barra de cima
      repete — mas quem escolhe merece saber o que escolheu. */}
  <p className="mt-3 text-small leading-relaxed text-ink-faint">
    Sem conta você vê e experimenta tudo, mas não sobe fotografia — e nada
    do que fizer fica salvo.
  </p>
</>
```

Importar `signInAsGuestAction` junto de `signInWithGoogleAction` na linha 6.

Conferir em `src/components/ui/Button.tsx` que a variante se chama mesmo `outline`; se o nome for outro, usar o do arquivo e não inventar variante nova.

- [ ] **Step 4: Verificar na tela**

```bash
npm run lint && npm run typecheck && npm run test
npm run dev
```

Em `/entrar`: os dois botões aparecem com pesos diferentes, a frase abaixo, e o foco por Tab alcança os dois. Clicar em "Entrar sem conta" leva ao mapa. Confirmar no painel do Supabase (Authentication → Users) que apareceu um usuário com *Is Anonymous* verdadeiro.

- [ ] **Step 5: Commit**

```bash
git add src/app/entrar/actions.ts src/app/entrar/page.tsx CHANGELOG.md
git commit -m "feat: entrar sem conta na tela de entrada"
```

---

### Tarefa 6: A esquina da sessão

**Files:**
- Modify: `src/components/layout/TopBar.tsx:164-177`

**Interfaces:**
- Consumes: `useViewer()` de `@/components/layout/viewer-context` (Tarefa 4).
- Produces: nada.

- [ ] **Step 1: Ler o viewer**

No topo de `TopBar()`, ao lado de `const pathname = usePathname()`:

```tsx
const { isGuest } = useViewer()
```

Importar `useViewer` de `./viewer-context`.

- [ ] **Step 2: Trocar o bloco da saída**

Substituir o hairline e o `<form>` do fim do componente (linhas 164-177) por:

```tsx
{/* O estado de visitante mora aqui porque é aqui que a identidade já
    mora. Não é selo na navegação nem faixa no topo: nenhum dos dois
    caberia sem roubar altura do mapa, que o ADR 0010 trata como escasso.

    Abaixo de 640px o rótulo some e sobra o botão — a palavra "Entrar"
    ali já denuncia que não há conta, e a barra não tem largura para os
    dois. */}
{isGuest ? (
  <span className="instrument-label hidden text-ink-faint sm:inline">
    Visitante
  </span>
) : null}

{/* Hairline separando a saída do resto. Sair não é navegação: é o fim
    da sessão, e não deve morar encostado no que se clica sempre. */}
<span aria-hidden className="h-5 w-px bg-line-strong" />

<form action={signOutAction} className="flex">
  <button
    type="submit"
    className="press flex h-11 items-center rounded-full px-3 text-small
               whitespace-nowrap text-ink-faint hover:bg-overlay
               hover:text-ink-muted md:h-10"
  >
    {/* Para um visitante, sair e entrar são o mesmo gesto: a ação encerra
        a sessão e cai em `/entrar`, que é exatamente o destino prometido.
        Nomear o destino vale mais do que nomear a porta. */}
    {isGuest ? (
      <>
        <span className="sm:hidden">Entrar</span>
        <span className="hidden sm:inline">Entrar com conta</span>
      </>
    ) : (
      'Sair'
    )}
  </button>
</form>
```

- [ ] **Step 3: Verificar nas duas identidades e nas duas larguras**

```bash
npm run lint && npm run typecheck && npm run test
npm run dev
```

| Situação | Esperado |
|---|---|
| Logado, ≥640px | `Sair`, sem rótulo de visitante |
| Visitante, ≥640px | `Visitante` + hairline + `Entrar com conta` |
| Visitante, 375px | rótulo some, botão diz `Entrar`, **nada transborda da cápsula** |
| Visitante, clique no botão | volta para `/entrar` |

A terceira linha é a que importa medir: a TopBar já é apertada no celular e este é o único texto novo que ela ganha.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/TopBar.tsx CHANGELOG.md
git commit -m "feat: estado de visitante na esquina da sessao"
```

---

### Tarefa 7: Onde o envio de foto era

**Files:**
- Modify: `src/components/explore/PlacePhotos.tsx:226-248`

**Interfaces:**
- Consumes: `useViewer()` (Tarefa 4), `canUploadPhotos` de `@/domain/guest` (Tarefa 3).
- Produces: nada.

- [ ] **Step 1: Ler o viewer e decidir pelo domínio**

No topo de `PlacePhotos()`, junto dos `useState`:

```tsx
const viewer = useViewer()
const canUpload = canUploadPhotos(viewer)
```

Imports novos: `Link` de `next/link`, `canUploadPhotos` de `@/domain/guest`, `useViewer` de `@/components/layout/viewer-context`.

A decisão vem do domínio e não de um `viewer.isGuest` escrito aqui: componente visual não decide elegibilidade (`CLAUDE.md`).

- [ ] **Step 2: Trocar o controle pela nota**

Envolver o `<label>` inteiro (linhas 226-248) num ternário:

```tsx
{canUpload ? (
  <label className="mt-3 block">
    {/* ...conteúdo existente, sem alteração nenhuma... */}
  </label>
) : (
  /* O motivo fica escrito onde a pessoa tentaria agir. Sem modal, sem
     toast, sem tooltip de hover — os três são proibidos pelo ADR 0016, e
     nenhum deles sobreviveria a um toque de luva no acostamento. */
  <p className="mt-3 border-t border-line pt-3 text-small leading-relaxed text-ink-muted">
    Envio de fotografia precisa de conta.{' '}
    <Link href="/entrar" className="text-accent">
      Entrar com conta
    </Link>
  </p>
)}
```

O bloco `{busy ? ... }` e o `{error ? ... }` ficam onde estão: são de estados que só existem com envio liberado, e não custam nada desligados.

- [ ] **Step 3: Verificar**

```bash
npm run lint && npm run typecheck && npm run test
npm run dev
```

| Situação | Esperado |
|---|---|
| Logado, painel de um lugar | controle de arquivo presente, envio funciona |
| Visitante, painel de um lugar | nota + link, **nenhum** controle de arquivo |
| Visitante, clique no link | vai para `/entrar` |

- [ ] **Step 4: Commit**

```bash
git add src/components/explore/PlacePhotos.tsx CHANGELOG.md
git commit -m "feat: painel de lugar diz por que o visitante nao sobe foto"
```

---

### Tarefa 8: Fechamento — a volta inteira, e a trava provada por fora

O que se verifica aqui não é cada peça, é o percurso. E, principalmente, que **a trava do banco vale mesmo quando a interface não ajuda**.

**Files:**
- Modify: `CHANGELOG.md` (revisão final da entrada)
- Modify: `docs/VERIFICACAO-RLS.md` (resultado do Step 2)

- [ ] **Step 1: Percorrer como visitante**

Com `npm run dev`, entrando por "Entrar sem conta":

- [ ] O mapa do Explorar chega **cheio** — o catálogo público aparece
- [ ] Marcar um lugar como visitado grava e sobrevive a um recarregamento
- [ ] Favoritar grava
- [ ] Criar um lugar novo funciona
- [ ] Montar uma viagem funciona
- [ ] Escrever uma memória funciona
- [ ] O painel de lugar mostra a nota no lugar do envio de foto
- [ ] A TopBar diz `Visitante`
- [ ] Nenhum erro no console

- [ ] **Step 2: Provar a trava com a interface fora do caminho**

O teste que importa, porque a interface não participa dele. Como visitante, com o app aberto, no console do navegador:

```js
const { data: { user } } = await window.__supabase?.auth?.getUser?.() ?? { data: {} }
```

Se o cliente do navegador não estiver exposto em `window`, usar o caminho equivalente: abrir as ferramentas de rede, copiar o `access_token` do cookie de sessão, e fazer um `POST` direto ao endpoint de Storage do projeto (`/storage/v1/object/fotos/<uid>/teste.jpg`) com `Authorization: Bearer <token>`.

**Esperado: recusa por RLS (`42501` / "new row violates row-level security policy").**

Se isto **passar**, a implementação está errada e nada mais importa: a interface está escondendo um botão que o banco continua aceitando. Parar e revisar a Tarefa 2.

Registrar o resultado na seção `## Visitante — fotografia fechada` de `docs/VERIFICACAO-RLS.md`, com a data.

- [ ] **Step 3: Confirmar que quem tem conta não foi atingido**

Sair, entrar com o Google, e **subir uma fotografia de verdade**. Tem que funcionar.

Este passo não é formalidade: é o que prova o `coalesce` da migração 0008. Sem ele, a claim ausente do usuário do Google viraria `null` e a política recusaria todo mundo — e um teste que só verifica recusas passaria feliz.

- [ ] **Step 4: Revisar a entrada do CHANGELOG**

Reler a entrada aberta na Tarefa 1 e estendida pelas demais. Ela deve descrever o que mudou **para quem usa**, não os arquivos tocados. Consolidar repetições. `CLAUDE.md`: escrever para quem vai ler daqui a seis meses.

- [ ] **Step 5: Build e commit final**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git add CHANGELOG.md docs/VERIFICACAO-RLS.md
git commit -m "docs: verificacao da entrada de visitante"
```

`npm run build` aqui e não antes: é ele que confirma que `entrar-dev` continua devolvendo 404 em produção e que nada da árvore nova quebra na compilação.

---

## Auto-revisão do plano

**Cobertura da spec:**

| Spec | Tarefa |
|---|---|
| §3.1 sessão anônima | 5 (action), 1 (ADR) |
| §3.2 duas políticas restritivas | 2 |
| §3.3 emenda no trigger | **cortada** — justificada nas Constraints e na Tarefa 1 Step 3 |
| §3.4 função pura | 3 |
| §3.5 viewer pela árvore | 4 |
| §4.1 tela de entrada | 5 |
| §4.2 esquina da sessão | 6 |
| §4.3 nota no lugar do envio | 7 |
| §6.2 faxina com ordem obrigatória | 2 Step 4 |
| §6.3 passo manual no painel | 5 Step 2 (mensagem de erro) |
| §7 verificação | 2 Step 3, 3, 8 |
| §8 ADR 0017 | 1 |

**Consistência de tipos:** `Viewer` é `{ isGuest: boolean }` na Tarefa 3 e em todos os consumidores (4, 6, 7). `canUploadPhotos(viewer: Viewer): boolean` chamado só na Tarefa 7. `getViewer(): Promise<Viewer>` produzido na 4 e consumido só pelo layout. `sessionContext()` passa a devolver `{ supabase, user, userId }` — o `userId` é mantido justamente para que as sete funções de `index.ts` não mudem.

**Desvio da spec, deliberado:** §3.3 cortada. Motivo nas Global Constraints.
