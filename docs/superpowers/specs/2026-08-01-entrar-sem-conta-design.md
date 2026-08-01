# Entrar sem conta — spec

> Desenhado em 1º de agosto de 2026. Design aprovado pelo dono do produto.

Uma segunda porta de entrada: usar o Rastro sem conta, para que outras pessoas
possam avaliar o produto sem passar pelo Google. O visitante experimenta o
produto inteiro — marca visitado, monta viagem, escreve memória — e **não sobe
fotografia**. Nada do que ele faz sobrevive à sessão.

---

## 1. O motivo, e por que ele fecha o escopo

O objetivo não é adoção, é **avaliação**: mandar o link para alguém olhar e
opinar. Isso decide sozinho três coisas que apareceriam como dúvida mais adiante:

- Não há conversão de visitante em conta real. Quem gostar entra com Google e
  começa limpo (§6.1).
- Não há dados semeados. Conta vazia sobre catálogo cheio (§3.1).
- Cota de serviço externo não é preocupação: o público é conhecido e pequeno.

## 2. O que já existe, e o que dele sustenta a proposta

| Onde | O que é | Consequência |
|---|---|---|
| `lib/supabase/middleware.ts:63` | Barra rota privada quando `getUser()` não devolve usuário | Basta o visitante **ter** um `auth.uid()` e o middleware para de ser assunto |
| `lib/data/index.ts:34` | `sessionContext()` lança se não há usuário | Idem: nenhum repositório muda |
| `migrations/0001:295` | `places_read: for select using (is_public or created_by = auth.uid())` | O catálogo curado já é legível por qualquer sessão. **O mapa do Explore nasce populado** |
| `supabase-place-catalog-repository.ts:40` | Lugar criado por usuário nasce `is_public: false` | Visitante não suja o catálogo de ninguém |
| `migrations/0001:272-282` | Toda tabela pessoal filtrada por `user_id = auth.uid()` | Tudo que o visitante escreve já é privado e descartável |
| `migrations/0005` | Bucket `fotos` privado, políticas por pasta de usuário | O único ponto onde falta uma trava |

A leitura dessa tabela é o desenho inteiro: **o Rastro já é seguro para um
visitante em todo lugar menos um.** Fotografia é a única escrita que deixa
arquivo permanente e custo. É a única que precisa de trava nova.

## 3. Decisões fechadas

### 3.1 Sessão anônima do Supabase, não um caminho sem sessão

`supabase.auth.signInAnonymously()` cria uma linha real em `auth.users` com a
claim `is_anonymous = true` no JWT.

A alternativa — um modo visitante sem sessão nenhuma — exigiria uma camada de
dados paralela: os repositórios morrem sem `auth.uid()` e a RLS filtra por ele.
Seriam duas implementações de cada leitura, e a segunda sem nenhuma proteção do
banco. **A sessão anônima é o que permite não escrever essa segunda
implementação.** Middleware, repositórios e políticas ficam intocados.

O que o visitante vê ao chegar: catálogo público cheio, estado pessoal vazio.
Ele cria o dele, e some junto com a sessão.

### 3.2 O bloqueio da foto mora no banco, não na interface

O [ADR 0008](../../decisions/0008-rls-como-fronteira-de-autorizacao.md) diz que
autorização é responsabilidade do banco. Esconder um botão é interface — se a
única trava for o botão escondido, não existe trava.

Duas políticas **restritivas** novas, que se somam por `AND` às existentes sem
reescrevê-las:

```sql
create policy fotos_insert_nao_anonimo on storage.objects
  as restrictive for insert
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

create policy trip_photos_insert_nao_anonimo on trip_photos
  as restrictive for insert
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
```

**As duas, e não só a do Storage.** `addPhotoAction` grava o arquivo *e* uma
linha em `trip_photos` ([photo-actions.ts:40](../../../src/app/actions/photo-actions.ts)).
Barrar um lado só deixaria lixo pela metade — arquivo sem linha, ou linha
apontando para arquivo que não existe.

O `coalesce` é obrigatório: para um usuário do Google a claim não vem no JWT, e
`null = false` é `null`, que a política trata como negação. Sem ele, **ninguém**
subiria foto.

### 3.3 O trigger de perfil precisa de emenda

`handle_new_user` monta `display_name` a partir de `raw_user_meta_data` e do
e-mail. Um visitante não tem nenhum dos dois: `split_part(NULL, '@', 1)` devolve
`NULL`. A coluna é nullable, então nada quebra — mas o nome nulo viraria
tratamento espalhado pela interface.

Emenda: um `coalesce` final para `'Visitante'` na expressão existente. Uma
linha, e o nome deixa de ser nulo para sempre.

### 3.4 A regra é função pura, não condicional em componente

Componente visual não decide elegibilidade. `src/domain/guest.ts`:

```ts
export type Viewer = { isGuest: boolean; displayName: string | null }
export function canUploadPhotos(viewer: Viewer): boolean
```

