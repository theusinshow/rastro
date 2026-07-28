# Persistência e identidade — design

**Data:** 2026-07-27
**Fase:** a segunda do Rastro, sucedendo a fundação
(`2026-07-27-rastro-fundacao-design.md`)
**Estado ao entrar:** a aplicação lê 14 lugares de `src/mocks/places.ts` através de
um adapter em memória, atribui tudo a um `DEV_USER_ID` fixo, e não grava nada.

---

## 1. Por que esta fase

O produto promete responder quatro perguntas. Hoje responde uma e meia.

| Pergunta | Estado |
|---|---|
| Para onde eu vou? | De pé — descoberta, mapa que recompõe, filtros na URL |
| O que ainda quero conhecer? | Existe como filtro sobre dado falso, e a marcação não dura |
| Onde eu já estive? | Não existe |
| Quais histórias ficaram? | Não existe |

As duas últimas não são telas faltando: são **escritas** faltando. Enquanto nada
persiste, "onde eu já estive" não tem onde morar, e qualquer tela construída
sobre mock precisará ser construída duas vezes.

**O objetivo desta fase, em uma frase:** o Rastro deixa de ser uma demonstração e
passa a guardar o que é seu.

Ao fim dela, "onde eu já estive?" é respondido com dado verdadeiro, e "o que
ainda quero conhecer?" passa a valer sobre lugares que **você** escolheu — não
sobre catorze que outra pessoa escolheu.

A quarta pergunta — as histórias — continua sendo a fase seguinte.

---

## 2. Decisões tomadas antes do design

Registradas aqui porque o design inteiro depende delas.

| Decisão | Escolha | Motivo |
|---|---|---|
| Onde roda o Postgres | Projeto Supabase na nuvem | Ambiente real desde o primeiro dia — auth, RLS e Storage de verdade, não emulados. Docker e a CLI do Supabase não existem nesta máquina |
| Autenticação | Google OAuth | Um toque, sem senha, sem sair do app. O produto é usado na estrada |
| Criar lugares próprios | Sim, nesta fase | Um mapa de memória que só contém lugares pré-definidos não é seu |
| Editar e apagar lugar próprio | Sim, os dois | Sem isso, um erro de digitação fica permanente. A RLS já permite |
| Data da visita | Hoje por padrão, editável | A ação comum fica em um toque; corrigir uma visita antiga continua possível |
| Formato da fase | Fatia vertical | A prova de que RLS, sessão e escrita funcionam juntas chega no passo 5, não no último |

---

## 3. Dependências novas — e o ADR que elas exigem

Esta fase adiciona **as primeiras dependências de produção desde o scaffold**.
Hoje são quatro: `maplibre-gl`, `next`, `react`, `react-dom`.

Entram duas:

- **`@supabase/supabase-js`** — cliente do banco e da autenticação.
- **`@supabase/ssr`** — a ponte que faz a sessão viajar entre Server Component,
  Server Action e middleware por cookie.

O `CLAUDE.md` manda verificar se a dependência é mesmo necessária e prefere
"~80 linhas de código próprio a um wrapper". Aqui não há versão própria razoável:
seria reimplementar refresh de token, fluxo PKCE e serialização de cookie de
sessão — exatamente a classe de código em que um erro é uma falha de segurança,
não um bug.

**Ação:** ADR 0007 registrando as duas dependências, o critério que as aprovou e
o que nos faria reconsiderar.

Nada mais entra. Sem biblioteca de formulário, sem biblioteca de toast, sem
biblioteca de data — `<input type="date">` nativo resolve, e `useOptimistic` do
React 19 já está instalado.

---

## 4. Arquitetura

### 4.1 Onde o Supabase vive

```
src/lib/supabase/server.ts       cliente por requisição (Server Components + Actions)
src/lib/supabase/middleware.ts   refresh de sessão
src/middleware.ts                protege rotas, redireciona para /entrar
src/app/auth/callback/route.ts   troca o código OAuth por sessão
src/app/actions/                 Server Actions (fronteira de escrita)
```

**Nenhum cliente Supabase no navegador.** O login é iniciado por Server Action
que chama `signInWithOAuth`, recebe a URL do Google e faz `redirect()`. O
verificador PKCE fica num cookie escrito pelo cliente de servidor, e o handler de
callback troca o código por sessão.

Consequência: `supabase-js` fica inteiro **fora do bundle do cliente**. Num
produto cujo peso de JS é quase todo MapLibre, isso não é detalhe.

