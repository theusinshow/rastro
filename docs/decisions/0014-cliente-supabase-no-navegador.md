# 0014 — Cliente Supabase no navegador, só para o Storage

**Não altera** o [ADR 0008](./0008-rls-como-fronteira-de-autorizacao.md): a RLS
continua sendo a única fronteira de autorização. **Restringe** o cliente novo a
um uso só.

## Contexto

Até aqui, **toda** escrita do Rastro passava por Server Action. Não existia
cliente Supabase de navegador no projeto — `src/lib/supabase/` tinha apenas
`config`, `server` e `middleware`.

Fotos mudam isso por um limite técnico: Server Actions do Next têm limite de
corpo de **1 MB** por padrão. Uma foto reduzida a 2000px cabe por pouco, e
qualquer uma que o redimensionamento não encolha o bastante quebraria. Passar
binário por Server Action é frágil por construção.

## Decisão

Existe `src/lib/supabase/browser.ts`, e ele é usado **apenas** para
`storage.from('fotos')`.

Qualquer leitura ou escrita de tabela continua atrás de Server Action.

## Motivos

- **O binário não atravessa o Next.** O arquivo vai do navegador ao Storage
  diretamente, e o limite de corpo deixa de existir.
- **A autorização continua no banco.** Quem decide é a política de RLS sobre
  `storage.objects`, que prende cada usuário à própria pasta comparando o
  primeiro segmento do caminho com `auth.uid()`. Nenhuma regra de acesso migra
  para código de aplicação.
- **Não amplia o que já é público.** A chave `anon` já vai ao navegador por
  construção — o prefixo `NEXT_PUBLIC_` diz isso. O que muda é existir uma
  instância com sessão.

## Consequências

- **Passa a existir no navegador um cliente capaz de fazer tudo que a RLS
  permitir.** Isso não é um furo: é exatamente o modelo do Supabase, e o ADR 0008
  já apostava nele. Mas é superfície nova, e por isso a restrição de uso acima é
  **parte da decisão**, não uma recomendação.
- **Se algum dia uma tabela precisar ser lida do navegador**, isso muda por
  decisão registrada, não por conveniência de um commit.
- **O upload deixa de ser atômico com a gravação da linha.** São dois sistemas: o
  arquivo sobe primeiro e a Server Action grava depois. Se a segunda falhar,
  sobra um objeto órfão — dívida conhecida, tratada por limpeza no cliente e
  registrada na spec de Fotos §8.

## Gatilho de revisão

Se aparecer necessidade de leitura em tempo real — uma subscription do Supabase,
por exemplo —, a restrição a Storage precisa ser reaberta. E aí a conversa é
sobre qual tabela e com qual política, não sobre o cliente em si.
