# 0007 — Dependências do Supabase

## Contexto

O `CLAUDE.md` declara que este projeto "prefere ~80 linhas de código próprio a um
wrapper", e o [ADR 0001](./0001-stack-e-limite-de-dependencias.md) fixou o limite
de dependências. Até a fase de persistência o `package.json` tinha **quatro**
dependências de produção: `maplibre-gl`, `next`, `react` e `react-dom`. O projeto
já recusou deliberadamente `react-map-gl`, bibliotecas de estado global e
bibliotecas de data.

Conectar o Supabase — banco, autenticação e RLS — exige falar dois protocolos:
PostgREST para dados e GoTrue para sessão. Falar o primeiro à mão é viável; o
segundo não.

## Decisão

Adotar duas dependências de produção:

- **`@supabase/supabase-js`** — cliente de dados e de autenticação.
- **`@supabase/ssr`** — a ponte que faz a sessão viajar entre Server Component,
  Server Action e middleware por cookie.

Nenhuma outra dependência entra nesta fase. Sem biblioteca de formulário, de
data ou de notificação: `<input type="date">` nativo e `useOptimistic` do
React 19 resolvem, e as mensagens de erro vivem no próprio painel.

## Motivos

- **Não há versão própria razoável do segundo pacote.** `@supabase/ssr` implementa
  refresh de token, o fluxo PKCE e a serialização do cookie de sessão. Reescrever
  isso não é "80 linhas de código próprio": é a classe de código em que um erro
  não é um bug, é uma falha de segurança. A regra do `CLAUDE.md` existe para
  evitar wrappers de conveniência, não para proibir bibliotecas de protocolo.
- **O custo no cliente é zero.** O login é iniciado por Server Action, que chama
  `signInWithOAuth`, recebe a URL do Google e redireciona. Não existe cliente
  Supabase no navegador nesta aplicação, então `supabase-js` fica inteiro fora do
  bundle do cliente — o que importa num produto cujo peso de JavaScript já é
  quase todo MapLibre.
- **A alternativa real seria pior.** Falar PostgREST com `fetch` puro é possível,
  mas a montagem de embeds (`places?select=*,place_user_states(*)`) e o
  tratamento de erro do PostgREST viraria um cliente próprio mal testado — um
  wrapper de fato, só que escrito por nós.

## Consequências

- A superfície de atualização do projeto passa a incluir dois pacotes com ciclo
  de release próprio.
- A tipagem das linhas do banco é nossa responsabilidade: não geramos tipos a
  partir do schema, e as interfaces de linha vivem à mão em
  `src/lib/data/supabase/`. É deliberado — gerar tipos exigiria a CLI do Supabase
  no fluxo de build, que é uma terceira dependência.
- O mapeamento linha → domínio é extraído como função pura
  (`toExplorePlaceFromRow`) justamente para que a parte que carrega decisões seja
  testável sem rede.

## Gatilho de revisão

Reavaliar quando:

- O Supabase deixar de ser o backend; ou
- `@supabase/ssr` divergir do modelo de cookies do Next a ponto de exigir mais
  código de contorno do que economiza — o momento em que um cliente próprio
  passaria a ser o caminho mais simples, e não o mais arriscado.