### 4.2 A camada nova na tabela de camadas

O `CLAUDE.md` define camadas por regra verificável de imports. Duas linhas
entram:

| Camada | Pode importar | Nunca importa |
|---|---|---|
| `src/lib/supabase/` | nada do projeto | `domain`, componentes |
| `src/app/actions/` | `domain`, `lib` | componentes |

Server Actions são a fronteira de escrita da aplicação: validam com funções puras
do domínio, chamam os repositórios e revalidam. **Nenhuma regra de negócio vive
nelas** — validar o que é um lugar válido é `src/domain/`, como sempre foi.

### 4.3 Escopo por usuário é responsabilidade do banco

`PlaceRepository` **não ganha parâmetro `userId`**.

A RLS já resolve. O cliente carrega a sessão; a consulta

```
places?select=*,place_user_states(*),place_visits(*)
```

devolve o catálogo público mais os lugares próprios (política `places_read`), e
os embeds de estado pessoal e de visitas trazem **apenas** as linhas do usuário,
porque as políticas filtram por `auth.uid()`.

Passar `userId` como argumento seria duplicar em código uma garantia que o banco
já dá — e criar um caminho onde esquecer o argumento vira vazamento de dado entre
usuários. A autorização fica num lugar só.

**Ação:** ADR 0008 registrando a RLS como fronteira de autorização e o
repositório construído por requisição.

### 4.4 O que muda em `src/lib/data/`

De constante para função, porque o adapter agora depende da requisição:

```ts
// src/lib/data/index.ts
export async function getPlaceRepository(): Promise<PlaceRepository>
export async function getPlaceStateRepository(): Promise<PlaceStateRepository>
export async function getPlaceCatalogRepository(): Promise<PlaceCatalogRepository>
```

Quatro chamadas de página passam a `await getPlaceRepository()`.

**Dois contratos novos de escrita, separados de propósito** — porque é exatamente
a divisa que o [ADR 0003](../../decisions/0003-estado-pessoal-separado-do-catalogo.md)
traçou entre catálogo e opinião:

```ts
interface PlaceStateRepository {
  setFavorite(placeId: string, value: boolean): Promise<void>
  setWantsToVisit(placeId: string, value: boolean): Promise<void>
  recordVisit(placeId: string, visitedAt: string): Promise<void>
  updateVisitDate(visitId: string, visitedAt: string): Promise<void>
  removeVisit(visitId: string): Promise<void>
}

interface PlaceCatalogRepository {
  createPlace(input: NewPlace): Promise<ExplorePlace>
  updatePlace(id: string, input: NewPlace): Promise<ExplorePlace>
  deletePlace(id: string): Promise<void>
}
```

`setFavorite` e `setWantsToVisit` fazem `upsert` em `place_user_states`: a linha
pode não existir ainda, e criar-na-primeira-interação é o comportamento certo.

### 4.5 O fim do adapter mock como modo de execução

`mockPlaceRepository` **não é apagado** — é rebaixado a fixture dos testes de
domínio. Deixa de ser alcançável em tempo de execução.

Sem configuração do Supabase, a aplicação mostra um **estado explícito**, na
gramática que [`MapFallback`](../../../src/components/map/MapFallback.tsx) já usa
para a chave ausente do MapTiler. Cair no mock em silêncio seria pior do que
falhar: uma aplicação que aceita cliques em "Marcar visitado" e não grava nada
esconde exatamente o defeito que importa enxergar.

### 4.6 Resposta instantânea

Uma ida ao servidor num toggle de favorito devolveria ao produto a inércia que o
passe de movimento acabou de tirar dele — e a auditoria de design foi explícita
sobre isso ser o problema central da versão anterior.

`useOptimistic` (React 19, já instalado): o pin muda de cor no quadro seguinte ao
toque. As Server Actions chamam `revalidatePath('/', 'layout')`; quando o dado
verdadeiro chega, o valor otimista é substituído sem piscar.

Se o servidor recusar, o estado volta e **a razão aparece no painel**, em texto,
na gramática dos estados vazios que o produto já escreve bem. Sem toast, sem
"Ops!".

---

## 5. Autenticação e identidade

### 5.1 Tela `/entrar`

Fundo `base`, hairline, `RASTRO` em mono caixa alta com tracking, uma linha de
texto e **um** botão de contorno âmbar. Sem card, sem ilustração, sem
"bem-vindo de volta".

### 5.2 Sessão