Um predicado só. Não vale inventar um sistema de permissões para uma regra —
[ADR 0001](../../decisions/0001-stack-e-limite-de-dependencias.md) e a regra de
não abstrair cedo. Quando aparecer a segunda regra, ela entra neste arquivo.

### 3.5 O viewer desce pela árvore como a origem já desce

`src/lib/data/viewer.ts` expõe `getViewer()`, lido uma vez no
[`(app)/layout.tsx`](../../../src/app/(app)/layout.tsx) e distribuído por um
`ViewerProvider` — mesmo padrão de `OriginProvider`, pela mesma razão: TopBar e
PlacePhotos são componentes de cliente e não leem sessão sozinhos.

## 4. Os três pontos visíveis

### 4.1 Tela de entrada

Abaixo do botão do Google, uma segunda ação `outline`. O `solid` continua sendo
do Google: o sistema reserva o cheio para a ação única da tela, e entrar de
verdade continua sendo o caminho principal.

Sob o botão, uma linha dizendo o trato antes de a pessoa aceitá-lo: experimenta
tudo, fotografia precisa de conta, nada fica salvo.

`ERROR_MESSAGES` ganha a chave `anonimo-desligado`, para o caso de a opção estar
desativada no painel do Supabase — o mesmo tratamento explícito que os erros do
Google já recebem, em vez de uma falha muda.

### 4.2 Esquina da sessão, na TopBar

Onde hoje mora o "Sair", depois do hairline que já separa a saída da navegação
([TopBar.tsx:164-177](../../../src/components/layout/TopBar.tsx)):

- Antes do hairline, o rótulo `Visitante`.
- O botão "Sair" vira **"Entrar com conta"**.

Para um visitante, sair e entrar são o mesmo gesto — e nomear o destino vale
mais que nomear a porta. A ação é a `signOutAction` que já existe: ela encerra a
sessão e redireciona para `/entrar`, que é exatamente o destino prometido.

Nenhuma tela nova, nenhum quinto item de navegação, nenhuma altura roubada do
mapa. É a esquina onde a identidade já vive.

### 4.3 Onde o envio de foto era

Em [`PlacePhotos.tsx`](../../../src/components/explore/PlacePhotos.tsx), o
controle de arquivo dá lugar a uma nota separada por hairline: *"Envio de
fotografia precisa de conta"*, com o link para entrar.

Sem modal, sem toast, sem tooltip de hover — todos proibidos pelo
[ADR 0016](../../decisions/0016-a-regua-diz-de-onde-veio-o-numero.md). O motivo
fica escrito no lugar onde a pessoa tentou agir, que é onde ele é útil.

## 5. Fora de escopo

| Fora | Motivo |
|---|---|
| Converter visitante em conta real (`linkIdentity`) | O objetivo é avaliação, não adoção. Quem gostar entra com Google e começa limpo. Se virar necessidade, é ADR próprio |
| Faxina automática de anônimos | Cron para um punhado de sessões é peso sem retorno. Ver §6.2 |
| Dados de demonstração semeados | O catálogo público já enche o mapa. Semear exigiria decidir o que copiar e manter isso vivo |
| Limitar cota externa por sessão | Público conhecido e pequeno. Resolver isso agora seria resolver um problema que não existe |

## 6. O que fica sabido, e não resolvido

### 6.1 Sair é perder

Um visitante que clica em "Entrar com conta" perde tudo que fez. Isso é o
desenho, não um defeito — mas é o único ponto do produto onde uma ação destrói
dado sem confirmação. Fica registrado; se incomodar no uso, vira assunto.

### 6.2 Lugar de visitante apagado vira linha invisível

`places.created_by` é `on delete set null`. Apagar um usuário anônimo deixa os
lugares dele com `created_by = null` e `is_public = false` — invisíveis para
todo mundo, incluindo para quem for limpar, e permanentes.

A faxina, portanto, tem ordem obrigatória: **apagar os lugares do usuário antes
de apagar o usuário.** Vai como SQL documentado em
`docs/VERIFICACAO-RLS.md`, para rodar à mão. Inverter a ordem cria lixo que não
dá mais para encontrar pelo dono.

### 6.3 Passo manual no painel

*Authentication → Sign In / Providers → Allow anonymous sign-ins* precisa estar
ligado. **Já foi feito pelo dono do produto.** O tratamento de erro de §4.1
existe para o caso de alguém desligar, ou de um ambiente novo.

## 7. Verificação

- Teste de unidade do predicado de `src/domain/guest.ts`.
- `docs/VERIFICACAO-RLS.md` ganha duas verificações: com sessão anônima, o
  insert em `storage.objects` e o insert em `trip_photos` são recusados; com
  sessão do Google, os dois passam. A segunda metade é o que prova que o
  `coalesce` de §3.2 está certo.
- Entrar como visitante, marcar visitado, montar uma viagem e ver o painel de
  lugar sem o controle de envio.

## 8. ADR

Isto é decisão arquitetural — uma segunda porta de entrada e um conceito novo de
autorização, o usuário sem identidade. Vai como **ADR 0017 — Sessão anônima como
entrada de visitante**, e ele é quem registra §3.1 e §3.2.
