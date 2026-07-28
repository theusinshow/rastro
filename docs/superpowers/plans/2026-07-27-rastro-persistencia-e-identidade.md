# Persistência e identidade — plano de implementação

> **Para agentes executores:** SUB-SKILL OBRIGATÓRIA: use
> `superpowers:subagent-driven-development` (recomendado) ou
> `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam
> caixas (`- [ ]`) para acompanhamento.

**Objetivo:** fazer o Rastro deixar de ser demonstração — conta própria pelo
Google, favoritos e visitas que persistem, e lugares criados pelo usuário.

**Arquitetura:** Supabase na nuvem com RLS como fronteira de autorização, cliente
apenas no servidor (`@supabase/ssr`), leitura por Server Components e escrita por
Server Actions com `revalidatePath` e `useOptimistic`. O adapter em memória é
rebaixado a fixture de teste; o domínio continua puro e sem dependência de banco.

**Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4,
Vitest, MapLibre 5, `@supabase/supabase-js`, `@supabase/ssr`.

**Spec:** `docs/superpowers/specs/2026-07-27-rastro-persistencia-e-identidade-design.md`

---

## Restrições globais

Valem para **todas** as tarefas. Não são repetidas em cada uma.

- **Changelog é regra primordial.** Todo commit exige entrada correspondente em
  `CHANGELOG.md` sob `## [Não lançado]`, escrita do ponto de vista de quem usa o
  produto. Commitar sem tocar no changelog é trabalho incompleto. Ver `CLAUDE.md`.
- **Definição de concluído:** `npm run lint` (zero warnings), `npm run typecheck`
  e `npm run test` limpos antes de cada commit.
- **Nenhum `any` novo, nenhum `@ts-ignore` novo, nenhum `console.log` esquecido.**
- **Dependências:** só `@supabase/supabase-js` e `@supabase/ssr` entram nesta
  fase. Nenhuma outra. Sem biblioteca de formulário, de data ou de toast.
- **Camadas** (regra verificável por leitura de imports):
  | Camada | Pode importar | Nunca importa |
  |---|---|---|
  | `src/domain/` | só `domain` | React, Next, componentes, dados |
  | `src/lib/supabase/` | nada do projeto | `domain`, componentes |
  | `src/lib/data/` | `domain`, `lib/supabase` | componentes |
  | `src/app/actions/` | `domain`, `lib` | componentes |
  | `src/components/` | `domain`, `lib` | outros repositórios direto |
- **Lógica de negócio não vive em componente visual.** Validação, filtro, ordem e
  elegibilidade são funções puras em `src/domain/`.
- **Direção visual não negociável:** raio máximo 2px, separação por hairline de
  1px, todo dado numérico em fonte mono, acento âmbar de instrumento. Proibido:
  card, gradiente, glassmorphism decorativo, sombra difusa, ícone sem função,
  grade de botões de peso idêntico. Ver `docs/DESIGN-SYSTEM.md`.
- **Textos de interface em PT-BR; código em inglês.** Nada de "Ops!", nada de voz
  de marketing. O tom é o dos estados vazios que já existem: honesto e específico.
- **Nunca commitar `.env.local`.** Só a `anon key` é usada; a `service_role`
  **não é necessária em nenhum ponto deste plano** e não deve entrar no repositório.
- **`prefers-reduced-motion`:** qualquer movimento novo respeita os tokens
  `--dur-*` de `globals.css`, que já são zerados sob `reduce`.
- **Commits em português, sem acento no título**, seguindo o padrão do histórico
  (`feat:`, `fix:`, `docs:`, `chore:`).

---

## Estrutura de arquivos

### Criados

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/0002_profile_on_signup.sql` | Trigger que cria `profiles` no primeiro login |
| `supabase/seeds/0001_places.sql` | Os 14 lugares como catálogo curado global |
| `docs/VERIFICACAO-RLS.md` | Roteiro manual de prova das políticas |
| `src/lib/supabase/config.ts` | Leitura e validação das variáveis de ambiente |
| `src/lib/supabase/server.ts` | Cliente por requisição (Server Components e Actions) |
| `src/lib/supabase/middleware.ts` | Renovação de sessão no middleware |
| `src/middleware.ts` | Proteção de rotas |
| `src/app/entrar/page.tsx` | Tela de entrada |
| `src/app/entrar/actions.ts` | Ações de entrar e sair |
| `src/app/auth/callback/route.ts` | Troca do código OAuth por sessão |
| `src/domain/slug.ts` | `slugify` e `uniqueSlug` — puros |
| `src/domain/profile.ts` | Tipo `Profile` |
| `src/lib/data/supabase/place-row.ts` | Mapeamento linha → `ExplorePlace`, puro e testável |
| `src/lib/data/supabase/supabase-place-repository.ts` | Leitura de lugares |
| `src/lib/data/supabase/supabase-place-state-repository.ts` | Escrita de estado pessoal |
| `src/lib/data/supabase/supabase-place-catalog-repository.ts` | Escrita de catálogo |
| `src/lib/data/supabase/supabase-profile-repository.ts` | Leitura e escrita de perfil |
| `src/lib/data/place-state-repository.ts` | Contrato de escrita de estado pessoal |
| `src/lib/data/place-catalog-repository.ts` | Contrato de escrita de catálogo |
| `src/lib/data/profile-repository.ts` | Contrato de perfil |
| `src/app/actions/place-state-actions.ts` | Server Actions de favorito, interesse e visita |
| `src/app/actions/place-catalog-actions.ts` | Server Actions de criar, editar e apagar lugar |
| `src/app/actions/profile-actions.ts` | Server Action de definir origem |
| `src/app/actions/result.ts` | Tipo `ActionResult` compartilhado |
| `src/components/layout/DataFallback.tsx` | Estado de Supabase não configurado |
| `src/components/layout/origin-context.tsx` | Origem do usuário para a árvore de cliente |
| `src/components/map/picker-context.tsx` | Estado do modo de escolha de ponto |
| `src/components/map/PointPicker.tsx` | Escolha de coordenada por clique no mapa |
| `src/components/onboarding/OriginSetup.tsx` | Definição da origem no primeiro login |
| `src/components/explore/PlaceStateControls.tsx` | Favorito e quero conhecer |
| `src/components/explore/PlaceVisits.tsx` | Histórico de visitas do lugar |
| `src/components/explore/PlaceForm.tsx` | Formulário de criar e editar lugar |
| `src/components/explore/NewPlaceView.tsx` | Criação: formulário em modo de mira |
| `src/components/explore/EditPlaceView.tsx` | Edição e remoção de lugar próprio |
| `src/app/(app)/lugar/novo/page.tsx` | Rota de criação de lugar |
| `src/app/(app)/lugar/[slug]/editar/page.tsx` | Rota de edição, 404 se não for seu |
| `src/app/(app)/perfil/origem/page.tsx` | Rota de definição da origem |
| `docs/decisions/0007-dependencias-do-supabase.md` | ADR das duas dependências |
| `docs/decisions/0008-rls-como-fronteira-de-autorizacao.md` | ADR do escopo por RLS |

### Modificados

| Arquivo | Mudança |
|---|---|
| `src/domain/place.ts` | `PlaceVisit`, `visits`, `isOwn`, `NewPlace`, `validateNewPlace` |
| `src/lib/data/index.ts` | De constante para fábricas por requisição |
| `src/lib/data/mock/mock-place-repository.ts` | Movido para fixture de teste |
| `src/mocks/user.ts` | `DEV_USER_ID` removido; origem passa a ser fallback nomeado |
| `src/mocks/motorcycles.ts` | Deixa de importar `DEV_USER_ID` |
| `src/app/(app)/layout.tsx` | Provedores de origem e de picker; leitura de perfil |
| `src/app/(app)/page.tsx`, `descobrir/page.tsx` | `await getPlaceRepository()` |
| `src/components/layout/TopBar.tsx` | "Novo lugar" e "Sair" |
| `src/components/layout/StatusBar.tsx` | Origem do perfil; coordenada de mira |
| `src/components/explore/ExploreView.tsx` | Origem por contexto |
| `src/components/explore/DiscoveryView.tsx` | Origem por contexto; indisponível sem origem |
| `src/components/explore/DiscoveryForm.tsx` | Rótulo de origem por contexto |
| `src/components/explore/PlaceList.tsx` | Origem por contexto |
| `src/components/explore/PlacePanel.tsx` | Origem por contexto; controles e visitas |
| `src/components/explore/PlaceActions.tsx` | Só "Abrir rota" e "Criar viagem — em breve" |
| `src/components/explore/FilterRail.tsx` | Raio indisponível sem origem |
| `.env.example` | Variáveis do Supabase |

---

## Tarefa 1: Banco na nuvem — migrations e seed

**Arquivos:**
- Criar: `supabase/migrations/0002_profile_on_signup.sql`
- Criar: `supabase/seeds/0001_places.sql`
- Modificar: `.env.example`

**Interfaces:**
- Consome: nada
- Produz: um banco com 14 linhas em `places`, RLS ativa, e as variáveis
  `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`

> **Esta tarefa tem passos manuais que um agente não pode executar.** Os passos
> 1, 3 e 8 são do dono do projeto, no painel do Supabase e do Google Cloud.
> Pare e peça, não tente contornar.

- [ ] **Passo 1: Criar o projeto Supabase** *(manual, dono do projeto)*

Em https://supabase.com/dashboard, criar projeto novo. Região: `South America
(São Paulo)`. Guardar a senha do banco.

Em **Project Settings → API**, copiar `Project URL` e a chave `anon public`.

Criar `.env.local` com as três variáveis (a do MapTiler já existe):

```
NEXT_PUBLIC_MAPTILER_KEY=<a que já está lá>
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public>
```

- [ ] **Passo 2: Documentar as variáveis em `.env.example`**

Acrescentar ao final de `.env.example`:

```
# Projeto Supabase — Project Settings → API no painel.
# Só a chave `anon public` é usada. A `service_role` não é necessária em nenhum
# ponto desta aplicação e não deve entrar no repositório: a proteção do dado é a
# RLS, não o segredo da chave.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Passo 3: Aplicar a migration 0001** *(manual, dono do projeto)*

No **SQL Editor** do painel, colar o conteúdo inteiro de
`supabase/migrations/0001_initial_schema.sql` e executar.

**Esta migration nunca rodou contra um Postgres de verdade.** Se falhar, o erro
é real e precisa ser corrigido **editando `0001` no lugar** — ela ainda não
aplicou com sucesso nenhuma vez, então não há histórico a preservar. Corrigir,
commitar a correção com entrada no changelog, e rodar de novo até passar.

Verificação: `select count(*) from places;` retorna `0` sem erro, e
`select tablename from pg_tables where schemaname = 'public';` lista as oito
tabelas.

- [ ] **Passo 4: Escrever a migration 0002**

Criar `supabase/migrations/0002_profile_on_signup.sql`:

```sql
-- Perfil criado no primeiro login.
--
-- Trigger em vez de responsabilidade da aplicação: um usuário autenticado sem
-- linha em `profiles` é um estado inconsistente que nenhuma tela sabe tratar, e
-- deixar a criação a cargo do app significa que qualquer caminho de entrada novo
-- pode esquecer de criá-la.
--
-- `home_latitude` e `home_longitude` nascem nulos de propósito: a origem é
-- escolhida pelo usuário clicando no mapa, e inventar uma origem padrão faria o
-- produto mentir sobre distâncias na primeira sessão.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Passo 5: Escrever o seed dos 14 lugares**

Criar `supabase/seeds/0001_places.sql`. Traduzir **cada um dos 14 objetos** de
`src/mocks/places.ts` para uma linha, preservando `slug`, `name`, `description`,
`latitude`, `longitude`, `municipality`, `state_code`, `category` e `tags`.

Cabeçalho obrigatório e as três colunas de controle:

```sql
-- Catálogo curado global — DADOS DE DESENVOLVIMENTO, NÃO VERIFICADOS.
--
-- `source = 'mock'` é preservado de propósito. O CLAUDE.md proíbe apresentar
-- dado de desenvolvimento como verificado, e apagar essa marca ao entrar no
-- banco seria a forma mais silenciosa possível de quebrar essa regra: as
-- coordenadas e descrições continuam aproximadas depois da migração.
--
-- `created_by = null` marca o lugar como do catálogo, não de um usuário. É o que
-- a interface lê para decidir que este lugar não pode ser editado nem apagado.
--
-- Idempotente: `on conflict (slug) do nothing`. Rodar de novo não duplica.
insert into public.places
  (slug, name, description, latitude, longitude, municipality,
   state_code, category, tags, source, created_by, is_public)
values
  ('serra-do-rio-do-rastro', 'Serra do Rio do Rastro',
   'Descida em curvas fechadas sobre o paredão, com mirante no alto da serra.',
   -28.39, -49.54, 'Bom Jardim da Serra', 'SC', 'serra',
   array['curvas','mirante','icônico'], 'mock', null, true),
  ('morro-da-igreja', 'Morro da Igreja',
   'Ponto habitado mais alto do sul do país, com a Pedra Furada.',
   -28.1247, -49.4736, 'Urubici', 'SC', 'mirante',
   array['altitude','frio'], 'mock', null, true),
  ('serra-do-corvo-branco', 'Serra do Corvo Branco',
   'Corte de rocha em paredões verticais ligando serra e litoral.',
   -28.17, -49.34, 'Grão-Pará', 'SC', 'serra',
   array['corte de rocha','estrada'], 'mock', null, true)
  -- ... continuar com os 11 restantes de src/mocks/places.ts, na mesma ordem
on conflict (slug) do nothing;
```

- [ ] **Passo 6: Marcar `src/mocks/places.ts` como fixture**

Substituir o parágrafo final do cabeçalho do arquivo (as linhas que dizem
"Quando houver dados verificados, substitua este arquivo…") por:

```ts
 * A partir da fase de persistência este arquivo é FIXTURE DE TESTE do domínio,
 * não fonte de dados da aplicação. O catálogo real vive em `places` no Supabase,
 * semeado por `supabase/seeds/0001_places.sql`.
 *
 * Os dois PODEM divergir de propósito: o seed é o catálogo do produto, este
 * arquivo é o conjunto mínimo que os testes de filtro e descoberta precisam.
 * Mudar um não obriga a mudar o outro.