- `src/middleware.ts` renova a sessão e protege `/`, `/descobrir`, `/viagens` e
  `/memorias`. Livres: `/entrar`, `/auth/callback` e estáticos.
- "Sair" na `TopBar`, como texto.
- `DEV_USER_ID` deixa de existir (`src/mocks/user.ts`).

### 5.3 Migration `0002` — o perfil

Trigger em `auth.users` criando a linha de `profiles` no primeiro login. É a
forma idiomática no Supabase e evita o estado inconsistente em que o usuário
existe e o perfil não.

### 5.4 A origem — e o primitivo que ela cria

`profiles.home_latitude` e `home_longitude` são **nulos**, e `DEFAULT_ORIGIN`
alimenta hoje o filtro de raio, a descoberta inteira e a distância do painel. Um
usuário recém-autenticado não teria origem, e sem origem metade do produto não
calcula.

**Primeiro login sem origem:** uma etapa única. Você clica no mapa; um pin âmbar
marca o ponto; você confirma o rótulo.

Isso não é acessório. É o mesmo gesto que criar um lugar precisa, então o
primitivo — *escolher uma coordenada no mapa* — é construído uma vez, aqui, e
reaproveitado na criação de lugar. Sem ele, criar lugar viraria um formulário com
latitude e longitude digitadas à mão, que é a antítese deste produto.

**Enquanto a origem não estiver definida**, o filtro de raio e a descoberta ficam
indisponíveis com a razão dita em texto — não desabilitados em silêncio.

**Refatoração que isto exige:** `DEFAULT_ORIGIN` é importado diretamente por
`ExploreView`, `PlacePanel` e `DiscoveryView`. Passa a vir de um contexto
alimentado pelo layout de `(app)`, que lê o perfil no servidor
(`src/components/layout/origin-context.tsx`).

---

## 6. As escritas do painel de lugar

### 6.1 O erro que quase cometemos

A forma óbvia para o estado de visita é um controle segmentado de três posições —
*não visitado · quero conhecer · visitado* — porque é assim que
[`deriveVisitStatus`](../../../src/domain/place.ts) lê o lugar. Seria bonito e
seria mentira.

`visitado` não é uma chave: é consequência de existir linha em `place_visits`. Um
segmentado permitiria clicar de volta em "não visitado" num lugar onde você
esteve, e a única implementação honesta disso seria **apagar visitas**. Num
produto cuja tese é guardar memória, um controle que oferece esquecer como se
fosse desmarcar uma caixa está errado.

### 6.2 Os controles espelham as escritas reais

| Controle | Natureza | Escreve |
|---|---|---|
| **Favorito** | Chave | `place_user_states.is_favorite` |
| **Quero conhecer** | Chave | `place_user_states.wants_to_visit` |
| **Registrar visita** | Evento, acumula | Nova linha em `place_visits`, data de hoje |

O estado ativo de cada chave usa **a mesma cor que o pin usa**: o anel âmbar do
favorito, o preenchimento de "quero conhecer". O painel passa a falar o
vocabulário do mapa em vez de um vocabulário de formulário.

O pin continua sendo decidido por `deriveVisitStatus` a partir de `visitCount`;
nada muda no [ADR 0005](../../decisions/0005-pins-como-camadas-data-driven.md).

Nenhuma grade de botões de peso idêntico volta — o padrão que a auditoria de
design marcou como o único cheiro real de template
(`docs/2026-07-27-auditoria-de-design.md`, P2.3).

### 6.3 A seção de visitas

Registrar visita não devolve um estado: devolve **uma linha no seu histórico**.

```
VISITAS
27 JUL 2026        editar · remover
14 MAR 2026        editar · remover
```

Data em mono, editável por `<input type="date">` nativo. Voltar a um lugar
acrescenta outra linha.

Isto cai exatamente nos ~180px vazios que a auditoria marcou como P2.2 no meio do
`PlacePanel`: o vazio é preenchido pela funcionalidade que faltava, não por
enchimento.

### 6.4 "Criar viagem" continua em breve

Viagens são a fase seguinte. Continuar visível é a decisão já registrada, e o
tratamento de peso terciário sob "Em breve" permanece como está.

---

## 7. Criar, editar e apagar lugar

### 7.1 O gesto

O gatilho vive na `TopBar` como **texto** — o produto não tem ícones e é melhor
assim.

