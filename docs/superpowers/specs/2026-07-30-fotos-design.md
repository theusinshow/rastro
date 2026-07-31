# Fotos — spec

> Desenhado em 30 de julho de 2026. Design aprovado pelo dono do produto.
> Spec B da decomposição feita em
> [2026-07-29-viagens-design.md](./2026-07-29-viagens-design.md) §2. A spec A
> (Viagens) está implementada e no ar.

Anexar fotografias a um lugar, ver a galeria no painel dele, e fazer o contador de
fotos parar de mentir — o que acende sozinho a marca de foto no mapa.

---

## 1. O que já existe, e o que dele é mentira

| Onde | O que é |
|---|---|
| `migrations/0001` | Tabela `trip_photos` com `storage_path`, `width`, `height`, `latitude`, `longitude`, `taken_at`, `caption`, `exif`, `sort_index` |
| idem | Política `trip_photos_own`, e três índices |
| idem | `place_user_states.photo_count integer not null default 0` |
| `src/lib/map/layers.ts:250` | Camada `photoDot`: ponto de osso de raio 1,7 deslocado `[8, -8]`, filtrada por `hasPhotos` |
| `src/components/explore/PlacePanel.tsx:73` | Já exibe `"N fotografias"` |

**Nenhuma linha de `src/` referencia `trip_photos`.** A tabela nunca foi usada.

**`photo_count` é mentira.** O único trigger do banco é
`refresh_place_user_state()`, sobre `place_visits`. Nada mantém `photo_count`: ele
nasce zero e morre zero. Por isso o `photoDot` está apagado desde sempre.

O efeito prático é bom: **fazer o contador funcionar acende a marca no mapa e a
contagem no painel sem uma linha de interface nova.** As duas já estão escritas.

## 2. Escopo

**Dentro:** subir foto pelo painel do lugar, galeria ali mesmo, legenda, apagar
foto, e o trigger de `photo_count`.

**Fora, e por quê:**

| Fora | Motivo |
|---|---|
| `/memorias` | Responde outra pergunta — "o que aconteceu neste ano", não "neste lugar". Spec própria, e fica quase trivial depois desta |
| Camada de fotos posicionadas no mapa | Agrupamento, miniatura em WebGL e conflito com os pins existentes. Assunto próprio |
| Converter HEIC | Custa dependência pesada. Ver §5 |
| Reordenar fotos | `sort_index` existe e é gravado por ordem de upload. Arrastar tem os mesmos problemas de acessibilidade já registrados em Viagens |

## 3. Decisões fechadas

### 3.1 A foto pertence ao LUGAR; a viagem é opcional

O esquema original se contradizia:

| | `place_visits.trip_id` | `trip_photos.trip_id` |
|---|---|---|
| Nulo permitido? | **sim** | **não** |

O produto aceitava registrar *"estive no Morro da Igreja em 12 de março"* sem
viagem, mas não aceitava anexar a foto tirada lá sem inventar uma. Mesmo momento,
regras opostas — e a segunda excluiria toda fotografia anterior ao próprio app.

**Decisão:** `trip_id` passa a aceitar nulo, `place_id` passa a ser obrigatório.

### 3.2 Bucket privado, com URL assinada

Foto de viagem carrega rosto, placa, e onde você estava e quando. Coerente com o
resto do produto: lugar criado pelo usuário já nasce privado, e o `CLAUDE.md`
declara rede social fora de escopo.

Caminho imprevisível **não é segurança** — link vazado vale para sempre.

### 3.3 Ler EXIF, depois encolher — nessa ordem

**Redimensionar no canvas destrói o EXIF.** Se queremos data e coordenada, é
obrigatório lê-los antes.

O plano gratuito do Storage dá 1 GB. Foto de celular tem ~4 MB (≈250 fotos);
reduzida a 2000px no lado maior, ~400 KB (≈2.500 fotos).

### 3.4 O navegador sobe direto para o Storage

Server Actions do Next têm limite de corpo de **1 MB** por padrão. Passar arquivo
por lá é frágil por construção.