```

- [ ] **Passo 7: Aplicar 0002 e o seed** *(manual, dono do projeto)*

No SQL Editor, executar `0002_profile_on_signup.sql` e depois
`seeds/0001_places.sql`.

Verificação:

```sql
select count(*) from places;                          -- 14
select count(*) from places where source = 'mock';    -- 14
select count(*) from places where created_by is null; -- 14
```

- [ ] **Passo 8: Habilitar o Google como provedor** *(manual, dono do projeto)*

1. No **Google Cloud Console** → *APIs & Services* → *Credentials* → *Create
   OAuth client ID* → tipo *Web application*.
2. Em *Authorized redirect URIs*, colar a URI que o painel do Supabase mostra em
   **Authentication → Providers → Google** (formato
   `https://<ref>.supabase.co/auth/v1/callback`).
3. Copiar *Client ID* e *Client secret* para o painel do Supabase, no mesmo
   lugar, e salvar com o provedor habilitado.
4. Em **Authentication → URL Configuration**, definir *Site URL* como
   `http://localhost:3000` durante o desenvolvimento e acrescentar
   `http://localhost:3000/auth/callback` em *Redirect URLs*.

- [ ] **Passo 9: Verificar lint e typecheck**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos. Nenhum código TypeScript mudou; isto confirma que o
comentário editado em `src/mocks/places.ts` não quebrou nada.

- [ ] **Passo 10: Commit**

```bash
git add supabase/migrations/0002_profile_on_signup.sql \
        supabase/seeds/0001_places.sql .env.example \
        src/mocks/places.ts CHANGELOG.md
git commit -m "feat: schema aplicado na nuvem, perfil no primeiro login e seed do catalogo"
```

Entrada no changelog, em `### Adicionado`:

```markdown
- Os catorze lugares passam a viver num banco de verdade, como catálogo
  compartilhado — e continuam marcados como dado de desenvolvimento não
  verificado, porque é o que são
- Perfil criado automaticamente no primeiro login, sem origem definida: a origem
  é escolhida por você, e inventar uma faria o produto mentir sobre distâncias
  na primeira sessão
```

---

## Tarefa 2: Cliente Supabase e detecção de configuração

**Arquivos:**
- Criar: `src/lib/supabase/config.ts`
- Criar: `src/lib/supabase/config.test.ts`
- Criar: `src/lib/supabase/server.ts`
- Modificar: `package.json`

**Interfaces:**
- Consome: `.env.local` da Tarefa 1
- Produz:
  ```ts
  // src/lib/supabase/config.ts
  export interface SupabaseConfig { url: string; anonKey: string }
  export function readSupabaseConfig(
    env: Record<string, string | undefined>,
  ): SupabaseConfig | null

  // src/lib/supabase/server.ts
  export async function createServerSupabaseClient(): Promise<SupabaseClient>
  export function isSupabaseConfigured(): boolean
  ```

- [ ] **Passo 1: Instalar as duas dependências**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Passo 2: Escrever o teste que falha**

Criar `src/lib/supabase/config.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { readSupabaseConfig } from './config'

describe('readSupabaseConfig', () => {
  it('devolve a configuração quando as duas variáveis existem', () => {
    expect(
      readSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chave',
      }),
    ).toEqual({ url: 'https://abc.supabase.co', anonKey: 'chave' })
  })

  it('devolve null quando falta a URL', () => {
    expect(
      readSupabaseConfig({ NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chave' }),
    ).toBeNull()
  })

  it('devolve null quando falta a chave', () => {
    expect(
      readSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co' }),
    ).toBeNull()
  })

  // Variável vazia é o caso real: `.env.example` copiado sem preencher.
  // Tratá-la como ausente é o que faz o estado de fallback aparecer em vez de um
  // erro de rede incompreensível.
  it('trata string vazia como ausente', () => {
    expect(
      readSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chave',
      }),
    ).toBeNull()
  })

  it('ignora espaço em volta dos valores', () => {
    expect(
      readSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: '  https://abc.supabase.co  ',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ' chave ',
      }),
    ).toEqual({ url: 'https://abc.supabase.co', anonKey: 'chave' })
  })
})
```

- [ ] **Passo 3: Rodar o teste e confirmar que falha**

Executar: `npx vitest run src/lib/supabase/config.test.ts`
Esperado: FALHA com `Failed to resolve import "./config"`.

- [ ] **Passo 4: Implementar `config.ts`**

```ts
/** Configuração mínima para falar com o projeto Supabase. */
export interface SupabaseConfig {
  url: string
  anonKey: string
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Lê a configuração do ambiente. `null` quando falta qualquer uma das duas.
 *
 * Recebe o ambiente como argumento em vez de ler `process.env` direto para
 * continuar sendo função pura e testável — o resto do projeto segue a mesma
 * regra com o domínio.
 *
 * Só a chave `anon` aparece aqui. A proteção do dado é a RLS, não o segredo da
 * chave; uma `service_role` neste arquivo contornaria toda a autorização.
 */
export function readSupabaseConfig(
  env: Record<string, string | undefined>,
): SupabaseConfig | null {
  const url = clean(env.NEXT_PUBLIC_SUPABASE_URL)
  const anonKey = clean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!url || !anonKey) return null
  return { url, anonKey }
}
```

- [ ] **Passo 5: Rodar o teste e confirmar que passa**

Executar: `npx vitest run src/lib/supabase/config.test.ts`
Esperado: 5 testes passando.

- [ ] **Passo 6: Implementar o cliente de servidor**

Criar `src/lib/supabase/server.ts`:

```ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { readSupabaseConfig } from './config'

/**
 * Cliente por requisição. Nunca um singleton de módulo: ele carrega a sessão do
 * usuário desta requisição, e compartilhá-lo entre requisições vazaria dado
 * entre usuários.
 *
 * Não existe cliente equivalente para o navegador nesta aplicação, e é
 * deliberado: o login é iniciado por Server Action, então `supabase-js` fica
 * inteiro fora do bundle do cliente.
 */
export async function createServerSupabaseClient() {
  const config = readSupabaseConfig(process.env)
  if (!config) {
    throw new Error(
      'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local',
    )
  }

  const cookieStore = await cookies()

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(items) {
        try {
          for (const item of items) {
            cookieStore.set(item.name, item.value, item.options)
          }
        } catch {
          // Server Components não podem escrever cookie. O middleware renova a
          // sessão antes de chegar aqui, então engolir é correto — e não engolir
          // derrubaria toda leitura de página com um erro que não é erro.
        }
      },
    },
  })
}

/** Se a aplicação tem como falar com o banco. Lido pelas páginas. */
export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig(process.env) !== null
}
```

- [ ] **Passo 7: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 8: Commit**

```bash
git add package.json package-lock.json src/lib/supabase/ CHANGELOG.md
git commit -m "feat: cliente supabase por requisicao, so no servidor"
```

Changelog, em `### Adicionado`:

```markdown
- Conexão com o Supabase, criada por requisição e apenas no servidor: nenhum
  quilobyte de cliente de banco entra no navegador, num produto cujo peso de
  JavaScript já é quase todo mapa
```

---

## Tarefa 3: Sessão e proteção de rotas

**Arquivos:**
- Criar: `src/lib/supabase/middleware.ts`
- Criar: `src/middleware.ts`

**Interfaces:**
- Consome: `readSupabaseConfig` da Tarefa 2
- Produz: `export async function updateSession(request: NextRequest): Promise<NextResponse>`

- [ ] **Passo 1: Implementar a renovação de sessão**

Criar `src/lib/supabase/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { readSupabaseConfig } from './config'

/** Rotas alcançáveis sem sessão. */
const PUBLIC_PATHS = ['/entrar', '/auth/callback']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path))
}

/**
 * Renova a sessão e barra rota privada sem usuário.
 *
 * Precisa acontecer no middleware porque Server Components não podem escrever
 * cookie: se o refresh do token acontecesse na leitura da página, o cookie novo
 * nunca chegaria ao navegador e a sessão morreria na expiração seguinte.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const config = readSupabaseConfig(process.env)
  // Sem configuração não há sessão a renovar. Deixar passar é o que permite à
  // página mostrar o estado explícito de "não configurado" em vez de um
  // redirecionamento em laço para uma tela de login que também não funcionaria.
  if (!config) return response

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(items) {
        for (const item of items) {
          request.cookies.set(item.name, item.value)
        }
        response = NextResponse.next({ request })
        for (const item of items) {
          response.cookies.set(item.name, item.value, item.options)
        }
      },
    },
  })

  // `getUser` e não `getSession`: só o primeiro valida o token contra o servidor
  // de autenticação. `getSession` confia no cookie, que é falsificável.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isPublic(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    // Preserva para onde a pessoa ia. Sessão que expira no meio de uma tarefa
    // não deveria custar o contexto da tarefa.
    url.searchParams.set('proximo', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return response
}
```

- [ ] **Passo 2: Registrar o middleware**

Criar `src/middleware.ts`:

```ts
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Tudo, menos estáticos e imagens. O filtro fino de quais rotas exigem sessão
  // fica em `updateSession`, junto da lista de rotas públicas, para não haver
  // duas listas que possam divergir.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Passo 3: Verificar que rota privada redireciona**

Executar: `npm run dev` e abrir `http://localhost:3000/`
Esperado: redireciona para `/entrar?proximo=%2F`. A tela ainda não existe, então
o Next mostrará 404 — isso **confirma** que o redirecionamento aconteceu.
A Tarefa 4 cria a tela.

- [ ] **Passo 4: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 5: Commit**

```bash
git add src/middleware.ts src/lib/supabase/middleware.ts CHANGELOG.md
git commit -m "feat: sessao renovada no middleware e rotas privadas protegidas"
```

Changelog, em `### Adicionado`:

```markdown
- As telas do aplicativo passam a exigir sessão, e uma sessão que expira no meio
  de uma tarefa devolve você ao ponto onde estava depois de entrar, em vez de
  jogar na tela inicial
```

---

## Tarefa 4: Entrar pelo Google e sair

**Arquivos:**
- Criar: `src/app/entrar/page.tsx`
- Criar: `src/app/entrar/actions.ts`
- Criar: `src/app/auth/callback/route.ts`
- Modificar: `src/components/layout/TopBar.tsx`

**Interfaces:**
- Consome: `createServerSupabaseClient`, `isSupabaseConfigured` da Tarefa 2
- Produz:
  ```ts
  // src/app/entrar/actions.ts
  export async function signInWithGoogleAction(formData: FormData): Promise<void>
  export async function signOutAction(): Promise<void>
  ```

- [ ] **Passo 1: Implementar as ações de entrar e sair**

Criar `src/app/entrar/actions.ts`:

```ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const origin = (await headers()).get('origin') ?? 'http://localhost:3000'
  const next = formData.get('proximo')
  const callback = new URL('/auth/callback', origin)
  if (typeof next === 'string' && next.startsWith('/')) {
    // Só caminho relativo. Aceitar URL absoluta aqui seria um redirecionamento
    // aberto: qualquer link poderia mandar a pessoa para fora depois de entrar.
    callback.searchParams.set('proximo', next)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback.toString() },
  })

  if (error || !data.url) {
    redirect('/entrar?erro=oauth')
  }

  // O fluxo PKCE guarda o verificador num cookie escrito pelo cliente de
  // servidor. É por isso que iniciar o login aqui, e não no navegador, mantém
  // `supabase-js` fora do bundle do cliente.
  redirect(data.url)
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/entrar')
}
```

- [ ] **Passo 2: Implementar o handler de callback**

Criar `src/app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('proximo')
  const destination = next && next.startsWith('/') ? next : '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?erro=sem-codigo`)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/entrar?erro=troca`)
  }

  return NextResponse.redirect(`${origin}${destination}`)
}
```

- [ ] **Passo 3: Implementar a tela de entrada**

Criar `src/app/entrar/page.tsx`:

```tsx
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { signInWithGoogleAction } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  oauth: 'O Google não respondeu. Tente novamente.',
  'sem-codigo': 'A volta do Google veio sem o código de autorização.',
  troca: 'O código de autorização não foi aceito. Tente entrar de novo.',
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>
}) {
  const { proximo, erro } = await searchParams
  const configured = isSupabaseConfigured()

  return (
    <main className="flex h-screen flex-col items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm border-t border-line pt-8">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-ink uppercase">
          <span aria-hidden className="h-3.5 w-0.5 bg-accent" />
          Rastro
        </span>

        <h1 className="mt-6 text-lg leading-tight font-medium text-ink">
          O mapa da sua vida sobre duas rodas
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Onde você já esteve, o que ainda quer conhecer, e as histórias que
          ficaram dessas viagens.
        </p>

        {configured ? (
          <form action={signInWithGoogleAction} className="mt-8">
            <input type="hidden" name="proximo" value={proximo ?? '/'} />
            <Button type="submit" variant="outline" className="w-full">
              Entrar com o Google
            </Button>
          </form>
        ) : (
          <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-ink-muted">
            O banco de dados não está configurado. Defina{' '}
            <span className="instrument-value">NEXT_PUBLIC_SUPABASE_URL</span> e{' '}
            <span className="instrument-value">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>{' '}
            em <span className="instrument-value">.env.local</span> e reinicie o
            servidor.
          </p>
        )}

        {erro ? (
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            {ERROR_MESSAGES[erro] ?? 'Não foi possível entrar.'}
          </p>
        ) : null}
      </div>
    </main>
  )
}
```

> Se `Button` não aceitar `variant="outline"` nem a prop `type`, verifique
> `src/components/ui/Button.tsx` e use a variante de contorno que já existe ali —
> a mesma que `DiscoveryLauncher` usa. Não invente uma variante nova.

- [ ] **Passo 4: Acrescentar "Sair" na TopBar**

Em `src/components/layout/TopBar.tsx`, depois do `</nav>` e antes do
`</header>`, acrescentar:

```tsx
      <form action={signOutAction} className="ml-auto shrink-0">
        <button
          type="submit"
          className="px-2 py-2.5 text-[11px] tracking-[0.12em] whitespace-nowrap
                     text-ink-faint uppercase transition-colors hover:text-ink-muted"
        >
          Sair
        </button>
      </form>
```

E o import no topo:

```tsx
import { signOutAction } from '@/app/entrar/actions'
```

- [ ] **Passo 5: Verificar o fluxo completo**

Executar: `npm run dev`, abrir `http://localhost:3000/viagens`

Esperado, em ordem:
1. Redireciona para `/entrar?proximo=%2Fviagens`
2. "Entrar com o Google" leva ao consentimento do Google
3. A volta cai em `/viagens`, não em `/`
4. Recarregar mantém a sessão
5. "Sair" volta para `/entrar`
6. No SQL Editor, `select id, display_name from profiles;` mostra **uma linha**
   com o nome vindo do Google — prova de que o trigger da Tarefa 1 disparou

