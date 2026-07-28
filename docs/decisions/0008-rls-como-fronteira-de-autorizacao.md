# 0008 — RLS como fronteira de autorização

## Contexto

Com autenticação real, cada leitura e cada escrita precisam ser limitadas ao
dono do dado. O schema já nasceu multiusuário: a migration `0001` traz RLS ativa
e uma política por tabela, filtrando por `auth.uid()`.

Existem duas formas de garantir o escopo na camada de dados:

1. **Parâmetro explícito** — `listExplorePlaces(userId)`, com cada consulta
   acrescentando `.eq('user_id', userId)`.
2. **RLS** — o repositório é construído a partir de um cliente que já carrega a
   sessão, e o banco filtra sozinho.

## Decisão

**A RLS é a fronteira de autorização.** Consequências concretas:

- `PlaceRepository` **não tem** parâmetro `userId`. A consulta
  `places?select=*,place_user_states(*),place_visits(*)` devolve o catálogo
  público mais os lugares próprios, e os embeds trazem apenas as linhas do
  usuário — porque as políticas filtram, não porque a consulta filtre.
- Os adapters de escrita **não repetem** `.eq('user_id', …)` quando a política
  já restringe. Ver `supabase-place-state-repository.ts`.
- Os repositórios são **funções construídas por requisição**
  (`getPlaceRepository()`, `getPlaceStateRepository()`, …), nunca constantes de
  módulo, porque carregam o cliente com a sessão daquela requisição.
- A sessão é validada com `supabase.auth.getUser()`, e não `getSession()`: só o
  primeiro valida o token contra o servidor de autenticação; o segundo confia no
  cookie, que é falsificável.

## Motivos

- **Uma autoridade só.** Um parâmetro `userId` duplica em código uma garantia que
  o banco já dá — e cria um caminho onde esquecer o argumento numa consulta nova
  vaza dado entre usuários silenciosamente. Com RLS, uma consulta escrita errada
  devolve menos do que deveria; sem ela, devolve mais.
- **A chave `anon` é pública por desenho.** Ela vai para o navegador em
  `NEXT_PUBLIC_*`. O que protege o dado não é o segredo da chave, é a política.
  Tratar a RLS como camada secundária seria construir sobre uma premissa falsa.
- **A `service_role` deixa de ter uso.** Nenhum ponto desta aplicação precisa
  contornar as políticas, então a chave que as contorna não entra no repositório.

## Consequências

- **A corretude da autorização passa a depender das políticas, que precisam ser
  verificadas à mão.** Nenhum teste de unidade cobre RLS. Daí
  `docs/VERIFICACAO-RLS.md`: um roteiro executável, por política, com o resultado
  esperado. "Confiei na política" não é verificação.
- Um erro de política é silencioso na direção segura (dados somem) e catastrófico
  na direção insegura (dados vazam). O roteiro cobre as duas.
- Server Actions não fazem checagem de autorização própria. Elas validam
  *entrada* — `validateNewPlace` — e deixam a autorização com o banco.

## Gatilho de revisão

Reavaliar quando surgir uma regra de acesso que a RLS não expresse bem — por
exemplo, compartilhamento de uma viagem específica com outro usuário, onde a
política precisaria consultar uma tabela de permissões a cada linha. Nesse ponto,
medir antes de mudar: a alternativa é uma camada de autorização em código, com
todo o risco que esta decisão evita.