O binário vai do navegador ao Storage, autorizado por **política de RLS no próprio
Storage**; a Server Action só grava a linha. A autorização continua no banco —
ADR 0008 intacto.

## 4. Migration 0004

```sql
-- O nome deixou de ser verdade quando a foto passou a pertencer ao lugar.
alter table trip_photos rename to photos;

alter table photos alter column trip_id  drop not null;
alter table photos alter column place_id set not null;

-- OBRIGATÓRIO junto com o `set not null` acima. `place_id` era
-- `on delete set null`, e as duas coisas juntas se contradizem: apagar um lugar
-- tentaria escrever nulo numa coluna que não aceita nulo, e a exclusão falharia.
--
-- `cascade` é a resposta certa, e é a mesma de `place_visits.place_id`: se o
-- lugar deixa de existir, a memória dele vai junto. O painel de apagar lugar já
-- nomeia as visitas que somem — passa a nomear as fotos também.
alter table photos drop constraint trip_photos_place_id_fkey;
alter table photos add  constraint photos_place_id_fkey
  foreign key (place_id) references places on delete cascade;

-- Sempre conhecidas: saem do canvas no próprio upload. Nulas quebrariam a
-- reserva de proporção da grade, que é o que substitui o skeleton proibido.
alter table photos alter column width  set not null;
alter table photos alter column height set not null;

-- Data civil, não instante: a memória é do dia. Mesma escolha de
-- place_visits.visited_at, pelo mesmo motivo.
alter table photos rename column taken_at to taken_on;
alter table photos alter column taken_on type date using taken_on::date;
-- Continua aceitando nulo, de propósito: nulo é "não sabemos quando foi
-- tirada". Preenchê-la com o dia do upload seria inventar memória.

-- Coluna que nunca seria escrita: extraímos GPS e data para colunas tipadas, e o
-- bloco bruto carrega número de série do aparelho e mais dado pessoal do que
-- precisamos guardar. Manter coluna que ninguém preenche é a armadilha que já
-- custou o photo_count.
alter table photos drop column exif;
```

Índices e a política `trip_photos_own` são renomeados junto. Renomear é seguro
porque a tabela está vazia e nada a referencia.

### O trigger

Espelha `refresh_place_user_state()`, inclusive no `security definer`:

```sql
create or replace function refresh_place_photo_count()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  target_user  uuid := coalesce(new.user_id, old.user_id);
  target_place uuid := coalesce(new.place_id, old.place_id);
begin
  insert into place_user_states (user_id, place_id)
  values (target_user, target_place)
  on conflict (user_id, place_id) do nothing;

  update place_user_states s
     set photo_count = (select count(*) from photos
                         where user_id = target_user and place_id = target_place),
         updated_at = now()
   where s.user_id = target_user and s.place_id = target_place;

  return null;
end; $$;

create trigger photos_refresh_count
after insert or update or delete on photos
for each row execute function refresh_place_photo_count();
```

**`security definer` aqui, `security invoker` na `complete_trip` da 0003 — e a
diferença é deliberada.** A `complete_trip` é chamada pelo usuário e a RLS precisa
decidir se ele pode. Um trigger roda como efeito de uma escrita que a RLS **já
autorizou**, e só mantém cache derivado.

### Storage

Bucket `fotos`, privado. Caminho `{userId}/{placeId}/{uuid}.jpg`. Políticas sobre
`storage.objects`, para `select`, `insert` e `delete`:

```sql
bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
```

### O tipo no domínio