- [ ] **Passo 6: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 7: Commit**

```bash
git add src/app/entrar/ src/app/auth/ src/components/layout/TopBar.tsx CHANGELOG.md
git commit -m "feat: entrada pelo google e saida"
```

Changelog, em `### Adicionado`:

```markdown
- Entrada pelo Google, em um toque e sem senha — o produto é usado na estrada, e
  digitar senha de luva não é um requisito razoável
- A tela de entrada diz em texto quando o banco não está configurado, em vez de
  oferecer um botão que falharia em silêncio
```

---

## Tarefa 5: O modelo de leitura ganha visitas e propriedade

**Arquivos:**
- Modificar: `src/domain/place.ts`
- Modificar: `src/domain/place.test.ts`
- Criar: `src/domain/slug.ts`
- Criar: `src/domain/slug.test.ts`

**Interfaces:**
- Consome: nada
- Produz:
  ```ts
  // src/domain/place.ts
  export interface PlaceVisit {
    id: string
    /** Data civil, `YYYY-MM-DD`. Sem hora: a memória é do dia, não do instante. */
    visitedAt: string
    notes: string | null
    rating: number | null
  }
  export interface ExplorePlace extends Place {
    visitStatus: VisitStatus
    isFavorite: boolean
    photoCount: number
    lastVisitedAt: string | null
    visits: PlaceVisit[]
    isOwn: boolean
  }
  export function toExplorePlace(
    place: Place,
    userState: PlaceUserState,
    visits?: PlaceVisit[],
    isOwn?: boolean,
  ): ExplorePlace
  export interface NewPlace {
    name: string
    description: string
    latitude: number
    longitude: number
    municipality: string
    category: PlaceCategory
    tags: string[]
  }
  export type PlaceValidationError =
    | 'name-required' | 'name-too-long' | 'latitude-out-of-range'
    | 'longitude-out-of-range' | 'invalid-category'
  export const PLACE_VALIDATION_MESSAGES: Record<PlaceValidationError, string>
  export function validateNewPlace(input: NewPlace): PlaceValidationError[]

  // src/domain/slug.ts
  export function slugify(value: string): string
  export function uniqueSlug(base: string, taken: readonly string[]): string
  ```

- [ ] **Passo 1: Escrever os testes de slug que falham**

Criar `src/domain/slug.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { slugify, uniqueSlug } from './slug'

describe('slugify', () => {
  it('normaliza acentos, caixa e espaço', () => {
    expect(slugify('Serra do Rio do Rastro')).toBe('serra-do-rio-do-rastro')
    expect(slugify('Grão-Pará')).toBe('grao-para')
    expect(slugify('Praia  do   Rosa')).toBe('praia-do-rosa')
  })

  it('descarta pontuação e apara hifens das pontas', () => {
    expect(slugify('  — Café do Mirante! ')).toBe('cafe-do-mirante')
  })

  it('devolve string vazia quando não sobra nada', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('uniqueSlug', () => {
  it('devolve a base quando ela está livre', () => {
    expect(uniqueSlug('mirante', ['praia'])).toBe('mirante')
  })

  it('acrescenta sufixo numérico na primeira colisão', () => {
    expect(uniqueSlug('mirante', ['mirante'])).toBe('mirante-2')
  })

  it('pula sufixos já tomados', () => {
    expect(uniqueSlug('mirante', ['mirante', 'mirante-2', 'mirante-3'])).toBe(
      'mirante-4',
    )
  })

  // Um nome só de pontuação não pode virar slug vazio: `slug` é `not null unique`
  // no banco, e dois lugares assim colidiriam na string vazia.
  it('usa uma base neutra quando a base é vazia', () => {
    expect(uniqueSlug('', [])).toBe('lugar')
    expect(uniqueSlug('', ['lugar'])).toBe('lugar-2')
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Executar: `npx vitest run src/domain/slug.test.ts`
Esperado: FALHA com `Failed to resolve import "./slug"`.

- [ ] **Passo 3: Implementar `slug.ts`**

```ts
/** Base usada quando o nome não produz nenhum caractere aproveitável. */
const FALLBACK_SLUG = 'lugar'

/**
 * Nome legível para identificador de URL.
 *
 * `NFD` + remoção da faixa de marcas diacríticas resolve acentuação sem tabela
 * de substituição e sem dependência — é o mesmo caminho que o resto do projeto
 * escolheu ao recusar bibliotecas para trabalho pequeno.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    // Faixa das marcas diacríticas combinantes. Escrita escapada de propósito:
    // o caractere literal não sobrevive a cópia entre editores.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Primeiro slug livre a partir de uma base.
 *
 * `taken` é a lista de slugs que já existem. O sufixo começa em 2 porque
 * `nome-1` sugeriria que existe um `nome-0`.
 */
export function uniqueSlug(base: string, taken: readonly string[]): string {
  const start = base || FALLBACK_SLUG
  const used = new Set(taken)
  if (!used.has(start)) return start

  let suffix = 2
  while (used.has(`${start}-${suffix}`)) {
    suffix += 1
  }
  return `${start}-${suffix}`
}
```

- [ ] **Passo 4: Rodar e confirmar que passa**

Executar: `npx vitest run src/domain/slug.test.ts`
Esperado: 7 testes passando.

- [ ] **Passo 5: Escrever os testes de domínio que falham**

Acrescentar ao fim de `src/domain/place.test.ts`. **O arquivo já importa de
`./place` e de `vitest` no topo — mescle os nomes novos nesses imports em vez de
acrescentar uma segunda linha de import, que o ESLint recusa.**

```ts
// mesclar em: import { ... } from './place'
import { PLACE_VALIDATION_MESSAGES, validateNewPlace, type NewPlace } from './place'

const VALID: NewPlace = {
  name: 'Mirante da Serra',
  description: 'Vista do vale.',
  latitude: -28.1,
  longitude: -49.4,
  municipality: 'Urubici',
  category: 'mirante',
  tags: [],
}

describe('validateNewPlace', () => {
  it('não acusa nada num lugar válido', () => {
    expect(validateNewPlace(VALID)).toEqual([])
  })

  it('exige nome', () => {
    expect(validateNewPlace({ ...VALID, name: '   ' })).toEqual(['name-required'])
  })

  it('limita o tamanho do nome', () => {
    expect(validateNewPlace({ ...VALID, name: 'a'.repeat(121) })).toEqual([
      'name-too-long',
    ])
  })

  it('rejeita coordenada fora de faixa, espelhando as checks do banco', () => {
    expect(validateNewPlace({ ...VALID, latitude: -91 })).toEqual([
      'latitude-out-of-range',
    ])
    expect(validateNewPlace({ ...VALID, longitude: 181 })).toEqual([
      'longitude-out-of-range',
    ])
  })

  it('rejeita categoria fora da lista', () => {
    expect(
      validateNewPlace({ ...VALID, category: 'vulcao' as NewPlace['category'] }),
    ).toEqual(['invalid-category'])
  })

  it('acumula erros em vez de parar no primeiro', () => {
    expect(validateNewPlace({ ...VALID, name: '', latitude: 99 })).toEqual([
      'name-required',
      'latitude-out-of-range',
    ])
  })

  it('tem mensagem em PT-BR para todo erro possível', () => {
    for (const error of validateNewPlace({ ...VALID, name: '', latitude: 99 })) {
      expect(PLACE_VALIDATION_MESSAGES[error]).toBeTruthy()
    }
  })
})

describe('toExplorePlace', () => {
  const place = {
    id: 'p1', slug: 's', name: 'N', description: '', latitude: 0, longitude: 0,
    municipality: 'M', stateCode: 'SC', category: 'serra' as const, tags: [],
    coverImageUrl: null, source: 'manual' as const,
  }
  const state = {
    placeId: 'p1', isFavorite: false, wantsToVisit: false, personalNotes: null,
    rating: null, lastVisitedAt: null, visitCount: 0, photoCount: 0,
  }

  it('assume sem visitas e não próprio quando os argumentos são omitidos', () => {
    const result = toExplorePlace(place, state)
    expect(result.visits).toEqual([])
    expect(result.isOwn).toBe(false)
  })

  it('carrega as visitas e a propriedade quando informadas', () => {
    const visits = [
      { id: 'v1', visitedAt: '2026-07-27', notes: null, rating: null },
    ]
    const result = toExplorePlace(place, { ...state, visitCount: 1 }, visits, true)
    expect(result.visits).toEqual(visits)
    expect(result.isOwn).toBe(true)
    expect(result.visitStatus).toBe('visitado')
  })
})
```

- [ ] **Passo 6: Rodar e confirmar que falha**

Executar: `npx vitest run src/domain/place.test.ts`
Esperado: FALHA — `validateNewPlace` não é exportado.

- [ ] **Passo 7: Implementar as adições em `place.ts`**

Acrescentar a `src/domain/place.ts`:

```ts
/** Uma passagem registrada por um lugar. */
export interface PlaceVisit {
  id: string
  /** Data civil, `YYYY-MM-DD`. Sem hora: a memória é do dia, não do instante. */
  visitedAt: string
  notes: string | null
  rating: number | null
}

/** Campos que o usuário informa ao criar ou editar um lugar. */
export interface NewPlace {
  name: string
  description: string
  latitude: number
  longitude: number
  municipality: string
  category: PlaceCategory
  tags: string[]
}

export type PlaceValidationError =
  | 'name-required'
  | 'name-too-long'
  | 'latitude-out-of-range'
  | 'longitude-out-of-range'
  | 'invalid-category'

export const PLACE_VALIDATION_MESSAGES: Record<PlaceValidationError, string> = {
  'name-required': 'Dê um nome ao lugar.',
  'name-too-long': 'O nome passa de 120 caracteres.',
  'latitude-out-of-range': 'A latitude está fora da faixa de -90 a 90.',
  'longitude-out-of-range': 'A longitude está fora da faixa de -180 a 180.',
  'invalid-category': 'Escolha uma categoria da lista.',
}

const MAX_NAME_LENGTH = 120

/**
 * Erros de um lugar informado pelo usuário. Lista vazia significa válido.
 *
 * Acumula em vez de parar no primeiro: corrigir um campo por vez, com uma ida ao
 * servidor entre cada, é o tipo de formulário que este produto não quer ser.
 *
 * As faixas de coordenada espelham de propósito as constraints
 * `places_latitude_range` e `places_longitude_range` da migration 0001 — o banco
 * continua sendo a autoridade, e isto existe para que a recusa chegue em PT-BR
 * antes da ida ao servidor.
 */
export function validateNewPlace(input: NewPlace): PlaceValidationError[] {
  const errors: PlaceValidationError[] = []

  const name = input.name.trim()
  if (name.length === 0) errors.push('name-required')
  else if (name.length > MAX_NAME_LENGTH) errors.push('name-too-long')

  if (!Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90) {
    errors.push('latitude-out-of-range')
  }
  if (!Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180) {
    errors.push('longitude-out-of-range')
  }
  if (!PLACE_CATEGORIES.includes(input.category)) {
    errors.push('invalid-category')
  }

  return errors
}
```

Alterar `ExplorePlace` e `toExplorePlace`:

```ts
export interface ExplorePlace extends Place {
  visitStatus: VisitStatus
  isFavorite: boolean
  photoCount: number
  lastVisitedAt: string | null
  /**
   * Histórico completo, do mais recente ao mais antigo.
   *
   * Vive no modelo de lista, e não numa busca separada quando o painel abre,
   * porque o produto é pessoal: dezenas de lugares, poucas visitas cada. O embed
   * custa quase nada; uma busca sob demanda custaria um mecanismo de fetch no
   * cliente que não compra nada hoje.
   *
   * Gatilho para reconsiderar, no espírito do ADR 0004: catálogo passando de
   * alguns milhares de lugares, ou histórico de um lugar passando de algumas
   * dezenas de visitas.
   */
  visits: PlaceVisit[]
  /** Lugar criado por este usuário — o único que ele pode editar ou apagar. */
  isOwn: boolean
}

export function toExplorePlace(
  place: Place,
  userState: PlaceUserState,
  visits: PlaceVisit[] = [],
  isOwn = false,
): ExplorePlace {
  return {
    ...place,
    visitStatus: deriveVisitStatus(userState),
    isFavorite: userState.isFavorite,
    photoCount: userState.photoCount,
    lastVisitedAt: userState.lastVisitedAt,
    visits,
    isOwn,
  }
}
```

- [ ] **Passo 8: Rodar a suíte inteira**

Executar: `npm run test`
Esperado: tudo verde. Os defaults de `visits` e `isOwn` mantêm o adapter mock e
os testes existentes compilando sem alteração.

- [ ] **Passo 9: Verificar**

Executar: `npm run lint && npm run typecheck`
Esperado: os dois limpos.

- [ ] **Passo 10: Commit**

```bash
git add src/domain/ CHANGELOG.md
git commit -m "feat: visitas e propriedade no modelo de lugar, com validacao no dominio"
```

Changelog, em `### Adicionado`:

```markdown
- Um lugar passa a carregar o histórico de visitas e a informação de quem o
  criou — as duas coisas que o painel precisa para deixar de ser só leitura
- Validação de lugar como função pura e testada: nome, coordenada e categoria
  são recusados em português antes de qualquer ida ao servidor, espelhando as
  mesmas faixas que o banco impõe
```

---

## Tarefa 6: Leitura vinda do Supabase

**Arquivos:**
- Criar: `src/lib/data/supabase/place-row.ts`
- Criar: `src/lib/data/supabase/place-row.test.ts`
- Criar: `src/lib/data/supabase/supabase-place-repository.ts`
- Criar: `src/components/layout/DataFallback.tsx`
- Modificar: `src/lib/data/index.ts`
- Modificar: `src/app/(app)/page.tsx`, `src/app/(app)/descobrir/page.tsx`
- Mover: `src/lib/data/mock/mock-place-repository.ts` → `src/lib/data/mock/mock-place-repository.ts` (mantém o caminho; muda o papel)

**Interfaces:**
- Consome: `toExplorePlace`, `PlaceVisit`, `ExplorePlace` da Tarefa 5;
  `createServerSupabaseClient` da Tarefa 2
- Produz:
  ```ts
  // src/lib/data/supabase/place-row.ts
  export const PLACE_SELECT: string
  export interface PlaceRow { /* ver passo 3 */ }
  export function toExplorePlaceFromRow(row: PlaceRow, userId: string): ExplorePlace

  // src/lib/data/index.ts
  export async function getPlaceRepository(): Promise<PlaceRepository>
  ```