"Novo lugar" põe o mapa em modo de escolha. E aqui a `StatusBar` — que a
auditoria chamou de elemento de assinatura, e que hoje mostra coordenada ao vivo
sem que isso sirva para nada — **passa a ser o instrumento de mira**: a
coordenada sob o cursor é a coordenada que será gravada. O mostrador decorativo
vira funcional.

Clicou, o painel direito abre com nome, categoria, município e descrição.

### 7.2 O que é gravado

- `source = 'manual'`
- `created_by` = você
- `is_public = false` — lugar seu é seu; "rede social" está fora de escopo
  declarado. O `default true` do schema vale para o catálogo curado, não para
  este caminho.
- **Slug** derivado do nome no servidor, com sufixo numérico em caso de colisão.
  Determinístico, sem biblioteca.
- **Validação** como função pura em `src/domain/place.ts` (`validateNewPlace`) —
  componente visual não decide o que é lugar válido.

### 7.3 Editar e apagar

O mesmo formulário serve para editar. Apagar pede confirmação em texto no próprio
painel. As políticas `places_update` e `places_delete` já existem e já limitam ao
dono.

A afordância só aparece em lugar próprio, o que exige um campo novo no modelo de
leitura (`isOwn`, seção 8.2).

---

## 8. Modelo de dados

### 8.1 Nenhuma tabela nova

A migration `0001` já previu tudo o que esta fase precisa: `created_by`,
`is_public` e a política `places_insert` já existem. A `0002` acrescenta **apenas
o trigger de `profiles`**.

### 8.2 O modelo de leitura ganha dois campos

```ts
interface ExplorePlace extends Place {
  visitStatus: VisitStatus
  isFavorite: boolean
  photoCount: number
  lastVisitedAt: string | null
  visits: PlaceVisit[]   // novo
  isOwn: boolean         // novo
}

interface PlaceVisit {
  id: string
  visitedAt: string
  notes: string | null
  rating: number | null
}
```

**Por que `visits` vive no modelo de lista, e não numa busca separada quando o
painel abre:** o produto é pessoal. Dezenas de lugares, poucas visitas cada. Um
embed na consulta que já existe custa quase nada; uma busca sob demanda custaria
um mecanismo de fetch no cliente que não compra nada hoje.

**Gatilho para reconsiderar**, registrado aqui como o
[ADR 0004](../../decisions/0004-sem-postgis-nesta-fase.md) registra o dele: se o
catálogo passar de alguns milhares de lugares, ou se o histórico de visitas de um
lugar passar de algumas dezenas, separar.

**Invariante conhecida:** `visits.length` e `place_user_states.visit_count`
descrevem a mesma coisa por caminhos diferentes — o segundo é cache mantido por
trigger. `deriveVisitStatus` continua lendo `visitCount`, e uma divergência entre
os dois significa trigger quebrado. Vale saber ao depurar.

### 8.3 O seed dos 14 lugares

Vão como catálogo curado global: `created_by = NULL`, `is_public = true` e —
importante — **`source = 'mock'` preservado**.

O `CLAUDE.md` proíbe apresentar dado de desenvolvimento como verificado. Apagar
essa marca ao entrar no banco seria a forma mais silenciosa possível de quebrar
essa regra. Coordenada e descrição desses catorze continuam não verificadas
depois da migração, e o disclaimer do painel passa a dizer isso além do que já
diz sobre estimativa.

Entregue como `supabase/seeds/0001_places.sql`, escrito uma vez a partir de
`src/mocks/places.ts`.

`src/mocks/places.ts` não é apagado: vira fixture dos testes de domínio, com um
comentário registrando que ele e o seed **podem divergir de propósito**, porque
servem a coisas diferentes.

---

## 9. Erros e casos de borda

| Situação | Comportamento |
|---|---|
| Supabase não configurado | Estado explícito na gramática do `MapFallback`. Nunca cai no mock |
| Sessão expirada durante uma escrita | Middleware renova; se falhar, redireciona para `/entrar` preservando a URL de retorno |
| Escrita recusada pela RLS | Estado otimista reverte, razão em texto no painel |
| Origem não definida | Raio e descoberta indisponíveis com a razão dita; o resto do app funciona |
| URL com filtro de raio, sem origem definida | O parâmetro é ignorado, não aplicado com uma origem inventada. O [ADR 0006](../../decisions/0006-estado-de-filtros-na-url.md) mantém a URL como fonte do estado; ela deixa de poder afirmar um recorte que o perfil não sustenta |
| Slug em colisão | Sufixo numérico no servidor, transparente |
| Apagar lugar com visitas registradas | `on delete cascade` remove as visitas junto. A confirmação **diz isso explicitamente** antes de apagar |
| Lugar do catálogo global | Sem afordância de editar ou apagar; favoritar e visitar funcionam igual |

