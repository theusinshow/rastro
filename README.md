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
> o que falta em vez de oferecer botões que não gravariam nada. E o mesmo para
> as duas chaves opcionais — `OPENROUTESERVICE_API_KEY` (traçado real) e
> `GEOAPIFY_API_KEY` (postos de combustível).

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

### Configurando os postos de combustível (opcional)

O botão **Postos**, no alto da área de mapa, busca postos de combustível reais
em volta de um ponto. Sem chave configurada ele continua na tela e diz, ao ser
apertado, que a busca não está configurada — nada mais do app é afetado.

1. Criar conta gratuita em
   [myprojects.geoapify.com](https://myprojects.geoapify.com/) — **não pede
   cartão de crédito**. O plano gratuito dá 3.000 créditos por dia.
2. Criar um projeto; a chave é gerada sozinha na seção *API Keys*.
3. Colar em `GEOAPIFY_API_KEY` no `.env.local`.

   > **Sem o prefixo `NEXT_PUBLIC_`, e isso é o ponto todo.** A consulta sai do
   > servidor, por `/api/fuel-stations`, e a chave nunca entra no pacote
   > entregue ao navegador. Uma chave de Places exposta no cliente é cota de
   > qualquer um.

4. Antes de publicar, restringir a chave por *HTTP referrer* / origem no painel
   da Geoapify.

#### O endpoint interno

```
GET /api/fuel-stations?lat=-27.645&lon=-48.669&radius=20000&limit=20
```

Exige sessão — `src/proxy.ts` cobre a rota, e é isso que impede a cota diária de
ser drenada por quem não usa o Rastro.

| Parâmetro | Obrigatório | Padrão | Faixa |
|---|---|---|---|
| `lat` | sim | — | −90 a 90 |
| `lon` | sim | — | −180 a 180 |
| `radius` | não | 20000 | 1000 a 50000 metros |
| `limit` | não | 20 | 1 a 50 |

Parâmetro **ausente** cai no padrão; parâmetro **fora da faixa** é recusado com
`400`, e não grampeado em silêncio — grampear devolveria uma resposta que não é
a pedida sem que ninguém soubesse.

Sucesso devolve `{ stations, attribution }`, com os postos já normalizados e
ordenados do mais perto para o mais longe. Falha devolve
`{ error: { code, message, retryable } }`, com `message` em PT-BR e sem nenhum
detalhe técnico do provedor:

| Código | HTTP | Quando |
|---|---|---|
| `parametro` | 400 | coordenada, raio ou limite inválidos |
| `sem-chave` | 503 | `GEOAPIFY_API_KEY` não configurada |
| `cota` | 503 | cota diária da Geoapify estourada |
| `chave-recusada` | 502 | credencial inválida ou bloqueada |
| `rede` / `indisponivel` | 502 | provedor fora do ar ou resposta inesperada |
| `tempo-esgotado` | 504 | provedor não respondeu em 8 s |

#### Cache e consumo

- **Servidor**: a chamada à Geoapify é cacheada por **6 horas** e compartilhada
  entre todos os usuários. É aqui que se economiza crédito — o dado vem do
  OpenStreetMap, onde um posto muda em escala de semanas.
- **Navegador**: **10 minutos**, com chave por coordenada arredondada a três
  casas (≈110 m) + raio + limite. Mover o mapa dois quarteirões não custa
  consulta nova.
- **Nada busca sozinho.** Não há requisição durante `drag`, `zoom` ou animação:
  toda consulta sai de um gesto explícito.
- Custo: 1 crédito a cada 20 postos devolvidos.

#### Atribuição

O dado é do OpenStreetMap sob **ODbL 1.0**, e o plano gratuito da Geoapify exige
o crédito ao provedor. Os dois aparecem no rodapé do painel de postos enquanto a
camada está ligada, e também no corpo da resposta do endpoint. **Não remova
nenhum dos dois**, nem a atribuição do mapa (MapTiler e OpenStreetMap) que o
MapLibre desenha no canto.

#### Problemas conhecidos

- A cobertura é a do OpenStreetMap: um posto que existe na estrada pode
  simplesmente não estar mapeado, e o estado vazio diz isso em vez de afirmar
  que não há posto.
- Bandeira e horário só aparecem quando alguém os mapeou. Horário sai como o
  OSM o escreve (`Mo-Su 06:00-22:00`); só `24/7` é traduzido, para "24 horas".
- Distâncias são em **linha reta**, não por estrada.
- A busca é por proximidade a um ponto. Postos **ao longo de uma rota** ainda
  não existem — ver a pendência no
  [ADR 0020](docs/decisions/0020-geoapify-para-postos-de-combustivel.md).

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