- [ ] **Passo 1: Escrever o teste de mapeamento que falha**

Criar `src/lib/data/supabase/place-row.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { toExplorePlaceFromRow, type PlaceRow } from './place-row'

const USER = 'u-1'

function row(overrides: Partial<PlaceRow> = {}): PlaceRow {
  return {
    id: 'p-1',
    slug: 'morro-da-igreja',
    name: 'Morro da Igreja',
    description: 'Ponto habitado mais alto do sul do país.',
    latitude: -28.1247,
    longitude: -49.4736,
    municipality: 'Urubici',
    state_code: 'SC',
    category: 'mirante',
    tags: ['altitude'],
    cover_image_url: null,
    source: 'mock',
    created_by: null,
    place_user_states: [],
    place_visits: [],
    ...overrides,
  }
}

describe('toExplorePlaceFromRow', () => {
  it('converte um lugar sem estado pessoal para o neutro', () => {
    const place = toExplorePlaceFromRow(row(), USER)
    expect(place.visitStatus).toBe('nao-visitado')
    expect(place.isFavorite).toBe(false)
    expect(place.visits).toEqual([])
    expect(place.isOwn).toBe(false)
  })

  // `description` e `municipality` são nulos no banco e string no domínio.
  // Sem esta conversão o painel imprimiria "null" na tela.
  it('converte nulos de texto em string vazia', () => {
    const place = toExplorePlaceFromRow(
      row({ description: null, municipality: null }),
      USER,
    )
    expect(place.description).toBe('')
    expect(place.municipality).toBe('')
  })

  it('lê o estado pessoal quando ele existe', () => {
    const place = toExplorePlaceFromRow(
      row({
        place_user_states: [
          {
            is_favorite: true,
            wants_to_visit: true,
            personal_notes: null,
            rating: null,
            last_visited_at: null,
            visit_count: 0,
            photo_count: 0,
          },
        ],
      }),
      USER,
    )
    expect(place.isFavorite).toBe(true)
    expect(place.visitStatus).toBe('quero-conhecer')
  })

  it('ordena as visitas da mais recente para a mais antiga', () => {
    const place = toExplorePlaceFromRow(
      row({
        place_user_states: [
          {
            is_favorite: false, wants_to_visit: false, personal_notes: null,
            rating: null, last_visited_at: '2026-07-27', visit_count: 2,
            photo_count: 0,
          },
        ],
        place_visits: [
          { id: 'v-1', visited_at: '2025-03-14', notes: null, rating: null },
          { id: 'v-2', visited_at: '2026-07-27', notes: 'chuva', rating: 5 },
        ],
      }),
      USER,
    )
    expect(place.visits.map((visit) => visit.visitedAt)).toEqual([
      '2026-07-27',
      '2025-03-14',
    ])
    expect(place.visitStatus).toBe('visitado')
  })

  it('marca como próprio o lugar criado por este usuário', () => {
    expect(toExplorePlaceFromRow(row({ created_by: USER }), USER).isOwn).toBe(true)
    expect(toExplorePlaceFromRow(row({ created_by: 'outro' }), USER).isOwn).toBe(
      false,
    )
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Executar: `npx vitest run src/lib/data/supabase/place-row.test.ts`
Esperado: FALHA com `Failed to resolve import "./place-row"`.

- [ ] **Passo 3: Implementar o mapeamento**

Criar `src/lib/data/supabase/place-row.ts`:

```ts
import {
  toExplorePlace,
  type ExplorePlace,
  type PlaceCategory,
  type PlaceSource,
  type PlaceUserState,
  type PlaceVisit,
} from '@/domain/place'

/**
 * Consulta única de leitura.
 *
 * Os dois embeds trazem apenas as linhas deste usuário — não porque a consulta
 * filtre, mas porque a RLS de `place_user_states` e `place_visits` filtra por
 * `auth.uid()`. Escopo por usuário é responsabilidade do banco. Ver ADR 0008.
 */
export const PLACE_SELECT = `
  id, slug, name, description, latitude, longitude, municipality,
  state_code, category, tags, cover_image_url, source, created_by,
  place_user_states (
    is_favorite, wants_to_visit, personal_notes, rating,
    last_visited_at, visit_count, photo_count
  ),
  place_visits ( id, visited_at, notes, rating )
`

interface PlaceUserStateRow {
  is_favorite: boolean
  wants_to_visit: boolean
  personal_notes: string | null
  rating: number | null
  last_visited_at: string | null
  visit_count: number
  photo_count: number
}

interface PlaceVisitRow {
  id: string
  visited_at: string
  notes: string | null
  rating: number | null
}

export interface PlaceRow {
  id: string
  slug: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  municipality: string | null
  state_code: string
  category: PlaceCategory
  tags: string[]
  cover_image_url: string | null
  source: PlaceSource
  created_by: string | null
  /**
   * Zero ou uma linha. A chave primária de `place_user_states` é
   * `(user_id, place_id)` e a RLS limita a um usuário, mas o PostgREST devolve
   * embed de um-para-muitos sempre como lista.
   */
  place_user_states: PlaceUserStateRow[]
  place_visits: PlaceVisitRow[]
}

function neutralState(placeId: string): PlaceUserState {
  return {
    placeId,
    isFavorite: false,
    wantsToVisit: false,
    personalNotes: null,
    rating: null,
    lastVisitedAt: null,
    visitCount: 0,
    photoCount: 0,
  }
}

function toUserState(row: PlaceRow): PlaceUserState {
  const state = row.place_user_states[0]
  if (!state) return neutralState(row.id)
  return {
    placeId: row.id,
    isFavorite: state.is_favorite,
    wantsToVisit: state.wants_to_visit,
    personalNotes: state.personal_notes,
    rating: state.rating,
    lastVisitedAt: state.last_visited_at,
    visitCount: state.visit_count,
    photoCount: state.photo_count,
  }
}

function toVisits(row: PlaceRow): PlaceVisit[] {
  return row.place_visits
    .map((visit) => ({
      id: visit.id,
      visitedAt: visit.visited_at,
      notes: visit.notes,
      rating: visit.rating,
    }))
    // Data ISO ordena lexicograficamente, então não é preciso construir `Date`.
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
}

/**
 * Linha do banco para o modelo de leitura. Função pura de propósito: é a parte
 * do adapter que carrega decisões e vale testar. O adapter fica só com a rede.
 */
export function toExplorePlaceFromRow(
  row: PlaceRow,
  userId: string,
): ExplorePlace {
  return toExplorePlace(
    {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? '',
      latitude: row.latitude,
      longitude: row.longitude,
      municipality: row.municipality ?? '',
      stateCode: row.state_code,
      category: row.category,
      tags: row.tags,
      coverImageUrl: row.cover_image_url,
      source: row.source,
    },
    toUserState(row),
    toVisits(row),
    row.created_by !== null && row.created_by === userId,
  )
}
```

- [ ] **Passo 4: Rodar e confirmar que passa**

Executar: `npx vitest run src/lib/data/supabase/place-row.test.ts`
Esperado: 5 testes passando.

- [ ] **Passo 5: Implementar o adapter**

Criar `src/lib/data/supabase/supabase-place-repository.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExplorePlace } from '@/domain/place'
import type { PlaceRepository } from '../place-repository'
import { PLACE_SELECT, toExplorePlaceFromRow, type PlaceRow } from './place-row'

export function createSupabasePlaceRepository(
  supabase: SupabaseClient,
  userId: string,
): PlaceRepository {
  async function list(): Promise<ExplorePlace[]> {
    const { data, error } = await supabase
      .from('places')
      .select(PLACE_SELECT)
      .order('name')

    if (error) {
      throw new Error(`falha ao ler lugares: ${error.message}`)
    }

    return (data as unknown as PlaceRow[]).map((row) =>
      toExplorePlaceFromRow(row, userId),
    )
  }

  return {
    async listExplorePlaces() {
      return list()
    },

    async getBySlug(slug) {
      const { data, error } = await supabase
        .from('places')
        .select(PLACE_SELECT)
        .eq('slug', slug)
        .maybeSingle()

      if (error) {
        throw new Error(`falha ao ler o lugar ${slug}: ${error.message}`)
      }
      if (!data) return null

      return toExplorePlaceFromRow(data as unknown as PlaceRow, userId)
    },
  }
}
```

- [ ] **Passo 6: Trocar o adapter ativo**

Substituir `src/lib/data/index.ts` inteiro:

```ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PlaceRepository } from './place-repository'
import { createSupabasePlaceRepository } from './supabase/supabase-place-repository'

/**
 * Repositório de leitura desta requisição.
 *
 * Função, e não constante, porque o adapter carrega a sessão da requisição. Um
 * singleton de módulo compartilharia sessão entre usuários.
 *
 * O adapter em memória deixou de ser alcançável em tempo de execução: ele existe
 * só como fixture dos testes de domínio. Cair nele quando o Supabase não está
 * configurado esconderia exatamente o defeito que importa enxergar — uma
 * aplicação que aceita "Marcar visitado" e não grava nada.
 */
export async function getPlaceRepository(): Promise<PlaceRepository> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('sem sessão: o middleware deveria ter redirecionado')
  }

  return createSupabasePlaceRepository(supabase, user.id)
}

export type { PlaceRepository }
```

- [ ] **Passo 7: Criar o estado de não configurado**

Criar `src/components/layout/DataFallback.tsx`:

```tsx
/**
 * Mesmo padrão do MapFallback: quando falta configuração, dizer o que falta em
 * texto, no lugar do conteúdo — nunca degradar em silêncio para dado falso.
 */