---

## 10. Testes e verificação

Sendo franco sobre os limites: sem banco em CI, boa parte desta fase se verifica
rodando, não em `vitest`.

### Testável em unidade

- `slugify` — casos com acento, espaço, caixa e colisão
- `validateNewPlace` — nome vazio, coordenada fora de faixa, categoria inválida
- **O mapeamento de linha do banco para `ExplorePlace`**, extraído como função
  pura e testado contra fixtures de resposta. O adapter fica com a chamada de
  rede e nada mais — é o que torna a parte que importa testável

### Verificável à mão, e vale versionar o roteiro

**A RLS.** É a garantia mais importante desta fase e a menos coberta por teste
automático. Com `set request.jwt.claims` no SQL Editor dá para provar que um
segundo usuário não lê o seu `place_user_states` nem o seu lugar privado.

Vira uma checklist em `docs/VERIFICACAO-RLS.md`, executada uma vez por política.
"Confiei na política" não é verificação.

### Definição de concluído

A do `CLAUDE.md`, sem alteração: `npm run lint` e `npm run typecheck` limpos,
`CHANGELOG.md` atualizado, aplicação rodando sem erro em console, nenhum `any`
novo. Somada, por fatia, a uma verificação manual no app rodando contra o banco
real.

---

## 11. Riscos, ditos agora

1. **A migration `0001` nunca rodou contra um Postgres de verdade.** Erro de
   sintaxe ou referência inválida aparece no passo 1 e pode custar tempo.
   Enquanto ela não aplicar com sucesso nenhuma vez, corrigimos `0001` no lugar;
   depois de aplicada, só por migration nova.

2. **O OAuth do Google exige configuração externa que um agente não pode fazer.**
   Tela de consentimento e URIs de redirecionamento no Google Cloud, e o provedor
   habilitado no painel do Supabase. O plano entrega o roteiro exato; os cliques
   são do dono do projeto.

3. **Chaves.** Só a `anon key` entra no `.env.local` — ela é publicável por
   desenho, e a RLS é o que protege. A `service_role` **não é necessária em
   nenhum ponto deste design** e não deve existir no repositório.

---

## 12. Ordem de entrega

Fatia vertical. Cada passo termina verificável.

| # | Passo | Termina quando |
|---|---|---|
| 1 | Migration `0001` + `0002` + seed, aplicados na nuvem | Os 14 lugares existem no banco e o trigger de perfil dispara |
| 2 | Autenticação ponta a ponta | Login pelo Google, sessão sobrevive a recarregar, "Sair" funciona |
| 3 | Adapter de leitura Supabase | O app mostra os 14 lugares vindos do banco, mock inalcançável |
| 4 | Origem no perfil + primitivo de escolher ponto | Origem gravada por clique no mapa; raio e descoberta calculam sobre ela |
| 5 | **Favorito** — a primeira escrita | Favoritar persiste, o pin reage no quadro seguinte, erro reverte com razão |
| 6 | Quero conhecer, registrar, editar e remover visita | O histórico de visitas de um lugar existe e é editável |
| 7 | Criar, editar e apagar lugar | Um lugar seu aparece no mapa, entra nos filtros e na descoberta |
| 8 | ADR 0007 e 0008, documentação, changelog | Docs alcançadas: `CLAUDE.md`, `ARCHITECTURE.md`, `DATA-MODEL.md`, `ROADMAP.md` |

**O passo 5 é o marco.** No momento em que ele passa, RLS, sessão, Server Action,
revalidação e estado otimista estão provados juntos. Tudo depois é repetição de
um padrão já verificado — e é por isso que a fase é vertical e não em camadas.

---

## 13. Fora de escopo, declarado

Viagens, paradas, fotos, Supabase Storage, EXIF, timeline de memórias,
estatísticas, importação externa de lugares, PostGIS, múltiplas motos, tempo
real, offline.

E também **`personal_notes` e `rating` do lugar**: existem no schema, são
tentadores porque o painel já estará aberto para edição, e não são necessários
para o app deixar de ser demonstração.

Permanece valendo o fora de escopo do produto: rede social, feed público,
scraping, integração com Instagram, recomendação por IA, tracking GPS em tempo
real, app nativo, gamificação.