```ts
/** Formatos que o navegador consegue ler EXIF e redimensionar. Ver §5. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MAX_CAPTION_LENGTH = 280

export interface Photo {
  id: string
  placeId: string
  /** Nulo é o caso comum: foto anexada a um lugar, fora de qualquer viagem. */
  tripId: string | null
  storagePath: string
  width: number
  height: number
  /** Do EXIF quando houver. Nulo é legítimo, e a interface diz que não sabe. */
  coordinates: Coordinates | null
  /**
   * Data civil `YYYY-MM-DD`, vinda do EXIF. **Nulo significa "não sabemos"**, e
   * é um estado legítimo que a interface mostra como tal.
   *
   * NÃO cai para o dia do upload: a data em que você mexeu no arquivo não é a
   * data em que a foto foi tirada, e apresentá-la como se fosse seria inventar
   * memória — o mesmo erro que a confirmação de paradas existe para evitar.
   * `created_at` já registra o upload, para quem precisar dele.
   */
  takenOn: string | null
  caption: string | null
  sortIndex: number
}

/** O que o cliente já sabe ao terminar o upload. */
export interface NewPhoto {
  placeId: string
  storagePath: string
  width: number
  height: number
  coordinates: Coordinates | null
  /** Nulo quando a foto não trazia EXIF. Ver acima. */
  takenOn: string | null
  caption: string | null
}

export type PhotoValidationError = 'caption-too-long' | 'unsupported-type'

export function validateNewPhoto(input: NewPhoto): PhotoValidationError[]
export function isAcceptedImageType(type: string): boolean
```

**`sortIndex`** é atribuído pelo repositório como `max(sort_index) + 1` dentro do
mesmo lugar, na inserção. O usuário não reordena nesta versão (§12), então a
ordem é a de upload e ninguém precisa informá-la.

**`takenOn` nulo é o sinal de "não sabemos", e a ordenação lida com isso:** a
galeria ordena por `taken_on` decrescente com **nulos por último**, desempatando
por `sort_index`. Foto sem data conhecida vai para o fim, não para hoje.

## 5. Limitação declarada: HEIC não funciona

iPhone fotografa em HEIC por padrão, e HEIC quebra os **dois** passos: o leitor de
EXIF entende só JPEG, e o `canvas` do Chrome não decodifica HEIC para
redimensionar.

O seletor aceita `image/jpeg`, `image/png` e `image/webp`. Arquivo fora disso é
**recusado com o motivo na tela**, nunca engolido em silêncio.

**Gatilho:** se as fotos do dono forem majoritariamente HEIC, converter vira
assunto próprio — e custa dependência pesada (`heic2any` ou equivalente), o que
exige ADR.

## 6. Camadas e arquivos

| Arquivo | Importa | Papel |
|---|---|---|
| `src/domain/photo.ts` | só `domain` | Tipo `Photo`, validação de legenda, tipos aceitos |
| `src/lib/images/exif.ts` | só `domain` | Leitor de EXIF, ~120 linhas, puro |
| `src/lib/images/exif.test.ts` | — | Testes |
| `src/lib/images/resize.ts` | só `domain` | Canvas, só navegador |
| `src/lib/images/storage-path.ts` | só `domain` | Monta `{userId}/{placeId}/{uuid}.jpg`, puro |
| `src/lib/supabase/browser.ts` | nada do projeto | **Primeiro cliente de navegador do projeto** |
| `src/lib/data/photo-repository.ts` | `domain` | Contrato |
| `src/lib/data/supabase/photo-row.ts` | `domain` | Tradução linha↔domínio, com testes |
| `src/lib/data/supabase/supabase-photo-repository.ts` | `domain`, `lib/supabase` | Adapter, e quem assina as URLs |
| `src/app/actions/photo-actions.ts` | `domain`, `lib` | Fronteira de escrita |
| `src/components/explore/PlacePhotos.tsx` | `domain`, `lib` | Galeria e upload |
| `docs/decisions/0014-cliente-supabase-no-navegador.md` | — | ADR |

### O ADR 0014

Não existe cliente Supabase de navegador no projeto: **toda** escrita até hoje
passa por Server Action. Este é o primeiro.

Não é furo — a chave `anon` já é pública por construção e a RLS é a fronteira
(ADR 0008) —, mas alarga a superfície: passa a existir no navegador um cliente
com sessão capaz de fazer tudo que a RLS permitir. Merece registro, não um commit
silencioso.

