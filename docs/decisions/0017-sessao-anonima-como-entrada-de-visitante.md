# 0017 — Sessão anônima como entrada de visitante

## Contexto

O produto precisa ser olhado por outras pessoas antes de ter usuários. Exigir
conta Google para qualquer olhada é um pedágio alto para quem só vai opinar: a
pessoa entrega uma identidade real para avaliar um produto que ainda não sabe se
quer usar.

A dificuldade é que o Rastro não tem uma camada de leitura pública para
aproveitar. A autorização inteira é RLS por `auth.uid()`
([ADR 0008](./0008-rls-como-fronteira-de-autorizacao.md)), o middleware
redireciona toda rota privada sem usuário, e `sessionContext()` lança sem
sessão. Um modo visitante **sem sessão** significaria uma segunda implementação
de cada leitura da aplicação — e essa segunda ficaria, por construção, fora da
proteção do banco. Seria construir o caminho mais exposto do produto justamente
onde nenhuma política vigia.

## Decisão

**A entrada de visitante é uma sessão anônima do Supabase**
(`supabase.auth.signInAnonymously()`). O visitante recebe uma linha real em
`auth.users`, um `auth.uid()` próprio, e a claim `is_anonymous = true` no JWT.

Duas consequências centrais:

**1. Nada da camada existente muda.** Como `auth.uid()` passa a existir,
middleware, repositórios e todas as políticas de RLS funcionam sem um único caso
especial. Este é o motivo da decisão, não um efeito colateral feliz: é o que
permite não escrever a segunda implementação.

O visitante vê o catálogo público de lugares — `places_read` já é
`using (is_public or created_by = auth.uid())` desde a migração 0001 — e um
estado pessoal vazio, que ele preenche e que some junto com a sessão. Tudo que
ele escreve já era privado por política, e lugar criado por usuário já nascia
`is_public = false`.

**2. A única escrita fechada é a fotografia, e quem fecha é o banco.** Duas
políticas restritivas na migração 0008, uma em `storage.objects` e outra em
`photos` — a tabela que a migração 0004 renomeou a partir de `trip_photos`.

São as duas, e não só a do Storage, porque `addPhotoAction` grava o arquivo no
bucket *e* uma linha na tabela: barrar um lado só deixaria lixo pela metade —
arquivo sem linha, ou linha apontando para arquivo que não existe.

São **restritivas**, e não mais duas permissivas, porque restritivas entram com
`AND` sobre as que já existem: `fotos_insert_own` e `photos_own` continuam
valendo inteiras e não precisam ser reescritas para ganhar uma condição.

O `coalesce` nas duas não é defensivo, é obrigatório: para quem entrou pelo
Google a claim `is_anonymous` não vem no JWT, `null = false` resulta em `null`,
e a política trata `null` como negação. Sem ele, **ninguém** subiria foto.

**Esconder o controle de envio na interface é placa na porta, não tranca.** O
predicado `canUploadPhotos` em `src/domain/guest.ts` existe para não *oferecer*
o que o banco vai recusar. Se ele e a política divergirem, quem manda é a
política — e é por isso que a verificação em `docs/VERIFICACAO-RLS.md` testa as
quatro combinações de identidade e alvo, e não só as recusas.

## Consequências

- **Sair é perder.** O visitante que clica em "Entrar com conta" destrói tudo
  que fez, sem confirmação. É o desenho — a sessão descartável é a proposta —
  mas é o único ponto do produto onde uma ação apaga dado sem perguntar.

- **A faxina de visitantes tem ordem obrigatória.** `places.created_by` é
  `on delete set null`: apagar o usuário primeiro deixa os lugares dele com
  `created_by` nulo e `is_public` falso, o que os torna invisíveis para todo
  mundo — inclusive para quem vier limpar depois — e permanentes. Os lugares
  saem antes do usuário. O SQL está em `docs/VERIFICACAO-RLS.md`, para rodar à
  mão; não há cron, e um punhado de sessões não justifica um.

- **A palavra "anônimo" fica sobrecarregada.** Em `docs/VERIFICACAO-RLS.md` ela
  já significa *requisição sem sessão nenhuma*, que é o papel `anon` do Postgres.
  O conceito novo é o oposto: um usuário **autenticado** sem identidade. Na
  documentação e na interface deste conceito, a palavra é **"visitante"**.
  Confundir os dois faz alguém ler uma verificação de RLS e concluir o contrário
  do que ela diz.

- **Depende de uma chave ligada fora do repositório.** *Authentication → Sign In
  / Providers → Allow anonymous sign-ins*, no painel do Supabase. Já ligada. A
  tela de entrada trata o erro nomeando essa chave, em vez de falhar muda.

- **Não há conversão de visitante em conta** (`linkIdentity`). O objetivo é
  avaliação, não adoção: quem gostar entra pelo Google e começa limpo. Se isto
  mudar, é decisão nova e ADR novo.

- **`handle_new_user` não foi tocado.** O desenho previa uma emenda, porque o
  visitante não tem e-mail nem metadados e o `display_name` do perfil dele nasce
  nulo. A emenda foi descartada ao verificar que `display_name` não é renderizado
  por nenhum componente: nulo ali não produz efeito visível, e mexer num trigger
  `security definer` sem efeito observável é risco sem retorno.

- **O visitante consome cota externa** — traçado (OpenRouteService) e
  geocodificação são chamados por qualquer sessão. Aceito conscientemente: o
  público desta porta é conhecido e pequeno. Se o endereço for divulgado em
  aberto, isto vira assunto antes de qualquer outra coisa nesta lista.

## Gatilho de revisão

Reavaliar se o visitante deixar de ser um recurso de avaliação e virar um degrau
de adoção — alguém que entra sem conta, gosta, e quer ficar. Nesse ponto a
sessão descartável passa a destruir trabalho de verdade, e a conversão por
`linkIdentity` deixa de ser escopo cortado para virar requisito.
