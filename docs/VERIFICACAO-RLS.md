# Verificação de RLS

O [ADR 0008](./decisions/0008-rls-como-fronteira-de-autorizacao.md) coloca a RLS
como **a** fronteira de autorização: os repositórios não repetem
`.eq('user_id', …)`, e nenhum teste de unidade cobre política de banco.

Isso torna as políticas a garantia mais importante do produto e a menos coberta
por automação. **"Confiei na política" não é verificação.** Este documento é o
roteiro que a substitui.

Rode-o inteiro: depois de aplicar qualquer migration que toque em RLS, e antes de
considerar concluída qualquer fase que acrescente tabela ou política.

---

## Como rodar

No **SQL Editor** do painel do Supabase. Cada bloco é auto-contido e termina em
`rollback` — nenhum deles altera dado.

O editor roda como `postgres`, que **ignora RLS**. Por isso todo bloco começa com
`set local role authenticated`: sem essa linha o teste passa sempre e não prova
nada.

Antes de começar, pegue dois identificadores:

```sql
-- Seu id de usuário. Anote como <MEU_ID>.
select id, email from auth.users;

-- Um id que não existe, para representar "outro usuário".
-- Use este literal: 00000000-0000-4000-8000-000000000009
```

Nos blocos abaixo, substitua `<MEU_ID>` pelo primeiro. `<OUTRO_ID>` já está
preenchido com o literal acima.

---

## 1. `places_read` — o catálogo é público, o lugar privado não

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000009"}';
select count(*) from places where is_public;         -- esperado: 14
select count(*) from places where not is_public;     -- esperado: 0
rollback;
```

> Se você já criou lugares próprios, o segundo `count` continua **0** para o
> outro usuário — é exatamente o que a política precisa garantir. Rodando o mesmo
> bloco com `<MEU_ID>`, ele deve mostrar quantos você criou.

## 2. `places_insert` — ninguém cria lugar em nome de outro

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000009"}';
-- Esperado: ERRO 42501 (new row violates row-level security policy)
insert into places (slug, name, latitude, longitude, category, created_by)
values ('teste-rls', 'Teste', 0, 0, 'serra', '<MEU_ID>');
rollback;
```

## 3. `places_update` e `places_delete` — o catálogo curado é intocável

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<MEU_ID>"}';
-- Esperado nos dois: UPDATE 0 / DELETE 0. `created_by` é null no catálogo.
update places set name = 'Sequestrado' where slug = 'morro-da-igreja';
delete from places where slug = 'morro-da-igreja';
rollback;
```

## 4. `place_user_states_own` — favorito é privado

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000009"}';
select count(*) from place_user_states;   -- esperado: 0
-- Esperado: ERRO 42501
insert into place_user_states (user_id, place_id, is_favorite)
select '<MEU_ID>', id, true from places limit 1;
rollback;
```

## 5. `place_visits_own` — a memória é privada

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000009"}';
select count(*) from place_visits;        -- esperado: 0
-- Esperado: ERRO 42501
insert into place_visits (user_id, place_id, visited_at)
select '<MEU_ID>', id, current_date from places limit 1;
rollback;
```

## 6. `profiles_own` — o perfil alheio é invisível e imutável

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000009"}';
select count(*) from profiles;            -- esperado: 0
update profiles set home_label = 'invadido';  -- esperado: UPDATE 0
rollback;
```

## 7. `motorcycles_own`

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000009"}';
select count(*) from motorcycles;         -- esperado: 0
rollback;
```

## 8. `trips_own`, `trip_photos_own`, `trip_stops_via_trip`

Ainda sem dado — a fase de viagens não chegou. Os blocos existem para quando
chegar, e devem ser rodados **antes** de a primeira viagem ser gravada.

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000009"}';
select count(*) from trips;               -- esperado: 0
select count(*) from trip_photos;         -- esperado: 0
-- trip_stops não tem user_id: a posse é herdada da viagem.
select count(*) from trip_stops;          -- esperado: 0
rollback;
```

---

## Verificação sem sessão (automatizável)

Complementar aos blocos acima: com a chave `anon` e **nenhuma** sessão, toda
escrita deve ser recusada. Isto foi verificado na fase de persistência e o
resultado registrado no commit `d72d8a0`:

| Tentativa | Resultado |
|---|---|
| `place_user_states` insert | recusado, `42501` |
| `place_visits` insert | recusado, `42501` |
| `places` insert | recusado, `42501` |
| `places` update | recusado, nenhuma linha afetada |
| `places` delete | recusado, nenhuma linha afetada |
| `profiles` update | recusado, nenhuma linha afetada |

O catálogo seguiu com 14 lugares intactos depois de todas elas.

---

## `complete_trip` — verificada em 30/07/2026

A função da migration 0003 é **`security invoker`** de propósito: a RLS decide
dentro dela. Com `security definer` ela passaria por cima das políticas e viraria
o buraco pelo qual um usuário concluiria a viagem de outro.

Prova automatizada, usando **apenas a chave anon**:

