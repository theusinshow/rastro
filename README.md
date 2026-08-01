# Rastro

O Google Maps responde *"como chego lá?"*. O Rastro responde *"para onde eu
vou?"*.

Rastro é um app pessoal para planejar e registrar viagens de moto em Santa
Catarina — o mapa como memória visual da vida do motociclista, não apenas
como rota.

## Executando localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> Sem a chave do MapTiler em `NEXT_PUBLIC_MAPTILER_KEY`, a aplicação sobe
> normalmente e mostra um aviso explícito no lugar do mapa, em vez de falhar
> em silêncio. O mesmo vale para o Supabase: sem as duas variáveis, a tela diz
> o que falta em vez de oferecer botões que não gravariam nada.

### Configurando o Supabase

O app precisa de um projeto Supabase para funcionar de verdade — sem ele não há
conta, nem lugares, nem nada gravado.

1. Criar um projeto em [supabase.com](https://supabase.com/dashboard) e copiar,
   de **Project Settings → API**, o *Project URL* e a chave **`anon public`**
   para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no
   `.env.local`. A chave `service_role` não é usada em lugar nenhum e não deve
   entrar no repositório.
2. No **SQL Editor**, executar **nesta ordem** — cada migration supõe as
   anteriores aplicadas:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_profile_on_signup.sql`
   - `supabase/migrations/0003_complete_trip.sql`
   - `supabase/migrations/0004_photos.sql`
   - `supabase/migrations/0005_photos_storage.sql`
   - `supabase/migrations/0006_autonomy.sql`
   - `supabase/migrations/0007_access_surface.sql`
   - `supabase/migrations/0008_visitante.sql`
   - `supabase/seeds/0001_places.sql`

   Conferir com `select count(*) from places;` — deve dar **14**.
3. Habilitar o Google em **Authentication → Providers**:
   - No [Google Cloud Console](https://console.cloud.google.com), configurar a
     tela de permissão OAuth e criar um *ID do cliente OAuth* do tipo
     **Aplicativo da Web**.
   - Em *URIs de redirecionamento autorizados*, usar a URL que o painel do
     Supabase mostra (`https://<ref>.supabase.co/auth/v1/callback`).
   - Colar *Client ID* e *Client secret* no Supabase.
   - Em **Authentication → URL Configuration**, definir *Site URL* como
     `http://localhost:3000` e acrescentar `http://localhost:3000/auth/callback`
     em *Redirect URLs*.
4. Ligar a entrada de visitante em **Authentication → Sign In / Providers →
   Allow anonymous sign-ins**. É ela que sustenta o "Entrar sem conta" — sem
   isso o botão aparece e a entrada falha dizendo exatamente esta chave. Ver
   [ADR 0017](docs/decisions/0017-sessao-anonima-como-entrada-de-visitante.md).

No primeiro login o app pede seu ponto de partida: um clique no mapa. Todas as
distâncias e estimativas de tempo saem daí.

## Comandos

| Comando            | O que faz                                   |
| ------------------ | -------------------------------------------- |
| `npm run dev`       | Sobe o servidor de desenvolvimento           |
| `npm run lint`      | Roda o ESLint (`--max-warnings=0`)           |
| `npm run typecheck` | Verifica os tipos com `tsc --noEmit`         |
| `npm test`          | Roda os testes com Vitest                    |

## Documentação

- [`CLAUDE.md`](./CLAUDE.md) — instruções operacionais para agentes
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — arquitetura do projeto
- [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) — modelo de dados
- [`docs/VERIFICACAO-RLS.md`](./docs/VERIFICACAO-RLS.md) — roteiro manual de verificação das políticas de acesso
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — o que vem a seguir, e o que está fora de escopo
- [`docs/MAP-STRATEGY.md`](./docs/MAP-STRATEGY.md) — estratégia de mapa
- [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) — direção visual e sistema de design
- [`docs/decisions/`](./docs/decisions/) — decisões arquiteturais (ADRs)
- [`docs/skills/`](./docs/skills/) — briefings para invocar skills de design com o contexto do Rastro

## Dados não verificados

Os catorze lugares do catálogo inicial são **dado de desenvolvimento**:
coordenadas aproximadas, descrições não conferidas. Eles carregam
`source = 'mock'` no banco justamente para que essa marca sobreviva à migração —
nada ali deve ser tratado como informação real nem usado para decidir uma viagem.

`src/mocks/` é fixture dos testes de domínio, não fonte de dados da aplicação.