**Restrição que o ADR fixa:** o cliente de navegador é usado **apenas** para
`storage.from('fotos')`. Qualquer leitura ou escrita de tabela continua em Server
Action. Se algum dia isso mudar, muda por decisão registrada.

## 7. Leitura

URL assinada com **1 hora**, gerada no servidor, **em lote** — uma chamada para a
galeria inteira via `createSignedUrls`, não uma por foto.

## 8. Dívida conhecida: o arquivo órfão

Upload e gravação da linha são duas operações em dois sistemas, e o arquivo sobe
primeiro. Se a action falhar depois do upload, sobra um objeto pago e invisível.

**Não dá para tornar atômico.** O tratamento: em caso de recusa, o cliente apaga o
objeto que acabou de subir antes de exibir o erro. Não é garantia — o navegador
pode fechar no meio.

Fica registrado como dívida, com gatilho de limpeza periódica se algum dia o
volume importar.

## 9. Interface

Galeria no painel do lugar, encabeçada pela linha "N fotografias" que já existe.
Grade separada por hairline, sem card, raio na escala.

**Sem `next/image`:** a URL assinada muda a cada leitura, e o otimizador geraria e
cachearia uma variante por assinatura. `<img>` direto.

**Sem skeleton** — proibido pelo ADR 0009, e o substituto é melhor: como gravamos
`width` e `height`, a grade **reserva a proporção exata** antes de a imagem
chegar. Nada pula.

**Apagar:** dois passos no painel, como apagar lugar e apagar viagem. Apaga a
**linha primeiro**, depois o objeto: arquivo órfão é desperdício, mas linha
apontando para arquivo inexistente é foto quebrada na tela.

## 10. Erros, todos no painel

| Situação | O que aparece |
|---|---|
| Formato não suportado (HEIC etc.) | Recusa dizendo qual formato mandar, **antes** de qualquer upload |
| Upload falhou | `InlineMessage`, e o objeto parcial é removido |
| Gravação falhou depois do upload | Idem, mais a limpeza do objeto |
| Foto sem EXIF | **Não é erro.** A data fica em branco e o painel diz "data desconhecida" — nunca o dia do upload disfarçado de dia da foto |

## 11. Verificação e definição de concluído

- [ ] `exif.test.ts` com o buffer **montado no próprio teste**: as duas ordens de
      byte (`II` e `MM`), coordenada sul/oeste virando negativa, `DateTimeOriginal`
      virando `YYYY-MM-DD`, e JPEG sem EXIF devolvendo `null`. Fixture binário no
      repositório seria opaco; buffer construído é legível.
- [ ] **Um teste que trave a data:** foto sem EXIF grava `taken_on` nulo, e
      **nunca** a data de hoje. É a regra mais fácil de quebrar sem perceber.
- [ ] `resize.test.ts`: retrato, paisagem, e imagem menor que 2000px **não** é
      ampliada.
- [ ] `storage-path.test.ts` e `photo-row.test.ts`.
- [ ] **Verificação visual**: subir uma foto de verdade e olhar a tela.
- [ ] **A prova do ciclo:** depois do upload, o `photoDot` **acende no pin**. Ele
      já existe e está apagado hoje — se não acender, o trigger não funcionou.
- [ ] **Prova de RLS do Storage:** cliente anônimo não lê nem escreve na pasta de
      outro usuário. Nova seção em `docs/VERIFICACAO-RLS.md`.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` limpos.
- [ ] ADR 0014.
- [ ] `CHANGELOG.md`.

## 12. Omissões deliberadas, com gatilho

| Omitido | Gatilho |
|---|---|
| Conversão de HEIC | Fotos do dono serem majoritariamente HEIC |
| Reordenar fotos à mão | `sort_index` já grava a ordem de upload |
| Limpeza de órfãos | Volume de arquivos sem linha começar a importar |
| Foto anexada a uma viagem | `trip_id` existe e aceita nulo; ligar upload à tela de viagem é incremento pequeno depois |