export function DataFallback() {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-void px-6">
      <div className="max-w-md border-t border-line pt-4">
        <span className="instrument-label">Banco não configurado</span>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Defina{' '}
          <span className="instrument-value">NEXT_PUBLIC_SUPABASE_URL</span> e{' '}
          <span className="instrument-value">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>{' '}
          em <span className="instrument-value">.env.local</span> e reinicie o
          servidor. Sem elas não há lugares para mostrar — e mostrar dados de
          exemplo aqui esconderia que nada seria gravado.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Passo 8: Ligar as duas páginas**

`src/app/(app)/page.tsx`:

```tsx
import { getPlaceRepository } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { DataFallback } from '@/components/layout/DataFallback'
import { ExploreView } from '@/components/explore/ExploreView'

export default async function ExplorePage() {
  if (!isSupabaseConfigured()) return <DataFallback />
  const repository = await getPlaceRepository()
  const places = await repository.listExplorePlaces()
  return <ExploreView places={places} />
}
```

`src/app/(app)/descobrir/page.tsx`: mesma mudança, trocando `ExploreView` por
`DiscoveryView` e mantendo o resto do arquivo como está.

- [ ] **Passo 9: Verificar no app rodando**

Executar: `npm run dev`, entrar, abrir `/`
Esperado: os 14 pins aparecem, vindos do banco. Prova: no SQL Editor rodar
`update places set name = 'Morro da Igreja (banco)' where slug = 'morro-da-igreja';`,
recarregar a página e ver o nome novo. Depois desfazer.

- [ ] **Passo 10: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 11: Commit**

```bash
git add src/lib/data/ src/components/layout/DataFallback.tsx \
        "src/app/(app)/page.tsx" "src/app/(app)/descobrir/page.tsx" CHANGELOG.md
git commit -m "feat: lugares lidos do banco, com o mock rebaixado a fixture"
```

Changelog, em `### Alterado`:

```markdown
- Os lugares passam a vir do banco, e não mais de um arquivo em memória. Sem
  configuração de banco a aplicação diz isso em texto, em vez de mostrar dados de
  exemplo e dar a impressão de que gravaria alguma coisa
```

---

## Tarefa 7: Perfil, origem e o fim do `DEV_USER_ID`

**Arquivos:**
- Criar: `src/domain/profile.ts`
- Criar: `src/lib/data/profile-repository.ts`
- Criar: `src/lib/data/supabase/supabase-profile-repository.ts`
- Criar: `src/components/layout/origin-context.tsx`
- Modificar: `src/lib/data/index.ts`, `src/mocks/user.ts`, `src/mocks/motorcycles.ts`
- Modificar: `src/app/(app)/layout.tsx`, `StatusBar.tsx`, `ExploreView.tsx`,
  `PlacePanel.tsx`, `PlaceList.tsx`, `DiscoveryView.tsx`, `DiscoveryForm.tsx`,
  `FilterRail.tsx`

**Interfaces:**
- Consome: `createServerSupabaseClient` da Tarefa 2
- Produz:
  ```ts
  // src/domain/profile.ts
  export interface Profile {
    id: string
    displayName: string | null
    home: Coordinates | null
    homeLabel: string | null
  }

  // src/lib/data/profile-repository.ts
  export interface ProfileRepository {
    getProfile(): Promise<Profile | null>
    setHome(home: Coordinates, label: string): Promise<void>
  }

  // src/lib/data/index.ts
  export async function getProfileRepository(): Promise<ProfileRepository>

  // src/components/layout/origin-context.tsx
  export function OriginProvider(props: {
    origin: Coordinates | null
    label: string | null
    children: React.ReactNode
  }): React.ReactElement
  /** `null` enquanto o usuário não definiu a origem. */
  export function useOrigin(): { origin: Coordinates | null; label: string | null }
  ```

- [ ] **Passo 1: Criar o tipo de domínio**

`src/domain/profile.ts`:

```ts
import type { Coordinates } from './geo'

/**
 * Quem está usando o produto.
 *
 * `home` é nulo até o usuário escolher a origem clicando no mapa. Nulo é um
 * estado legítimo e a interface precisa tratá-lo: raio e descoberta dependem de
 * uma origem, e inventar uma faria o produto mentir sobre distâncias.
 */
export interface Profile {
  id: string
  displayName: string | null
  home: Coordinates | null
  homeLabel: string | null
}
```

- [ ] **Passo 2: Criar o contrato e o adapter de perfil**

`src/lib/data/profile-repository.ts`:

```ts
import type { Coordinates } from '@/domain/geo'
import type { Profile } from '@/domain/profile'

export interface ProfileRepository {
  getProfile(): Promise<Profile | null>
  setHome(home: Coordinates, label: string): Promise<void>
}
```

`src/lib/data/supabase/supabase-profile-repository.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Coordinates } from '@/domain/geo'
import type { Profile } from '@/domain/profile'
import type { ProfileRepository } from '../profile-repository'

interface ProfileRow {
  id: string
  display_name: string | null
  home_label: string | null
  home_latitude: number | null
  home_longitude: number | null
}

export function createSupabaseProfileRepository(
  supabase: SupabaseClient,
  userId: string,
): ProfileRepository {
  return {
    async getProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, home_label, home_latitude, home_longitude')
        .eq('id', userId)
        .maybeSingle<ProfileRow>()

      if (error) throw new Error(`falha ao ler o perfil: ${error.message}`)
      if (!data) return null

      // As duas coordenadas andam juntas: meia origem não é origem.
      const home =
        data.home_latitude !== null && data.home_longitude !== null
          ? { latitude: data.home_latitude, longitude: data.home_longitude }
          : null

      return {
        id: data.id,
        displayName: data.display_name,
        home,
        homeLabel: data.home_label,
      }
    },

    async setHome(home: Coordinates, label: string) {
      const { error } = await supabase
        .from('profiles')
        .update({
          home_latitude: home.latitude,
          home_longitude: home.longitude,
          home_label: label,
        })
        .eq('id', userId)

      if (error) throw new Error(`falha ao gravar a origem: ${error.message}`)
    },
  }
}
```

- [ ] **Passo 3: Expor a fábrica**

Em `src/lib/data/index.ts`, extrair a obtenção do usuário e acrescentar a
segunda fábrica:

```ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PlaceRepository } from './place-repository'
import type { ProfileRepository } from './profile-repository'
import { createSupabasePlaceRepository } from './supabase/supabase-place-repository'
import { createSupabaseProfileRepository } from './supabase/supabase-profile-repository'

async function sessionContext() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('sem sessão: o middleware deveria ter redirecionado')
  }

  return { supabase, userId: user.id }
}

export async function getPlaceRepository(): Promise<PlaceRepository> {
  const { supabase, userId } = await sessionContext()
  return createSupabasePlaceRepository(supabase, userId)
}

export async function getProfileRepository(): Promise<ProfileRepository> {
  const { supabase, userId } = await sessionContext()
  return createSupabaseProfileRepository(supabase, userId)
}

export type { PlaceRepository, ProfileRepository }
```

Manter o comentário de bloco da Tarefa 6 sobre por que são funções e por que o
mock deixou de ser alcançável.

- [ ] **Passo 4: Criar o contexto de origem**

`src/components/layout/origin-context.tsx`:

```tsx
'use client'

import { createContext, useContext, useMemo } from 'react'
import type { Coordinates } from '@/domain/geo'

interface OriginValue {
  origin: Coordinates | null
  label: string | null
}

const OriginContext = createContext<OriginValue>({ origin: null, label: null })

/**
 * Origem do usuário, lida do perfil no servidor e distribuída à árvore de
 * cliente.
 *
 * Antes disto a origem era uma constante importada por cinco componentes, o que
 * significava que tornar a origem por usuário exigiria tocar em cada um deles a
 * cada mudança. Um contexto centraliza a decisão num lugar.
 */
export function OriginProvider({
  origin,
  label,
  children,
}: OriginValue & { children: React.ReactNode }) {
  const value = useMemo(() => ({ origin, label }), [origin, label])
  return <OriginContext.Provider value={value}>{children}</OriginContext.Provider>
}

/** `origin` é `null` enquanto o usuário não escolheu a dele. */
export function useOrigin(): OriginValue {
  return useContext(OriginContext)
}
```

- [ ] **Passo 5: Alimentar o contexto no layout**

Em `src/app/(app)/layout.tsx`, tornar a função `async`, ler o perfil e envolver
a árvore:

```tsx
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = isSupabaseConfigured()
    ? await (await getProfileRepository()).getProfile()
    : null

  return (
    <OriginProvider origin={profile?.home ?? null} label={profile?.homeLabel ?? null}>
      <MapProvider>
        {/* ... o restante da árvore atual, sem alteração ... */}
      </MapProvider>
    </OriginProvider>
  )
}
```

Imports novos: `getProfileRepository` de `@/lib/data`, `isSupabaseConfigured` de
`@/lib/supabase/server`, `OriginProvider` de
`@/components/layout/origin-context`.

- [ ] **Passo 6: Trocar os cinco consumidores de `DEFAULT_ORIGIN`**

Em cada arquivo, trocar o import de `@/mocks/user` por `useOrigin()`:

| Arquivo | Troca |
|---|---|
| `StatusBar.tsx` | `const { label } = useOrigin()`; mostrar `⌂ {label}` só quando `label` existir |
| `ExploreView.tsx` | `const { origin } = useOrigin()`; `filterPlaces(places, filters, origin)` |
| `PlaceList.tsx` | `const { origin } = useOrigin()` |
| `PlacePanel.tsx` | `const { origin, label } = useOrigin()` |
| `DiscoveryForm.tsx` | `const { label } = useOrigin()` |
| `DiscoveryView.tsx` | `const { origin } = useOrigin()`; `INITIAL_QUERY` deixa de ser constante de módulo e passa a ser construída com `useMemo` sobre `origin` |

`filterPlaces` e `estimateRoadKm` exigem `Coordinates`, não `null`. Onde a
origem for nula, **não calcular**:

- `ExploreView`: quando `origin === null`, aplicar os filtros com
  `{ ...filters, radiusKm: null }` sobre uma origem qualquer (o raio é o único
  critério que usa a origem — os outros três não). Passar `{ latitude: 0,
  longitude: 0 }` é seguro **apenas** porque `radiusKm` é nulo; deixar isso
  explícito em comentário.
- `PlacePanel` e `PlaceList`: sem origem, esconder a distância e o tempo em vez
  de mostrar um número medido de lugar nenhum.
- `DiscoveryView`: sem origem, renderizar no lugar do formulário um bloco de uma
  frase — "Defina sua origem para descobrir destinos" — com um link para
  `/perfil/origem` (criado na Tarefa 9).

- [ ] **Passo 7: Desabilitar o raio sem origem**

Em `src/components/explore/FilterRail.tsx`, receber `hasOrigin: boolean` por
prop (passado por `ExploreView`) e, quando falso, substituir a linha de chips de
raio por:

```tsx
<p className="text-[11px] leading-relaxed text-ink-muted">
  O raio precisa de uma origem.{' '}
  <Link href="/perfil/origem" className="text-accent">
    Defina a sua
  </Link>
  .
</p>
```

E, no leitor de filtros da URL (`use-explore-filters.ts`), **ignorar** o
parâmetro `raio` quando não há origem — o ADR 0006 mantém a URL como fonte do
estado, e ela deixa de poder afirmar um recorte que o perfil não sustenta.
Implementar recebendo `hasOrigin` no hook e devolvendo `radiusKm: null` quando
falso.

- [ ] **Passo 8: Remover `DEV_USER_ID`**

Em `src/mocks/user.ts`, apagar `DEV_USER_ID`. Renomear `DEFAULT_ORIGIN` para
`FALLBACK_ORIGIN` com o comentário:

```ts
/**
 * Origem usada apenas pelos testes de domínio, que precisam de um ponto fixo
 * para asserções de distância. A aplicação lê a origem do perfil do usuário —
 * ver `origin-context.tsx`.
 */
```

Atualizar os testes de `filters.test.ts` e `discovery.test.ts` que importam
`DEFAULT_ORIGIN` para o nome novo.

Em `src/mocks/motorcycles.ts`, trocar `userId: DEV_USER_ID` por
`userId: 'fixture-user'`, com comentário de que o arquivo é fixture.

- [ ] **Passo 9: Verificar no app**

Executar: `npm run dev`
Esperado: a aplicação carrega, a `StatusBar` **não** mostra o campo de origem, a
trilha de filtros mostra a frase no lugar dos chips de raio, e `/descobrir`
mostra o aviso de origem. Nenhum número de distância aparece no painel.

- [ ] **Passo 10: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 11: Commit**

```bash
git add src/domain/profile.ts src/lib/data/ src/components/ src/mocks/ \
        "src/app/(app)/layout.tsx" CHANGELOG.md
git commit -m "feat: origem vinda do perfil do usuario, sem usuario fixo"
```

Changelog, em `### Alterado`:

```markdown
- A origem das distâncias passa a ser sua, lida do seu perfil, em vez de uma
  constante fixa em Palhoça
- Sem origem definida, o raio e a descoberta dizem que precisam de uma e
  oferecem o caminho, em vez de calcular distâncias a partir de um ponto que não
  é o seu
```

E em `### Removido`:

```markdown
- O usuário fixo de desenvolvimento, substituído pela conta autenticada de verdade
```

---

## Tarefa 8: Escolher um ponto no mapa

**Arquivos:**
- Criar: `src/components/map/picker-context.tsx`
- Criar: `src/components/map/PointPicker.tsx`
- Modificar: `src/app/(app)/layout.tsx`, `src/components/layout/StatusBar.tsx`

**Interfaces:**
- Consome: `useMapInstance` de `map-context`
- Produz:
  ```ts
  // src/components/map/picker-context.tsx
  export function PickerProvider(props: { children: React.ReactNode }): React.ReactElement
  export function usePickerState(): { active: boolean; cursor: Coordinates | null }
  export function usePickerControls(): {
    setActive: (value: boolean) => void
    setCursor: (value: Coordinates | null) => void
  }

  // src/components/map/PointPicker.tsx
  export function PointPicker(props: {
    onPick: (point: Coordinates) => void
  }): null
  ```

- [ ] **Passo 1: Criar o contexto do picker**

`src/components/map/picker-context.tsx`:

```tsx
'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { Coordinates } from '@/domain/geo'

interface PickerContextValue {
  active: boolean
  cursor: Coordinates | null
  setActive: (value: boolean) => void
  setCursor: (value: Coordinates | null) => void
}

const PickerContext = createContext<PickerContextValue | null>(null)

/**
 * Estado do modo de escolha de ponto.
 *
 * Vive no layout, e não dentro do componente que escolhe, porque a StatusBar
 * precisa saber que a mira está ativa — e ela é irmã do mapa, não filha do
 * formulário.
 */
export function PickerProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false)
  const [cursor, setCursor] = useState<Coordinates | null>(null)

  const value = useMemo(
    () => ({ active, cursor, setActive, setCursor }),
    [active, cursor],
  )

  return <PickerContext.Provider value={value}>{children}</PickerContext.Provider>
}

function usePickerContext(): PickerContextValue {
  const context = useContext(PickerContext)
  if (!context) {
    throw new Error('os hooks de picker precisam estar dentro de <PickerProvider>')
  }
  return context
}

export function usePickerState() {
  const { active, cursor } = usePickerContext()
  return { active, cursor }
}

export function usePickerControls() {
  const { setActive, setCursor } = usePickerContext()
  return { setActive, setCursor }
}
```

- [ ] **Passo 2: Criar o componente de escolha**

`src/components/map/PointPicker.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import type { MapMouseEvent } from 'maplibre-gl'
import type { Coordinates } from '@/domain/geo'
import { useMapInstance } from './map-context'
import { usePickerControls } from './picker-context'

/**
 * Põe o mapa em modo de mira: o cursor vira cruz, a coordenada sob ele é
 * publicada na StatusBar, e o clique devolve o ponto.
 *
 * Não desenha nada — o retorno é `null`, como `PlacesLayer`. Quem manda no mapa
 * são efeitos, não JSX.
 */
export function PointPicker({
  onPick,
}: {
  onPick: (point: Coordinates) => void
}): null {
  const map = useMapInstance()
  const { setActive, setCursor } = usePickerControls()

  useEffect(() => {
    if (!map) return

    setActive(true)
    const canvas = map.getCanvas()
    const previousCursor = canvas.style.cursor
    canvas.style.cursor = 'crosshair'

    function handleMove(event: MapMouseEvent) {
      setCursor({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    }

    function handleClick(event: MapMouseEvent) {
      onPick({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    }

    map.on('mousemove', handleMove)
    map.on('click', handleClick)

    return () => {
      map.off('mousemove', handleMove)
      map.off('click', handleClick)
      canvas.style.cursor = previousCursor
      setActive(false)
      setCursor(null)
    }
  }, [map, onPick, setActive, setCursor])

  return null
}
```

> `onPick` precisa ter identidade estável entre renders (`useCallback` no
> consumidor), ou o efeito remonta a cada quadro e o modo de mira pisca. Mesmo
> contrato que `useExitTransition` documenta.

- [ ] **Passo 3: Registrar o provider no layout**

Em `src/app/(app)/layout.tsx`, envolver a árvore existente com
`<PickerProvider>`, por dentro de `<MapProvider>`.

- [ ] **Passo 4: A StatusBar vira instrumento de mira**

Em `src/components/layout/StatusBar.tsx`, ler `usePickerState()` e, quando
`active` for verdadeiro, substituir a coordenada da câmera pela do cursor, em
âmbar:

```tsx
const { active, cursor } = usePickerState()
const shown = active ? cursor : view?.center ?? null
```

```tsx
<span
  className={cn(
    'instrument-value text-[10px] whitespace-nowrap',
    active ? 'text-accent' : 'text-ink-faint',
  )}
>
  {active ? '⌖ mira ' : '⌖ '}
  {shown
    ? `${formatCoordinate(shown.latitude)} ${formatCoordinate(shown.longitude)}`
    : '—.———— —.————'}
</span>
```

A coordenada ao vivo já existia e não servia para nada. Registrar o motivo em
comentário: durante a mira ela **é** o que vai ser gravado.

- [ ] **Passo 5: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos. Nada consome `PointPicker` ainda — a Tarefa 9 é o
primeiro consumidor.

- [ ] **Passo 6: Commit**

```bash
git add src/components/map/picker-context.tsx src/components/map/PointPicker.tsx \
        "src/app/(app)/layout.tsx" src/components/layout/StatusBar.tsx CHANGELOG.md
git commit -m "feat: escolha de coordenada por clique no mapa, com a statusbar como mira"
```

Changelog, em `### Adicionado`:

```markdown
- Escolher uma coordenada passa a ser um clique no mapa, e a coordenada ao vivo
  da barra de status — que até aqui era só mostrador — vira a mira: o número que
  você lê é o que vai ser gravado
```

---

## Tarefa 9: Definir a origem no primeiro acesso

**Arquivos:**
- Criar: `src/app/actions/result.ts`
- Criar: `src/app/actions/profile-actions.ts`
- Criar: `src/app/(app)/perfil/origem/page.tsx`
- Criar: `src/components/onboarding/OriginSetup.tsx`

**Interfaces:**
- Consome: `PointPicker` da Tarefa 8, `getProfileRepository` da Tarefa 7
- Produz:
  ```ts
  // src/app/actions/result.ts
  export type ActionResult = { ok: true } | { ok: false; message: string }

  // src/app/actions/profile-actions.ts
  export async function setHomeAction(
    latitude: number, longitude: number, label: string,
  ): Promise<ActionResult>
  ```

- [ ] **Passo 1: Criar o tipo de resultado**

`src/app/actions/result.ts`:

```ts
/**
 * Resultado de uma Server Action.
 *
 * Recusa vira mensagem em PT-BR, nunca exceção que sobe até uma tela de erro:
 * uma escrita recusada é informação para o usuário, não uma falha do aplicativo.
 */
export type ActionResult = { ok: true } | { ok: false; message: string }
```

- [ ] **Passo 2: Criar a ação de origem**

`src/app/actions/profile-actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getProfileRepository } from '@/lib/data'
import type { ActionResult } from './result'

export async function setHomeAction(
  latitude: number,
  longitude: number,
  label: string,
): Promise<ActionResult> {
  const trimmed = label.trim()
  if (!trimmed) {
    return { ok: false, message: 'Dê um nome ao ponto de partida.' }
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { ok: false, message: 'A coordenada está fora de faixa.' }
  }

  try {
    const repository = await getProfileRepository()
    await repository.setHome({ latitude, longitude }, trimmed)
  } catch {
    return { ok: false, message: 'Não foi possível gravar a origem.' }
  }

  // `'layout'` porque a origem é lida no layout de `(app)` e alimenta toda a
  // árvore: revalidar só a rota atual deixaria a StatusBar desatualizada.
  revalidatePath('/', 'layout')
  return { ok: true }
}
```

- [ ] **Passo 3: Criar a tela de origem**

`src/app/(app)/perfil/origem/page.tsx`:

```tsx
import { OriginSetup } from '@/components/onboarding/OriginSetup'

export default function OrigemPage() {
  return (
    <>
      <h1 className="sr-only">Definir origem</h1>
      <OriginSetup />
    </>
  )
}
```

- [ ] **Passo 4: Criar o componente**

`src/components/onboarding/OriginSetup.tsx`:

```tsx
'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatCoordinate, type Coordinates } from '@/domain/geo'
import { setHomeAction } from '@/app/actions/profile-actions'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { PointPicker } from '@/components/map/PointPicker'
import { Button } from '@/components/ui/Button'
import { useOrigin } from '@/components/layout/origin-context'

export function OriginSetup() {
  const router = useRouter()
  const { origin: current } = useOrigin()
  const [point, setPoint] = useState<Coordinates | null>(current)
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Identidade estável: sem `useCallback`, o efeito do PointPicker remonta a
  // cada render e o modo de mira pisca.
  const handlePick = useCallback((picked: Coordinates) => {
    setPoint(picked)
  }, [])

  function save() {
    if (!point) return
    startTransition(async () => {
      const result = await setHomeAction(point.latitude, point.longitude, label)
      if (result.ok) router.push('/')
      else setError(result.message)
    })
  }

  return (
    <>
      <PointPicker onPick={handlePick} />

      <OverlayPanel side="right">
        <div className="flex flex-1 flex-col gap-4 px-5 py-4">
          <div>
            <span className="instrument-label">Ponto de partida</span>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Clique no mapa onde suas viagens começam. Toda distância e todo
              cálculo de tempo do Rastro partem daqui.
            </p>
          </div>

          <div className="border-t border-line pt-3">
            <span className="instrument-label">Coordenada</span>
            <p className="instrument-value mt-1 text-sm text-ink">
              {point
                ? `${formatCoordinate(point.latitude)} ${formatCoordinate(point.longitude)}`
                : 'aguardando o clique'}
            </p>
          </div>

          <label className="block">
            <span className="instrument-label">Como chamar</span>
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Palhoça, SC"
              className="mt-1.5 w-full border border-line bg-raised px-2 py-1.5
                         text-sm text-ink placeholder:text-ink-faint"
            />
          </label>

          {error ? (
            <p className="text-xs leading-relaxed text-ink-muted">{error}</p>
          ) : null}

          <Button
            type="button"
            variant="solid"
            size="sm"
            onClick={save}
            disabled={!point || pending}
            className="w-full"
          >
            {pending ? 'Gravando…' : 'Definir origem'}
          </Button>
        </div>
      </OverlayPanel>
    </>
  )
}
```

- [ ] **Passo 5: Verificar no app**

Executar: `npm run dev`, abrir `/perfil/origem`

Esperado:
1. O cursor sobre o mapa vira cruz e a `StatusBar` mostra `⌖ mira` em âmbar com
   a coordenada correndo
2. Clicar congela a coordenada no painel
3. Gravar leva a `/`, a `StatusBar` mostra `⌂ <rótulo>`, os chips de raio voltam
   e as distâncias aparecem no painel de lugar
4. No SQL Editor: `select home_label, home_latitude from profiles;` mostra o
   valor gravado

- [ ] **Passo 6: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 7: Commit**

```bash
git add src/app/actions/ "src/app/(app)/perfil/" src/components/onboarding/ CHANGELOG.md
git commit -m "feat: definicao da origem clicando no mapa"
```

Changelog, em `### Adicionado`:

```markdown
- Você define seu ponto de partida clicando no mapa, e todas as distâncias do
  produto passam a ser medidas de onde suas viagens realmente começam
```

---

## Tarefa 10: Favorito — a primeira escrita

> **Marco da fase.** Quando esta tarefa passa, RLS, sessão, Server Action,
> revalidação e estado otimista estão provados juntos. As tarefas 11 a 14
> repetem este padrão.

**Arquivos:**
- Criar: `src/lib/data/place-state-repository.ts`
- Criar: `src/lib/data/supabase/supabase-place-state-repository.ts`
- Criar: `src/app/actions/place-state-actions.ts`
- Criar: `src/components/explore/PlaceStateControls.tsx`
- Modificar: `src/lib/data/index.ts`, `src/components/explore/PlacePanel.tsx`

**Interfaces:**
- Consome: `ActionResult` da Tarefa 9, `ExplorePlace` da Tarefa 5
- Produz:
  ```ts
  // src/lib/data/place-state-repository.ts
  export interface PlaceStateRepository {
    setFavorite(placeId: string, value: boolean): Promise<void>
    setWantsToVisit(placeId: string, value: boolean): Promise<void>
    recordVisit(placeId: string, visitedAt: string): Promise<void>
    updateVisitDate(visitId: string, visitedAt: string): Promise<void>
    removeVisit(visitId: string): Promise<void>
  }

  // src/lib/data/index.ts
  export async function getPlaceStateRepository(): Promise<PlaceStateRepository>

  // src/app/actions/place-state-actions.ts
  export async function setFavoriteAction(
    placeId: string, value: boolean,
  ): Promise<ActionResult>
  ```

- [ ] **Passo 1: Criar o contrato**

`src/lib/data/place-state-repository.ts`:

```ts
/**
 * Escrita do vínculo entre o usuário e um lugar.
 *
 * Separado de `PlaceCatalogRepository` de propósito: é a mesma divisa que o
 * ADR 0003 traçou entre fato objetivo e opinião. Favorito e visita são meus;
 * o lugar não é necessariamente.
 *
 * `recordVisit` acumula em vez de alternar: `visitado` não é uma chave, é
 * consequência de existir linha em `place_visits`. Um `setVisited(false)` só
 * poderia ser implementado apagando memória.
 */
export interface PlaceStateRepository {
  setFavorite(placeId: string, value: boolean): Promise<void>
  setWantsToVisit(placeId: string, value: boolean): Promise<void>
  recordVisit(placeId: string, visitedAt: string): Promise<void>
  updateVisitDate(visitId: string, visitedAt: string): Promise<void>
  removeVisit(visitId: string): Promise<void>
}
```

- [ ] **Passo 2: Implementar o adapter**

`src/lib/data/supabase/supabase-place-state-repository.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlaceStateRepository } from '../place-state-repository'

export function createSupabasePlaceStateRepository(
  supabase: SupabaseClient,
  userId: string,
): PlaceStateRepository {
  /**
   * `upsert` e não `update`: a linha de `place_user_states` só nasce na primeira
   * interação. Um `update` sobre linha inexistente não falharia — não afetaria
   * nenhuma linha e devolveria sucesso, que é o pior resultado possível.
   */
  async function setFlag(
    placeId: string,
    patch: { is_favorite?: boolean; wants_to_visit?: boolean },
  ) {
    const { error } = await supabase
      .from('place_user_states')
      .upsert(
        { user_id: userId, place_id: placeId, ...patch, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,place_id' },
      )
    if (error) throw new Error(error.message)
  }

  return {
    async setFavorite(placeId, value) {
      await setFlag(placeId, { is_favorite: value })
    },

    async setWantsToVisit(placeId, value) {
      await setFlag(placeId, { wants_to_visit: value })
    },

    async recordVisit(placeId, visitedAt) {
      const { error } = await supabase
        .from('place_visits')
        .insert({ user_id: userId, place_id: placeId, visited_at: visitedAt })
      if (error) throw new Error(error.message)
    },

    async updateVisitDate(visitId, visitedAt) {
      const { error } = await supabase
        .from('place_visits')
        .update({ visited_at: visitedAt })
        .eq('id', visitId)
      if (error) throw new Error(error.message)
    },

    async removeVisit(visitId) {
      const { error } = await supabase
        .from('place_visits')
        .delete()
        .eq('id', visitId)
      if (error) throw new Error(error.message)
    },
  }
}
```

> Nenhum `.eq('user_id', userId)` nos três últimos: a RLS de `place_visits` já
> restringe a `auth.uid()`. Repetir aqui daria a impressão de que a segurança
> depende deste arquivo. Ver ADR 0008.

- [ ] **Passo 3: Expor a fábrica**

Em `src/lib/data/index.ts`, acrescentar:

```ts
export async function getPlaceStateRepository(): Promise<PlaceStateRepository> {
  const { supabase, userId } = await sessionContext()
  return createSupabasePlaceStateRepository(supabase, userId)
}
```

Com o import e a reexportação do tipo.

- [ ] **Passo 4: Criar a Server Action**

`src/app/actions/place-state-actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getPlaceStateRepository } from '@/lib/data'
import type { ActionResult } from './result'

export async function setFavoriteAction(
  placeId: string,
  value: boolean,
): Promise<ActionResult> {
  try {
    const repository = await getPlaceStateRepository()
    await repository.setFavorite(placeId, value)
  } catch {
    return { ok: false, message: 'Não foi possível salvar. Tente de novo.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
```

- [ ] **Passo 5: Criar o controle**

`src/components/explore/PlaceStateControls.tsx`:

```tsx
'use client'

import { useOptimistic, useState, useTransition } from 'react'
import type { ExplorePlace } from '@/domain/place'
import { setFavoriteAction } from '@/app/actions/place-state-actions'
import { cn } from '@/lib/utils/cn'

/**
 * Favorito, no vocabulário do mapa.
 *
 * O estado ativo usa o mesmo âmbar do anel de favorito do pin, e não uma cor de
 * formulário: o painel conta a mesma história que o mapa, com o mesmo código de
 * cor. Ver ADR 0005.
 *
 * `useOptimistic` porque uma ida ao servidor num toggle devolveria ao produto a
 * inércia que o passe de movimento tirou dele. O pin muda no quadro seguinte ao
 * toque; se o servidor recusar, volta com a razão em texto.
 */
export function PlaceStateControls({ place }: { place: ExplorePlace }) {
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [favorite, setFavorite] = useOptimistic(place.isFavorite)

  function toggleFavorite() {
    const next = !favorite
    startTransition(async () => {
      setFavorite(next)
      setError(null)
      const result = await setFavoriteAction(place.id, next)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <div className="border-b border-line px-5 py-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleFavorite}
          aria-pressed={favorite}
          className={cn(
            'border px-2 py-1.5 text-[10px] tracking-[0.14em] uppercase',
            'transition-colors',
            favorite
              ? 'border-accent text-accent'
              : 'border-line text-ink-faint hover:text-ink-muted',
          )}
        >
          Favorito
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{error}</p>
      ) : null}
    </div>
  )
}
```

- [ ] **Passo 6: Ligar no painel**

Em `src/components/explore/PlacePanel.tsx`, logo depois do bloco do
`VisitStatusBadge`, inserir `<PlaceStateControls place={place} />` e o import.

- [ ] **Passo 7: Verificar no app — este é o marco**

Executar: `npm run dev`, entrar, abrir um lugar

Esperado, em ordem:
1. Clicar em "Favorito" muda o rótulo para âmbar **imediatamente**, sem espera
2. O anel de favorito aparece no pin do mapa quando a revalidação chega
3. Recarregar a página mantém o favorito
4. No SQL Editor:
   `select place_id, is_favorite from place_user_states;` mostra a linha
5. Desfavoritar remove o anel e grava `false`

Prova da recusa: no SQL Editor, rodar
`alter policy place_user_states_own on place_user_states using (false) with check (false);`,
tentar favoritar, e confirmar que **o rótulo volta ao estado anterior e a
mensagem aparece no painel**. Depois desfazer restaurando a política original da
migration `0001`.

- [ ] **Passo 8: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 9: Commit**

```bash
git add src/lib/data/ src/app/actions/place-state-actions.ts \
        src/components/explore/ CHANGELOG.md
git commit -m "feat: favoritar um lugar, e o favorito dura"
```

Changelog, em `### Adicionado`:

```markdown
- Favoritar um lugar passa a gravar de verdade, e o anel do pin responde no
  quadro seguinte ao toque — não depois de uma ida ao servidor. Se a gravação
  falhar, o estado volta e o painel diz o motivo
```

---

## Tarefa 11: Quero conhecer e o histórico de visitas

**Arquivos:**
- Criar: `src/components/explore/PlaceVisits.tsx`
- Modificar: `src/app/actions/place-state-actions.ts`,
  `src/components/explore/PlaceStateControls.tsx`,
  `src/components/explore/PlacePanel.tsx`,
  `src/components/explore/PlaceActions.tsx`

**Interfaces:**
- Consome: tudo da Tarefa 10
- Produz:
  ```ts
  export async function setWantsToVisitAction(
    placeId: string, value: boolean,
  ): Promise<ActionResult>
  export async function recordVisitAction(
    placeId: string, visitedAt: string,
  ): Promise<ActionResult>
  export async function updateVisitDateAction(
    visitId: string, visitedAt: string,
  ): Promise<ActionResult>
  export async function removeVisitAction(visitId: string): Promise<ActionResult>
  ```

- [ ] **Passo 1: Acrescentar as quatro ações**

Em `src/app/actions/place-state-actions.ts`, seguindo exatamente o formato de
`setFavoriteAction` (try/catch, `revalidatePath('/', 'layout')`, `ActionResult`):

```ts
/** `YYYY-MM-DD`. É o formato que `<input type="date">` produz e que `date` aceita. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function checkDate(visitedAt: string): string | null {
  if (!ISO_DATE.test(visitedAt)) return 'Data inválida.'
  // Uma visita no futuro não é memória, é plano — e plano tem outro controle,
  // que é "quero conhecer".
  if (visitedAt > new Date().toISOString().slice(0, 10)) {
    return 'A data está no futuro.'
  }
  return null
}

export async function setWantsToVisitAction(
  placeId: string,
  value: boolean,
): Promise<ActionResult> {
  try {
    const repository = await getPlaceStateRepository()
    await repository.setWantsToVisit(placeId, value)
  } catch {
    return { ok: false, message: 'Não foi possível salvar. Tente de novo.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function recordVisitAction(
  placeId: string,
  visitedAt: string,
): Promise<ActionResult> {
  const invalid = checkDate(visitedAt)
  if (invalid) return { ok: false, message: invalid }
  try {
    const repository = await getPlaceStateRepository()
    await repository.recordVisit(placeId, visitedAt)
  } catch {
    return { ok: false, message: 'Não foi possível registrar a visita.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function updateVisitDateAction(
  visitId: string,
  visitedAt: string,
): Promise<ActionResult> {
  const invalid = checkDate(visitedAt)
  if (invalid) return { ok: false, message: invalid }
  try {
    const repository = await getPlaceStateRepository()
    await repository.updateVisitDate(visitId, visitedAt)
  } catch {
    return { ok: false, message: 'Não foi possível mudar a data.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function removeVisitAction(visitId: string): Promise<ActionResult> {
  try {
    const repository = await getPlaceStateRepository()
    await repository.removeVisit(visitId)
  } catch {
    return { ok: false, message: 'Não foi possível remover a visita.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}
```

- [ ] **Passo 2: Acrescentar "Quero conhecer" ao controle**

Em `PlaceStateControls.tsx`, acrescentar um segundo `useOptimistic` para
`place.visitStatus === 'quero-conhecer'` e um segundo botão, com a cor ativa
`border-wanted text-wanted` — o mesmo tom do preenchimento do pin de "quero
conhecer".

Regra visual: os dois botões ficam na **mesma linha**, com o mesmo peso. Dois
controles não são uma grade; quatro eram. Não acrescentar um terceiro aqui —
registrar visita mora na seção de visitas, porque é evento, não chave.

- [ ] **Passo 3: Criar a seção de visitas**

`src/components/explore/PlaceVisits.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { formatVisitDate } from '@/domain/dates'
import type { ExplorePlace } from '@/domain/place'
import {
  recordVisitAction,
  removeVisitAction,
  updateVisitDateAction,
} from '@/app/actions/place-state-actions'
import { Button } from '@/components/ui/Button'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Histórico de passagens por um lugar.
 *
 * Registrar não devolve um estado, devolve uma linha: voltar acrescenta outra.
 * É a diferença entre uma chave e um evento, e é o que impede a interface de
 * oferecer "desmarcar visitado" — que só poderia ser implementado apagando
 * memória, num produto cuja tese é guardá-la.
 */
export function PlaceVisits({ place }: { place: ExplorePlace }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      setError(null)
      const result = await action()
      if (!result.ok) setError(result.message ?? 'Não foi possível gravar.')
    })
  }

  return (
    <div className="border-b border-line px-5 py-4">
      <span className="instrument-label">Visitas</span>

      {place.visits.length === 0 ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
          Nenhuma visita registrada.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {place.visits.map((visit) => (
            <li key={visit.id} className="flex items-center gap-2">
              <input
                type="date"
                defaultValue={visit.visitedAt}
                max={today()}
                aria-label={`Data da visita de ${formatVisitDate(visit.visitedAt)}`}
                onChange={(event) =>
                  run(() => updateVisitDateAction(visit.id, event.target.value))
                }
                className="instrument-value border border-line bg-raised px-1.5
                           py-1 text-[11px] text-ink"
              />
              <button
                type="button"
                onClick={() => run(() => removeVisitAction(visit.id))}
                className="ml-auto text-[10px] tracking-[0.14em] text-ink-faint
                           uppercase transition-colors hover:text-ink-muted"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3 w-full"
        disabled={pending}
        onClick={() => run(() => recordVisitAction(place.id, today()))}
      >
        Registrar visita hoje
      </Button>

      {error ? (
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{error}</p>
      ) : null}
    </div>
  )
}
```

- [ ] **Passo 4: Ligar no painel e limpar `PlaceActions`**

Em `PlacePanel.tsx`, inserir `<PlaceVisits place={place} />` depois de
`<PlaceStateControls />`.

Em `PlaceActions.tsx`, reduzir `PENDING_ACTIONS` a `['Criar viagem']` e trocar o
parágrafo final por:

```tsx
      <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
        Criar viagem grava paradas e fotos, e fica disponível na etapa de viagens.
      </p>
```

- [ ] **Passo 5: Verificar no app**

Esperado:
1. "Quero conhecer" muda a cor do pin para âmbar e persiste ao recarregar
2. "Registrar visita hoje" acrescenta uma linha com a data de hoje, e o pin muda
   para a cor de visitado
3. Mudar a data no `<input type="date">` regrava e a lista reordena
4. "Remover" apaga a linha; removendo a última, o pin volta para "quero
   conhecer" ou "não visitado" conforme o caso — prova de que o trigger de
   `visit_count` da migration `0001` funciona
5. Tentar uma data futura: o `max` do input barra, e a ação recusa com mensagem
   se alguém contornar

- [ ] **Passo 6: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 7: Commit**

```bash
git add src/app/actions/place-state-actions.ts src/components/explore/ CHANGELOG.md
git commit -m "feat: quero conhecer e o historico de visitas de um lugar"
```

Changelog, em `### Adicionado`:

```markdown
- "Quero conhecer" passa a gravar, e o pin muda de cor no mapa
- Histórico de visitas por lugar: registrar uma visita acrescenta uma data ao
  seu histórico em vez de acender uma chave, e voltar ao mesmo lugar acrescenta
  outra. A data começa em hoje e pode ser corrigida
- "Visitado" continua sendo consequência de ter registrado uma visita, e não um
  botão: um controle que oferecesse desmarcar só poderia fazê-lo apagando memória
```

E em `### Alterado`:

```markdown
- Das quatro ações que ficavam sob "Em breve" no painel de lugar, três passaram a
  funcionar; sobrou "Criar viagem", que é a etapa seguinte
```

---

## Tarefa 12: Criar lugar

**Arquivos:**
- Criar: `src/lib/data/place-catalog-repository.ts`
- Criar: `src/lib/data/supabase/supabase-place-catalog-repository.ts`
- Criar: `src/app/actions/place-catalog-actions.ts`
- Criar: `src/components/explore/PlaceForm.tsx`
- Criar: `src/components/explore/NewPlaceView.tsx`
- Criar: `src/app/(app)/lugar/novo/page.tsx`
- Modificar: `src/lib/data/index.ts`, `src/components/layout/TopBar.tsx`

**Interfaces:**
- Consome: `NewPlace`, `validateNewPlace`, `PLACE_VALIDATION_MESSAGES` da
  Tarefa 5; `slugify`, `uniqueSlug` da Tarefa 5; `PointPicker` da Tarefa 8
- Produz:
  ```ts
  export interface PlaceCatalogRepository {
    listSlugs(): Promise<string[]>
    createPlace(input: NewPlace, slug: string): Promise<ExplorePlace>
    updatePlace(id: string, input: NewPlace): Promise<ExplorePlace>
    deletePlace(id: string): Promise<void>
  }
  export async function getPlaceCatalogRepository(): Promise<PlaceCatalogRepository>
  export async function createPlaceAction(
    input: NewPlace,
  ): Promise<ActionResult & { slug?: string }>
  ```

- [ ] **Passo 1: Criar o contrato**

`src/lib/data/place-catalog-repository.ts`:

```ts
import type { ExplorePlace, NewPlace } from '@/domain/place'

/**
 * Escrita do catálogo — fato objetivo sobre um lugar.
 *
 * Separado de `PlaceStateRepository` porque é a divisa do ADR 0003: o lugar é
 * fato, favorito e visita são opinião. Um usuário pode ter opinião sobre um
 * lugar que não criou.
 *
 * `slug` é argumento de `createPlace`, e não derivado lá dentro, porque a
 * unicidade depende do que já existe — e essa consulta pertence à ação, que já
 * fala com o banco, não ao adapter que só executa.
 */
export interface PlaceCatalogRepository {
  listSlugs(): Promise<string[]>
  createPlace(input: NewPlace, slug: string): Promise<ExplorePlace>
  updatePlace(id: string, input: NewPlace): Promise<ExplorePlace>
  deletePlace(id: string): Promise<void>
}
```

- [ ] **Passo 2: Implementar o adapter**

`src/lib/data/supabase/supabase-place-catalog-repository.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExplorePlace, NewPlace } from '@/domain/place'
import type { PlaceCatalogRepository } from '../place-catalog-repository'
import { PLACE_SELECT, toExplorePlaceFromRow, type PlaceRow } from './place-row'

function toColumns(input: NewPlace) {
  return {
    name: input.name.trim(),
    description: input.description.trim() || null,
    latitude: input.latitude,
    longitude: input.longitude,
    municipality: input.municipality.trim() || null,
    category: input.category,
    tags: input.tags,
  }
}

export function createSupabasePlaceCatalogRepository(
  supabase: SupabaseClient,
  userId: string,
): PlaceCatalogRepository {
  return {
    async listSlugs() {
      const { data, error } = await supabase.from('places').select('slug')
      if (error) throw new Error(error.message)
      return (data as { slug: string }[]).map((row) => row.slug)
    },

    async createPlace(input, slug) {
      const { data, error } = await supabase
        .from('places')
        .insert({
          ...toColumns(input),
          slug,
          state_code: 'SC',
          source: 'manual',
          created_by: userId,
          // O default do schema é `true`, herdado do catálogo curado. Lugar de
          // usuário é privado: "rede social" está fora de escopo declarado.
          is_public: false,
        })
        .select(PLACE_SELECT)
        .single()

      if (error) throw new Error(error.message)
      return toExplorePlaceFromRow(data as unknown as PlaceRow, userId)
    },

    async updatePlace(id, input) {
      const { data, error } = await supabase
        .from('places')
        .update({ ...toColumns(input), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(PLACE_SELECT)
        .single()

      if (error) throw new Error(error.message)
      return toExplorePlaceFromRow(data as unknown as PlaceRow, userId)
    },

    async deletePlace(id) {
      const { error } = await supabase.from('places').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
  }
}
```

- [ ] **Passo 3: Expor a fábrica**

Em `src/lib/data/index.ts`, acrescentar `getPlaceCatalogRepository()` no mesmo
formato das outras duas, com import e reexportação do tipo.

- [ ] **Passo 4: Criar a ação de criação**

`src/app/actions/place-catalog-actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { PLACE_VALIDATION_MESSAGES, validateNewPlace, type NewPlace } from '@/domain/place'
import { slugify, uniqueSlug } from '@/domain/slug'
import { getPlaceCatalogRepository } from '@/lib/data'
import type { ActionResult } from './result'

export async function createPlaceAction(
  input: NewPlace,
): Promise<ActionResult & { slug?: string }> {
  const errors = validateNewPlace(input)
  if (errors.length > 0) {
    return { ok: false, message: PLACE_VALIDATION_MESSAGES[errors[0]] }
  }

  try {
    const repository = await getPlaceCatalogRepository()
    const taken = await repository.listSlugs()
    const slug = uniqueSlug(slugify(input.name), taken)
    const place = await repository.createPlace(input, slug)
    revalidatePath('/', 'layout')
    return { ok: true, slug: place.slug }
  } catch {
    return { ok: false, message: 'Não foi possível criar o lugar.' }
  }
}
```

> A corrida entre `listSlugs` e `createPlace` é conhecida e aceita: um único
> usuário não cria dois lugares no mesmo instante. Se acontecer, o índice único
> de `slug` recusa e a mensagem aparece — o banco continua sendo a autoridade.

- [ ] **Passo 5: Criar o formulário**

`src/components/explore/PlaceForm.tsx` — componente cliente reutilizado por
criar e editar. Recebe:

```ts
interface PlaceFormProps {
  initial?: Partial<NewPlace>
  submitLabel: string
  onSubmit: (input: NewPlace) => Promise<{ ok: boolean; message?: string }>
  /** Quando true, o mapa entra em modo de mira e o clique define a coordenada. */
  picking: boolean
}
```

Estrutura, dentro de um `<OverlayPanel side="right">`:

1. `<PointPicker onPick={handlePick} />` quando `picking` — `handlePick` em
   `useCallback` com dependência vazia, pelo contrato de identidade estável
2. Bloco "Coordenada" em mono, com o valor escolhido ou "aguardando o clique"
3. `<input type="text">` para o nome, com `maxLength={120}`
4. `<select>` nativo de categoria, alimentado por `PLACE_CATEGORIES` e
   `CATEGORY_LABELS` — nada de lista customizada
5. `<input type="text">` para o município
6. `<textarea rows={3}>` para a descrição
7. `<input type="text">` para as etiquetas, separadas por vírgula, convertidas
   com `value.split(',').map((t) => t.trim()).filter(Boolean)`
8. Mensagem de erro em `text-[11px] text-ink-muted`
9. `<Button variant="solid" size="sm" className="w-full">` com `submitLabel`

Todos os campos usam a mesma classe de input do `OriginSetup` (Tarefa 9, passo
4) — `border border-line bg-raised px-2 py-1.5 text-sm text-ink`. Nenhum card,
nenhum raio acima de 2px.

- [ ] **Passo 6: Criar a rota**

`src/app/(app)/lugar/novo/page.tsx`:

```tsx
import { NewPlaceView } from '@/components/explore/NewPlaceView'

export default function NovoLugarPage() {
  return (
    <>
      <h1 className="sr-only">Novo lugar</h1>
      <NewPlaceView />
    </>
  )
}
```

E `src/components/explore/NewPlaceView.tsx`, cliente, que monta `<PlaceForm
picking submitLabel="Criar lugar" onSubmit={...} />` e, no sucesso, chama
`router.push(\`/?lugar=${result.slug}\`)` — abrindo o painel do lugar recém
criado, que é a confirmação mais forte possível de que ele existe.

> O parâmetro de seleção na URL é `lugar`. Confirme o nome lendo
> `src/components/explore/use-selected-place.ts` antes de escrever a linha, e use
> o que estiver lá.

- [ ] **Passo 7: Acrescentar o gatilho na TopBar**

Em `src/components/layout/TopBar.tsx`, antes do formulário de "Sair":

```tsx
      <Link
        href="/lugar/novo"
        className="ml-auto shrink-0 px-2 py-2.5 text-[11px] tracking-[0.12em]
                   whitespace-nowrap text-ink-faint uppercase transition-colors
                   hover:text-ink-muted"
      >
        Novo lugar
      </Link>
```

E remover o `ml-auto` do formulário de "Sair", que passa a ser o segundo item da
direita.

- [ ] **Passo 8: Verificar no app**

Esperado:
1. "Novo lugar" abre a rota, o cursor vira cruz, a `StatusBar` mostra `⌖ mira`
2. Clicar no mapa congela a coordenada no painel
3. Salvar sem nome recusa com "Dê um nome ao lugar." **sem ida ao servidor**
4. Salvar completo redireciona para `/` com o painel do lugar novo aberto
5. O pin aparece no mapa, entra nos filtros e na descoberta
6. No SQL Editor:
   `select slug, source, is_public, created_by from places where source = 'manual';`
   mostra `manual`, `false` e o seu id
7. Criar dois lugares com o mesmo nome produz `nome` e `nome-2`

- [ ] **Passo 9: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 10: Commit**

```bash
git add src/lib/data/ src/app/actions/place-catalog-actions.ts \
        "src/app/(app)/lugar/" src/components/ CHANGELOG.md
git commit -m "feat: criar um lugar clicando no mapa"
```

Changelog, em `### Adicionado`:

```markdown
- Criar um lugar: clicar no mapa define onde é, e o formulário pede nome,
  categoria, município e descrição. O mapa deixa de ser um catálogo que alguém
  escolheu por você e passa a ser o seu
- Lugares criados por você nascem privados
```

---

## Tarefa 13: Editar e apagar um lugar próprio

**Arquivos:**
- Criar: `src/app/(app)/lugar/[slug]/editar/page.tsx`
- Criar: `src/components/explore/EditPlaceView.tsx`
- Modificar: `src/app/actions/place-catalog-actions.ts`,
  `src/components/explore/PlaceActions.tsx`

**Interfaces:**
- Consome: `PlaceForm` da Tarefa 12, `isOwn` da Tarefa 5
- Produz:
  ```ts
  export async function updatePlaceAction(
    id: string, input: NewPlace,
  ): Promise<ActionResult>
  export async function deletePlaceAction(id: string): Promise<ActionResult>
  ```

- [ ] **Passo 1: Acrescentar as duas ações**

Em `src/app/actions/place-catalog-actions.ts`:

```ts
export async function updatePlaceAction(
  id: string,
  input: NewPlace,
): Promise<ActionResult> {
  const errors = validateNewPlace(input)
  if (errors.length > 0) {
    return { ok: false, message: PLACE_VALIDATION_MESSAGES[errors[0]] }
  }

  try {
    const repository = await getPlaceCatalogRepository()
    await repository.updatePlace(id, input)
  } catch {
    return { ok: false, message: 'Não foi possível salvar as alterações.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deletePlaceAction(id: string): Promise<ActionResult> {
  try {
    const repository = await getPlaceCatalogRepository()
    await repository.deletePlace(id)
  } catch {
    return { ok: false, message: 'Não foi possível apagar o lugar.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
```

> O slug **não** muda ao editar o nome. Mudar quebraria qualquer URL
> compartilhada daquele lugar, e o ADR 0006 apoia a aplicação inteira em URLs
> reproduzíveis. Registrar isto em comentário sobre `updatePlace`.

- [ ] **Passo 2: Criar a rota de edição**

`src/app/(app)/lugar/[slug]/editar/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getPlaceRepository } from '@/lib/data'
import { EditPlaceView } from '@/components/explore/EditPlaceView'

export default async function EditarLugarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const repository = await getPlaceRepository()
  const place = await repository.getBySlug(slug)

  // `isOwn` falso cobre dois casos de uma vez: lugar do catálogo curado e lugar
  // de outro usuário. A RLS já recusaria a escrita; isto evita oferecer uma tela
  // que só falharia no fim.
  if (!place || !place.isOwn) notFound()

  return (
    <>
      <h1 className="sr-only">Editar {place.name}</h1>
      <EditPlaceView place={place} />
    </>
  )
}
```

- [ ] **Passo 3: Criar a view de edição**

`src/components/explore/EditPlaceView.tsx`, cliente:

- Monta `<PlaceForm picking={false} submitLabel="Salvar alterações" initial={...}
  onSubmit={(input) => updatePlaceAction(place.id, input)} />`
- `picking={false}` porque mudar a coordenada de um lugar existente é outra
  operação; nesta fase o formulário de edição preserva a coordenada original e
  a mostra em mono, sem mira
- Abaixo do formulário, separado por hairline, um bloco "Apagar":

```tsx
{confirming ? (
  <div className="border-t border-line px-5 py-4">
    <p className="text-[11px] leading-relaxed text-ink-muted">
      Apagar {place.name} remove junto{' '}
      {place.visits.length === 1
        ? 'a visita registrada'
        : `as ${place.visits.length} visitas registradas`}{' '}
      neste lugar. Não há como desfazer.
    </p>
    <div className="mt-3 flex gap-2">
      <Button type="button" size="sm" variant="solid" onClick={confirmDelete}>
        Apagar mesmo assim
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </div>
  </div>
) : (
  <div className="border-t border-line px-5 py-4">
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-[10px] tracking-[0.14em] text-ink-faint uppercase
                 transition-colors hover:text-ink-muted"
    >
      Apagar este lugar
    </button>
  </div>
)}
```

A frase de confirmação **precisa** nomear as visitas: `place_visits` tem
`on delete cascade` sobre `places`, então apagar o lugar apaga a memória junto.
Esconder isso seria a pior omissão possível neste produto.

Quando `place.visits.length === 0`, a frase omite a oração das visitas.

No sucesso, `router.push('/')`.

- [ ] **Passo 4: Ligar a entrada de edição no painel**

Em `src/components/explore/PlaceActions.tsx`, quando `place.isOwn`, acrescentar
abaixo de "Abrir rota":

```tsx
{place.isOwn ? (
  <Link
    href={`/lugar/${place.slug}/editar`}
    className="mt-2 block text-[10px] tracking-[0.14em] text-ink-faint
               uppercase transition-colors hover:text-ink-muted"
  >
    Editar lugar
  </Link>
) : null}
```

- [ ] **Passo 5: Verificar no app**

Esperado:
1. Um lugar do catálogo (`isOwn` falso) **não** mostra "Editar lugar"
2. Um lugar criado por você mostra, e a rota abre com os campos preenchidos
3. Salvar altera o nome no mapa e no painel, e o slug **continua o mesmo**
4. Abrir `/lugar/morro-da-igreja/editar` à mão devolve 404 — é do catálogo
5. Apagar com visitas registradas mostra a frase com a contagem certa
6. Depois de apagar, o pin some do mapa e o SQL confirma a remoção

- [ ] **Passo 6: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test`
Esperado: os três limpos.

- [ ] **Passo 7: Commit**

```bash
git add src/app/actions/place-catalog-actions.ts "src/app/(app)/lugar/" \
        src/components/explore/ CHANGELOG.md
git commit -m "feat: editar e apagar um lugar proprio"
```

Changelog, em `### Adicionado`:

```markdown
- Editar e apagar um lugar que você criou. Lugares do catálogo compartilhado não
  oferecem nem uma coisa nem outra — sobre eles você tem opinião, não posse
- Apagar um lugar diz antes quantas visitas registradas vão junto, porque vão
```

---

## Tarefa 14: ADRs, verificação de RLS e documentação

**Arquivos:**
- Criar: `docs/decisions/0007-dependencias-do-supabase.md`
- Criar: `docs/decisions/0008-rls-como-fronteira-de-autorizacao.md`
- Criar: `docs/VERIFICACAO-RLS.md`
- Modificar: `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`,
  `docs/ROADMAP.md`, `README.md`

**Interfaces:**
- Consome: tudo
- Produz: documentação alcançada pela fase

- [ ] **Passo 1: Escrever o ADR 0007**

Seguir o formato dos ADRs existentes (ler `0001` antes de escrever). Conteúdo:

- **Contexto:** o projeto tinha quatro dependências de produção e uma política
  declarada de preferir ~80 linhas próprias a um wrapper; já recusou
  `react-map-gl`, estado global e bibliotecas de data.
- **Decisão:** adotar `@supabase/supabase-js` e `@supabase/ssr`.
- **Motivo:** não há versão própria razoável — seria reimplementar refresh de
  token, fluxo PKCE e serialização de cookie de sessão, a classe de código em que
  um erro é falha de segurança e não bug.
- **Consequências:** `supabase-js` fica fora do bundle do cliente porque o login
  é iniciado por Server Action; a superfície de atualização passa a incluir dois
  pacotes com ciclo próprio.
- **O que nos faria reconsiderar:** o Supabase deixar de ser o backend, ou o
  `@supabase/ssr` divergir do modelo de cookies do Next a ponto de exigir mais
  código de contorno do que economiza.

- [ ] **Passo 2: Escrever o ADR 0008**

- **Contexto:** com multiusuário, cada leitura precisa ser limitada ao dono.
  Duas formas: parâmetro `userId` nas assinaturas de repositório, ou RLS.
- **Decisão:** RLS. Repositórios construídos por requisição a partir de um
  cliente que já carrega a sessão; `PlaceRepository` sem parâmetro de usuário.
- **Motivo:** um parâmetro duplica em código uma garantia que o banco já dá, e
  cria um caminho onde esquecê-lo vaza dado entre usuários. Uma autoridade só.
- **Consequências:** os adapters não repetem `.eq('user_id', …)`; a corretude da
  autorização passa a depender das políticas, que **precisam ser verificadas à
  mão** — daí `docs/VERIFICACAO-RLS.md`. Repositório vira função, nunca
  singleton de módulo.

- [ ] **Passo 3: Escrever o roteiro de verificação de RLS**

`docs/VERIFICACAO-RLS.md`. Para cada política da migration `0001`, um bloco
executável no SQL Editor. Modelo, a repetir por política:

```sql
-- place_user_states_own — o estado pessoal de um usuário é invisível a outro.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<id-do-outro-usuario>"}';
select count(*) from place_user_states;   -- esperado: 0
rollback;
```

Cobrir: `profiles_own`, `motorcycles_own`, `place_visits_own`,
`place_user_states_own`, `trips_own`, `trip_photos_own`, `trip_stops_via_trip`,
`places_read`, `places_insert`, `places_update`, `places_delete`.

Para `places_read`, o esperado é **14** (os públicos) e **não** o lugar privado
criado por outro usuário.

Abrir o documento com o motivo: a RLS é a garantia mais importante desta fase e
a menos coberta por teste automático; "confiei na política" não é verificação.

- [ ] **Passo 4: Executar o roteiro** *(manual, dono do projeto)*

Rodar cada bloco no SQL Editor. Qualquer resultado diferente do esperado é uma
falha de segurança real e bloqueia a fase — corrigir a política por migration
nova (`0003`) antes de seguir.

- [ ] **Passo 5: Atualizar `CLAUDE.md`**

Na tabela de camadas, acrescentar as duas linhas de `src/lib/supabase/` e
`src/app/actions/` conforme as restrições globais deste plano.

- [ ] **Passo 6: Atualizar `docs/ARCHITECTURE.md`**

Acrescentar `src/lib/supabase/`, `src/app/actions/`, `src/components/onboarding/`
ao mapa de diretórios. Descrever o caminho de uma escrita: componente cliente →
Server Action → repositório → Supabase → `revalidatePath` → Server Component.

- [ ] **Passo 7: Atualizar `docs/DATA-MODEL.md`**

Registrar: o trigger de `profiles` da migration `0002`; o seed com
`source = 'mock'` e `created_by = null`; que lugares de usuário nascem
`is_public = false`; a invariante entre `visits.length` e
`place_user_states.visit_count`.

- [ ] **Passo 8: Atualizar `docs/ROADMAP.md`**

Mover para concluído tudo o que esta fase entregou: executar a migration,
conectar o Supabase, autenticação, ações de escrita do painel. O bloco
"Próximo" passa a começar em **registro de viagens com paradas**.

- [ ] **Passo 9: Atualizar o `README.md`**

Acrescentar à seção de execução: criar projeto Supabase, aplicar `0001`, `0002` e
o seed, configurar o Google como provedor, e as duas variáveis novas.

- [ ] **Passo 10: Verificar**

Executar: `npm run lint && npm run typecheck && npm run test && npm run build`
Esperado: os quatro limpos. `build` entra aqui porque é a última tarefa da fase e
nenhuma anterior o exercitou.

- [ ] **Passo 11: Commit**

```bash
git add docs/ CLAUDE.md README.md CHANGELOG.md
git commit -m "docs: adrs do supabase e da rls, verificacao de politicas e roadmap atualizado"
```

Changelog, em `### Adicionado`:

```markdown
- ADR 0007 registrando as duas dependências do Supabase e o critério que as
  aprovou, num projeto que recusa dependência por padrão
- ADR 0008 registrando a RLS como fronteira de autorização, em vez de um
  parâmetro de usuário que alguém pode esquecer de passar
- Roteiro de verificação manual das políticas de RLS em `docs/VERIFICACAO-RLS.md`
```

---

## Verificação final da fase

Depois da Tarefa 14, confirmar de ponta a ponta:

- [ ] Sair, entrar de novo pelo Google, e a origem e os favoritos continuam lá
- [ ] `npm run build` limpo
- [ ] Nenhuma ocorrência de `DEV_USER_ID` no repositório
- [ ] `src/lib/data/mock/` só é importado por arquivos `.test.ts`
- [ ] Nenhum `service_role` em nenhum arquivo
- [ ] `.env.local` não está rastreado pelo git (`git check-ignore .env.local`)
- [ ] `docs/VERIFICACAO-RLS.md` executado inteiro, todos os blocos com o
      resultado esperado