```
node scripts/verificar-complete-trip-rls.mjs <uuid-de-uma-viagem>
```

Ela confirma duas coisas: o anônimo é recusado ao chamar a função, e não enxerga
nenhuma linha de `trips`.

**Executada contra 9 uuids reais** extraídos da própria aplicação — a viagem, suas
paradas e lugares do catálogo. Nenhum foi concluído pelo anônimo, e nenhuma linha
de `trips` foi lida.

Duas armadilhas que o script trata, e que valem para qualquer verificação futura:

- **Função ausente também dá erro.** Contar isso como "a RLS recusou" faria o
  teste passar pelo motivo errado — pior que não ter teste. O script distingue os
  casos e devolve `INCONCLUSIVO` quando a função não existe.
- **UUID inventado prova menos do que parece.** Com um id inexistente, "zero
  linhas atualizadas" é ambíguo entre "a RLS bloqueou" e "a viagem não existe".
  Passe sempre o id de uma viagem real.

Rode isto de novo sempre que alterar a função ou qualquer política de `trips`,
`trip_stops` ou `place_visits`.

---

## Storage `fotos` — verificada em 30/07/2026

Bucket **privado**. As três políticas sobre `storage.objects` prendem cada usuário
à própria pasta, comparando o primeiro segmento do caminho
(`{userId}/{placeId}/{uuid}.jpg`) com `auth.uid()`.

```
node scripts/verificar-storage-rls.mjs
```

Confirma três coisas com a chave anon, e a terceira é a que decide:

| Verificação | Resultado |
|---|---|
| Anônimo lista a pasta de outro | vazio, RLS filtrou |
| Anônimo escreve na pasta de outro | `new row violates row-level security policy` |
| **URL pública serve o objeto** | **400** — o bucket é privado de verdade |

A terceira é a que prova privacidade: caminho difícil de adivinhar **não é**
segurança, e um link vazado valeria para sempre.

O script distingue "bucket ausente" de "RLS recusou" e devolve `INCONCLUSIVO` no
primeiro caso — contar bucket inexistente como sucesso faria o teste passar pelo
motivo errado.

Rode de novo ao mexer em qualquer política de Storage.

---

## Visitante — fotografia fechada

> **Cuidado com a palavra.** Em todo o resto deste documento, "anônimo" significa
> *requisição sem sessão nenhuma* — o papel `anon` do Postgres. Aqui o conceito é
> o oposto: um usuário **autenticado sem identidade**, criado por
> `signInAnonymously()`. Neste bloco ele se chama **visitante**, e nunca anônimo.
> Ver [ADR 0017](./decisions/0017-sessao-anonima-como-entrada-de-visitante.md).

As duas políticas restritivas da migration `0008` fecham a única escrita que
deixaria arquivo permanente. Restritivas entram com `AND` sobre `fotos_insert_own`
e `photos_own`, que continuam valendo inteiras.

```
node scripts/verificar-visitante-rls.mjs
```

Quatro combinações — duas identidades × dois alvos:

| Identidade | Alvo | Esperado |
|---|---|---|
| Visitante | upload no bucket `fotos`, **pasta própria** | recusado |
| Visitante | insert em `photos` | recusado, `42501` |
| Com conta | upload no bucket `fotos` | **aceito** |
| Com conta | insert em `photos` | **aceito** |

**As duas últimas linhas são o ponto.** Um roteiro que só verificasse as recusas
passaria feliz com uma política que barra todo mundo — e é exatamente o que
acontece sem o `coalesce` da `0008`: para quem entrou por provedor a claim
`is_anonymous` não vem no JWT, `null = false` dá `null`, e `null` é negação.

O visitante escreve na **própria** pasta de propósito. Se o roteiro usasse a
pasta de outro, a recusa poderia vir da política antiga (`fotos_insert_own`) e
nada teria sido provado sobre a nova.

O script também confirma que o visitante **favorita** normalmente. Sem isso, uma
sessão completamente quebrada passaria nas duas recusas pelo motivo errado.

Rode de novo ao mexer em qualquer política de `photos` ou de Storage.

### Faxina de visitantes

Rodar à mão; não há cron, e um punhado de sessões não justifica um.

```sql
-- A ORDEM E OBRIGATORIA. `places.created_by` e `on delete set null`: apagar o
-- usuario primeiro deixa os lugares dele com `created_by` nulo e `is_public`
-- falso -- invisiveis para todo mundo, inclusive para quem vier limpar depois,
-- e permanentes. Os lugares saem antes.
delete from places
where created_by in (
  select id from auth.users
  where is_anonymous and created_at < now() - interval '30 days'
);

delete from auth.users
where is_anonymous and created_at < now() - interval '30 days';
```

---

## Se algum bloco falhar

Um resultado diferente do esperado é uma **falha de segurança real**, não um
detalhe de configuração. Corrija a política por **migration nova** — nunca
editando a `0001`, que já aplicou — e rode o roteiro inteiro de novo antes de
seguir.
