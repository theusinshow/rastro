# Auditoria de UX — Rastro

**Data:** 1º de agosto de 2026
**Alvo:** https://rastro-one.vercel.app/ (produção, deploy `7f18917`)
**Método:** navegador real (Chromium via Playwright), 8 rodadas de teste, 4 personas,
5 tamanhos de tela. Console e rede capturados em todas as rodadas.
**Evidências:** `docs/auditoria-evidencias/`

> **Declaração de conflito.** Quem escreve esta auditoria também escreveu boa
> parte do código auditado, incluindo as três últimas entregas (visitante,
> sobrevoo, paleta). Os achados sobre essas entregas são autorrelatados, e o
> leitor deve pesá-los com isso em mente. Onde foi possível, medi em vez de
> opinar — os números de contraste, tempo e contagem de cliques vieram de
> instrumentação, não de julgamento.

> **Estado das correções (rodada 2, mesma data).** Sete achados já foram
> corrigidos e verificados em navegador: RASTRO-001, 002, 003, 004, 005, 007 e
> 011. Os números e notas abaixo descrevem o produto **como auditado**, antes
> das correções — é assim que um relatório de auditoria se lê seis meses depois.
> Continuam abertos: **RASTRO-006** (postos não existem) e **RASTRO-008**
> (catálogo só em SC), que são trabalho de produto e não de ajuste; e
> **RASTRO-009** (chave do MapTiler sem restrição de domínio), que se resolve no
> painel do serviço, não no código.

---

## 1. Resumo executivo

### Avaliação geral

O Rastro é um produto **visualmente maduro e tecnicamente sólido** com um
**problema de foco grave**: ele é excelente no que faz em segundo plano —
cartografia própria, honestidade sobre estimativas, autorização no banco — e
falha justamente na pergunta que ele mesmo declara ser sua razão de existir.

A pergunta central do produto é *"estou de moto, quero sair hoje, não sei para
onde ir"*. Hoje, um motociclista que abre o Rastro pela primeira vez **não
consegue respondê-la**:

1. A primeira tela fala do **passado** ("Onde você já esteve... histórias que
   ficaram"), não do passeio de hoje.
2. A tela de descoberta está **trancada** até ele definir um ponto de partida à
   mão — o app **nunca oferece usar a localização do aparelho**, porque
   `navigator.geolocation` não é usado em nenhum lugar do projeto.
3. Depois de seis cliques e uma busca de endereço, ele finalmente recebe uma
   lista de destinos. **Ao tocar em um deles, nada acontece.** A URL muda, o mapa
   recentraliza atrás do painel, e não há detalhe nem próximo passo.

O fluxo que vende o produto termina num beco. O fluxo que funciona bem
(Explorar → painel do lugar → montar roteiro) é o de *registro*, não o de
*descoberta*.

### Principais riscos

| Risco | Consequência |
|---|---|
| Descoberta em beco sem saída | O usuário conclui que o app não faz o que promete e não volta |
| Sem geolocalização | Atrito alto justamente no cenário de uso — parado ao lado da moto, de luva |
| Catálogo de 14 lugares, só em SC | Fora de Santa Catarina o produto retorna **zero** e não explica por quê |
| Postos de combustível não existem | A persona que mais precisa do Rastro (autonomia curta) não é atendida |
| Chave do MapTiler sem restrição de domínio | Cota de terceiros consumível por qualquer um que leia o bundle |

### Qualidade do fluxo principal

**Descoberta: 3/10.** Trancado na entrada, sem geolocalização, e interrompido no
meio.
**Registro (Explorar → lugar → roteiro): 7/10.** Funciona de ponta a ponta, com
informação honesta e bem apresentada.

### Prontidão para usuários reais

**Não está pronto para um lançamento aberto.** Está pronto para uso por quem já
conhece o produto e mora em Santa Catarina. Os defeitos P1 são de fluxo, não de
polimento — nenhum deles se resolve com ajuste visual.

### Cinco prioridades imediatas

1. **RASTRO-001** — Fazer o clique num destino da descoberta levar a algum lugar.
2. **RASTRO-002** — Oferecer geolocalização do aparelho, com recusa graciosa.
3. **RASTRO-003** — Não trancar a descoberta: sugerir com origem aproximada e
   pedir precisão depois.
4. **RASTRO-004** — A primeira tela precisa dizer "para onde hoje", não "onde
   você esteve".
5. **RASTRO-005** — Levar horário de retorno e autonomia para o resultado, onde a
   decisão acontece.

---

## 2. Mapa completo de telas

Treze rotas encontradas: onze páginas e dois manipuladores de rota. **Não existem**
`/perfil`, `/configuracoes`, `/ajuda`, `/termos` nem `/privacidade`.

| Rota | Finalidade | Ação principal | Como se chega | Leva para | Estados | Problemas |
|---|---|---|---|---|---|---|
| `/entrar` | Entrada | Entrar com Google **ou** sem conta | Raiz sem sessão; qualquer rota protegida | `/` ou `proximo` | normal, erro (5 tipos), Supabase não configurado | RASTRO-004, 010 |
| `/` (Explorar) | Mapa + lista de lugares | Selecionar um lugar | Padrão pós-login | Painel do lugar, `/descobrir` | com/sem origem, painel aberto/fechado, filtros | — |
| `/descobrir` | Descoberta de destino | "Encontrar destino" | Nav; CTA "Para onde vamos?" | **Beco** | trancado sem origem, formulário, 0 resultados, N resultados | RASTRO-001, 003, 007, 009, 018 |
| `/viagens` | Lista de viagens | Montar roteiro | Nav | `/viagens/nova` | vazio (bom), com viagens | — |
| `/viagens/nova` | Montar roteiro | Medir / propor | Painel do lugar; `/viagens` | `/viagens/[slug]` | à mão, proposto, medido | RASTRO-019 |
| `/viagens/[slug]` | Viagem | Ver/concluir | `/viagens` | `/viagens/[slug]/concluir` | futura, concluída | não testado com dados |
| `/viagens/[slug]/concluir` | Fechar viagem | Confirmar paradas | Viagem | `/viagens/[slug]` | — | **não testado** |
| `/memorias` | Memórias por mês | Ler | Nav | — | vazio (bom), com dados | não testado com dados |
| `/lugar/novo` | Criar lugar | Salvar | Botão "+ Novo lugar" | `/` | formulário, validação | **não testado** |
| `/lugar/[slug]/editar` | Editar lugar | Salvar | Painel do lugar | `/` | — | **não testado** |
| `/perfil/origem` | Ponto de partida + autonomia | "Definir origem" | Links contextuais | `/` | busca, escolhido, erro de validação | RASTRO-002, 016 |
| `/auth/callback` | Retorno do OAuth | — | Google | `/` ou erro | — | **não testado** (exige credencial pessoal) |
| `/entrar-dev` | Entrada por senha em dev | — | — | — | 404 em produção | correto por desenho |

---

## 3. Fluxo real executado

Tudo abaixo foi executado em produção, em navegador real. Nada aqui é imaginado.

### Rodada A — Persona 1 (visitante novo, iPhone 390×844)

1. `GET https://rastro-one.vercel.app/` → redireciona para `/entrar?proximo=%2F`.
2. Primeira tela renderiza em 0,48 s. Acima da dobra, nesta ordem: marca, H1
   *"O mapa da sua vida sobre duas rodas"*, parágrafo sobre o passado, botão
   sólido "Entrar com o Google", botão contornado "Entrar sem conta", e a frase
   sobre os limites do visitante.
3. Alvos de toque: **apenas 2 abaixo de 44 px**, e ambos são a atribuição
   obrigatória do MapLibre (58×14 e 163×14). Todo controle do produto passa.
4. Clique em "Entrar sem conta" → chega em `/` em **6,43 s** (medido esperando a
   navegação, não por temporizador fixo).
5. No app, acima da dobra: navegação de 4 destinos, CTA "PARA ONDE VAMOS? →" em
   y=344, e a lista de lugares a partir de y=619.

### Rodada B/C — Persona 2 (motociclista com ~3 h)

6. `/descobrir` sem origem: **parede**. Texto: *"A descoberta mede distância e
   tempo de ida e volta a partir de onde suas viagens começam. Defina seu ponto
   de partida para usá-la."* Um único link para sair.
7. `/perfil/origem`: busca de endereço (não é ao vivo — exige clicar "Buscar"),
   campo "como chamar", campo de autonomia, botão "Definir origem".
8. Busca "Palhoça" → **6,06 s** até os resultados → escolhido
   `Palhoça, Santa Catarina -27.6448 -48.6646`.
9. Autonomia 300 km → "Definir origem" → redireciona para `/`.
10. `/descobrir` agora mostra o formulário: TEMPO DISPONÍVEL (2 h / 4 h / 6 h /
    dia inteiro), DISTÂNCIA MÁXIMA (50/100/150/300 km), 10 categorias, 2
    alternadores. **Total: 6 cliques desde a primeira tela.**

### Rodada D — o resultado

11. Escolhido "2 horas" + "100 km" → "Encontrar destino" → 5 destinos, com nome,
    distância, categoria, duração ida e volta e estado de visita. Rodapé honesto:
    *"Estimativas em linha reta com fator de estrada, a 55 km/h médios,
    reservando 25% do tempo para paradas. Não substituem um roteador."*
12. **Toque em "Guarda do Embaú"** → URL vira `/descobrir?place=guarda-do-embau`
    → **a tela não muda**. Sem painel, sem rota, sem botão. Verificado também em
    1366×768: mesmo resultado.

### Rodada E/G — Persona 3 (autonomia) pelo caminho que funciona

13. `/?place=guarda-do-embau` (via Explorar) → painel abre corretamente, com
    "ANTES DE IR", orientação escrita à mão, "Abrir rota" e "Montar roteiro".
14. "Montar roteiro" → `/viagens/nova?paradas=<uuid>` → tela de roteiro com
    partida, seletor de paradas, "Medir o roteiro" e "Propor roteiro".
15. Autonomia — valores de borda em `/perfil/origem`:

| Digitado | Resultado |
|---|---|
| `0` | recusado — *"A autonomia precisa ser um número inteiro entre 50 e 900 km."* |
| `-100` | recusado, mesma mensagem |
| `10` | recusado, mesma mensagem |
| `5000` | recusado, mesma mensagem |
| `abc` | campo fica vazio (o navegador descarta), origem salva sem autonomia |
| espaços | idem |
| `300` | aceito |

### Rodada F — sessão, tamanhos, animação

16. Sem sessão, todas as rotas protegidas redirecionam preservando o destino:
    `/descobrir` → `/entrar?proximo=%2Fdescobrir`; idem para `/viagens`,
    `/memorias`, `/perfil/origem`, `/lugar/novo`. **Correto.**
17. `/rota-que-nao-existe` → HTTP 200 em `/entrar?proximo=%2Frota-que-nao-existe`.
    Sem página 404 para quem não tem sessão.
18. Sobrevoo da entrada: **não há controle para pular**, e ele recomeça a cada
    visita a `/entrar`. Os botões funcionam durante a animação — não bloqueia.
19. `prefers-reduced-motion: reduce` → mapa nasce parado, no ponto de pouso.
    **Correto.**
20. Cinco tamanhos (375×667, 390×844, 768×1024, 1366×768, 1920×1080):
    `scrollWidth` igual à largura em todos. **Zero transbordamento horizontal.**

### Rodada H — cobertura geográfica

21. Origem definida em "Avenida Paulista, São Paulo" → `/descobrir` com os
    filtros mais generosos (4 h, 300 km, todas as categorias) → **0 destinos**,
    com a mensagem *"Remova o filtro de favoritos ou o de não visitados"* — dois
    filtros que **não estavam aplicados**.

### O que NÃO foi executado, e por quê

| Não testado | Motivo |
|---|---|
| Login com Google | Exigiria credencial pessoal — proibido pelo escopo |
| Postos no caminho (fluxo 8 inteiro) | **A funcionalidade não existe no produto** |
| Geolocalização (fluxo 3) | `navigator.geolocation` não é usado em lugar nenhum |
| Histórico com dados | Sessão de visitante nasce vazia por desenho |
| Salvar viagem de ponta a ponta | Interrompido em "Medir/Propor roteiro" |
| Concluir viagem, criar/editar lugar | Dependem de dados que não criei para não sujar produção |
| Rede lenta, offline, 500 | Não instrumentado nesta rodada |
| Lighthouse | Não executado; usei métricas de `PerformanceObserver` |
| Leitor de tela real | Verifiquei nomes acessíveis e ordem de foco por DOM, não com NVDA/VoiceOver |

---

## 4. Problemas por severidade

### P0 — Bloqueador

Nenhum. O produto é utilizável de ponta a ponta pelo caminho de Explorar.

### P1 — Crítico

#### RASTRO-001 — Tocar num destino da descoberta não leva a lugar nenhum
- **Persona:** 2 e 4 · **Dispositivo:** 390×844 e 1366×768 · **Rota:** `/descobrir`
- **Passos:** definir origem → `/descobrir` → "2 horas" + "100 km" → "Encontrar
  destino" → tocar em "Guarda do Embaú".
- **Observado:** a URL vira `/descobrir?place=guarda-do-embau`, o mapa
  recentraliza atrás do painel de resultados, e **nenhum conteúdo novo aparece**.
  Nem painel, nem rota, nem botão de ação. Verificado nos dois tamanhos.
- **Esperado:** abrir o destino com rota, distância e um caminho para montar o
  roteiro — como `/?place=…` faz no Explorar.
- **Impacto:** o fluxo que dá nome ao produto termina no vazio. O usuário fez
  seis cliques, recebeu cinco destinos, escolheu um e não tem para onde ir.
- **Evidência:** `audit-rastro-001-clique-no-destino-sem-efeito.png`,
  `audit-rastro-001-desktop-mesmo-beco.png`
- **Arquivos prováveis:** `src/components/explore/DiscoveryView.tsx`,
  `DiscoveryResults.tsx`, `src/app/(app)/descobrir/page.tsx`,
  `use-selected-place.ts`
- **Confiança:** alta — reproduzido em dois tamanhos, com captura.

#### RASTRO-002 — O produto não tem geolocalização
- **Persona:** 1, 2 e 3 · **Rota:** `/perfil/origem`, `/descobrir`
- **Observado:** `navigator.geolocation` não aparece em nenhum arquivo do
  projeto. A única forma de informar de onde se parte é digitar um endereço e
  escolher num resultado de busca.
- **Esperado:** oferecer "usar minha localização", com recusa tratada sem
  bloquear o app.
- **Impacto:** o cenário declarado de uso é alguém parado ao lado da moto, de
  luva, querendo sair. Digitar endereço é o pior atrito possível nesse contexto.
- **Evidência:** `audit-rastro-002-origem-so-manual.png`
- **Arquivos prováveis:** `src/app/(app)/perfil/origem/page.tsx`,
  `src/components/layout/origin-context.tsx`
- **Confiança:** alta — verificado por busca no código e por uso.

#### RASTRO-003 — A descoberta está trancada até haver origem
- **Persona:** 1 e 2 · **Rota:** `/descobrir`
- **Observado:** visitante novo vê apenas um parágrafo e um link. Nenhuma
  sugestão, nenhum formulário, nenhum exemplo.
- **Esperado:** mostrar algo útil de imediato — sugerir com origem aproximada,
  ou deixar experimentar com uma cidade padrão e pedir precisão depois.
- **Impacto:** a tela que responde a pergunta central do produto é a única que
  não responde nada sem configuração prévia.
- **Evidência:** `audit-rastro-003-descoberta-bloqueada.png`
- **Confiança:** alta.

### P2 — Alto

#### RASTRO-004 — A primeira tela vende memória, não descoberta
- **Observado:** H1 *"O mapa da sua vida sobre duas rodas"* e subtítulo *"Onde
  você já esteve, o que ainda quer conhecer, e as histórias que ficaram dessas
  viagens."* Dois terços do texto falam do passado.
- **Esperado:** comunicar em até 5 segundos que o app responde "para onde eu vou
  hoje".
- **Impacto:** define a expectativa errada antes do primeiro clique.
- **Evidência:** `audit-rastro-004-primeira-tela-fala-do-passado.png`
- **Arquivo:** `src/app/entrar/page.tsx`

#### RASTRO-005 — O resultado omite 8 dos 14 dados que a decisão exige
- **Observado:** o resultado traz nome, distância, categoria, duração ida e
  volta e estado de visita. **Não traz:** fotografia, horário estimado de
  retorno, autonomia necessária, combustível, postos, tipo de piso, pedágios,
  alertas.
- **Agrava:** o piso de acesso (asfalto/terra/misto) **já existe no banco**
  (migração 0007) e é exatamente o dado que decide se dá para ir de moto de rua
  — e não aparece onde a escolha é feita.
- **Impacto:** decidir exige abrir cada destino um a um.
- **Evidência:** `audit-rastro-005-resultado-sem-dados-chave.png`

#### RASTRO-006 — Postos de combustível não existem no produto
- **Observado:** o Rastro calcula **quantas** paradas para abastecer e **em que
  quilometragem**, mas não tem nenhuma fonte de dados de postos nem camada no
  mapa. Nenhuma parte do fluxo 8 da auditoria pôde ser testada.
- **Impacto:** a persona 3 recebe "você vai precisar abastecer" sem nunca saber
  **onde**. Numa serra catarinense, essa é a diferença entre contratempo e noite
  no acostamento.

#### RASTRO-007 — O estado vazio dá conselho errado
- **Observado:** de São Paulo, com 4 h e 300 km, o app diz *"Remova o filtro de
  favoritos ou o de não visitados"* — nenhum dos dois estava aplicado, e removê-los
  não mudaria nada. A causa real (catálogo cobre só SC) nunca é dita.
- **Impacto:** manda o usuário perseguir uma solução inexistente.
- **Evidência:** `audit-rastro-007-vazio-com-conselho-errado.png`
- **Arquivo provável:** `src/domain/discovery.ts`, `DiscoveryResults.tsx`

#### RASTRO-008 — Catálogo de 14 lugares, todos em Santa Catarina
- **Observado:** a lista completa tem 14 lugares, de Garopaba à Serra do Rio do
  Rastro. Fora do raio de SC o produto retorna zero.
- **Impacto:** o produto só funciona para quem já está na região. Não é defeito
  de código — é limite de conteúdo, e precisa ser dito ao usuário.

#### RASTRO-009 — Chave do MapTiler sem restrição de domínio
- **Observado:** requisição de tile com a chave do bundle responde **HTTP 200**
  sem `Referer` e com `Referer` de domínio não autorizado.
- **Esperado:** o próprio comentário em `src/lib/map/config.ts` diz que chaves de
  tile "devem ser restringidas por domínio no painel do MapTiler". Não estão.
- **Impacto:** qualquer um que leia o bundle pode consumir a cota paga.
- **Correção:** painel do MapTiler, não código.
- **Confiança:** alta — duas requisições, ambas 200.

### P3 — Médio

- **RASTRO-010** — Sobrevoo de 11 s sem botão para pular, reiniciado a cada visita
  a `/entrar`. Atenuante verificado: **não bloqueia** — os botões respondem
  durante a animação. Evidência de que `prefers-reduced-motion` funciona:
  `audit-rastro-010-reduced-motion-ok.png`.
- **RASTRO-011** — "Tempo disponível" oferece 2 h, 4 h, 6 h e dia inteiro. A
  persona com 3 h precisa subestimar ou superestimar.
- **RASTRO-012** — O canvas do mapa é a **primeira parada de tabulação** em toda
  página do app; com a atribuição, são 4 paradas de cromo de mapa antes da
  navegação do produto.
- **RASTRO-013** — Rota inexistente devolve 200 em `/entrar` com `proximo`
  apontando para uma rota que não existe. Depois de entrar, o usuário é mandado
  para o nada.
- **RASTRO-014** — Aviso do MapLibre no console: *"You are using the same source
  for a hillshade layer and for 3D terrain."* Introduzido pelo sobrevoo (ADR 0018).
- **RASTRO-015** — Entrada como visitante leva **6,43 s** no celular; a busca de
  endereço leva **6,06 s**.
- **RASTRO-016** — "Distância máxima" é rotulada "só de ida", mas os resultados
  mostram duração "ida e volta". Não há alternador entre os dois modos.

### P4 — Baixo

- **RASTRO-017** — `/perfil/origem` é rota órfã: não existe tela de perfil, e ela
  só é alcançável por links contextuais.
- **RASTRO-018** — Não existem páginas de termos, privacidade ou ajuda.
- **RASTRO-019** — Chegar ao roteiro exige ainda dois cliques manuais ("Medir o
  roteiro" / "Propor roteiro") depois de já ter escolhido o destino.

---

## 5. Problemas por tela

| Tela | Problemas |
|---|---|
| **Boas-vindas / login** | RASTRO-004 (mensagem fala do passado), RASTRO-010 (sobrevoo sem pular), RASTRO-013 (404 vira login), RASTRO-015 (6,43 s para entrar) |
| **Dashboard (Explorar)** | Nenhum defeito funcional encontrado. Melhor tela do produto. |
| **Descoberta** | RASTRO-001 (beco), RASTRO-003 (trancada), RASTRO-007 (vazio errado), RASTRO-011 (sem 3 h), RASTRO-016 (ida vs ida e volta) |
| **Filtros** | Sem defeito; 10 categorias com alvos ≥44 px e nomes acessíveis |
| **Resultado** | RASTRO-005 (8 de 14 dados ausentes) |
| **Mapa** | RASTRO-012 (primeira parada de foco), RASTRO-014 (aviso de fonte de relevo) |
| **Rota** | RASTRO-019 (dois cliques extras) |
| **Autonomia** | Validação exemplar. Problema é de lugar: mora em `/perfil/origem` e não reaparece no resultado |
| **Postos** | RASTRO-006 — a funcionalidade não existe |
| **Histórico / Memórias** | Estados vazios bem escritos. Não testados com dados |
| **Perfil** | RASTRO-017 — não existe |
| **Configurações** | Não existe. Tema alterna por botão na barra |

---

## 6. Problemas técnicos

### Console
Zero erros em todas as rodadas. Avisos: o de fonte compartilhada entre hillshade
e relevo 3D (RASTRO-014) e avisos de desempenho de WebGL do renderizador por
software do ambiente de teste — estes últimos são artefato do headless, não do
produto.

### Rede
Zero respostas ≥400 nas rodadas B a H. Na rodada A apareceram `ERR_ABORTED` em
prefetches de RSC (`?_rsc=`) e um tile — comportamento normal de cancelamento do
Next ao navegar, não falha.

### Autenticação e sessão
**Sem defeitos.** Middleware redireciona toda rota protegida preservando o
destino. Sessão anônima funciona em produção. A trava de fotografia do visitante
foi verificada contra o banco em `docs/VERIFICACAO-RLS.md`.

### Responsividade
**Sem defeitos.** Zero transbordamento horizontal nos cinco tamanhos. Apenas dois
alvos abaixo de 44 px, ambos da atribuição obrigatória do MapLibre.

### Acessibilidade
- **Zero elementos sem nome acessível** em `/descobrir`.
- Foco visível (`outline: solid 2px`) em **todos** os 22 elementos tabulados.
- Ordem de tabulação lógica **depois** do cromo do mapa — ver RASTRO-012.
- `prefers-reduced-motion` respeitado no sobrevoo.
- Estado de visita não depende só de cor: há rótulo textual ("NÃO VISITADO") e,
  nos pins, forma (oco) além de cor — reforçado pela correção do ADR 0019.
- **Não verificado:** leitor de tela real, `aria-live` em resultados
  assíncronos, associação de mensagem de erro ao campo.

### Desempenho
TTFB 23 ms, DOMContentLoaded 528 ms, 47 recursos em `/memorias`. Os números de
peso saíram zerados por cache do navegador de teste — **medição não confiável**,
precisa ser refeita com cache limpo e Lighthouse. O custo real a vigiar é o
sobrevoo: 11 s de relevo 3D com câmera inclinada, ainda **não medido em aparelho
real**.

---

## 7. Pontos positivos

Coisas que já estão certas e **não devem ser mexidas**:

1. **A honestidade sobre estimativa.** O `~` antes de números calculados, a régua
   tracejada, e o rodapé dizendo "não substituem um roteador". Quase nenhum
   produto faz isso, e é o que separa uma ferramenta de um chute bonito.
2. **A cartografia própria.** Paleta desenhada à mão para os dois temas, relevo,
   escada de vias. Não parece um mapa de biblioteca.
3. **Autorização no banco.** RLS como fronteira, verificada por roteiro
   executável. A trava do visitante foi provada nas quatro combinações.
4. **Validação de autonomia.** Recusa 0, negativo, fora de faixa, com mensagem
   que nomeia o intervalo válido.
5. **Estados vazios escritos por gente.** *"Ainda não há o que lembrar. Registre
   uma visita, conclua uma viagem ou suba uma fotografia."*
6. **Acessibilidade de base.** Nomes acessíveis completos, foco sempre visível,
   alvos de 44 px.
7. **Identidade visual.** Nada de template SaaS, nada de gradiente decorativo,
   nada de card desnecessário. A direção "couro e instrumento" está de pé.
8. **O texto de orientação dos lugares.** *"A vila fica de um lado do rio e a
   praia do outro — a travessia é de barco."* Isso é conhecimento real, e é o
   maior diferencial do produto sobre o Google Maps.

---

## 8. Recomendações

### Correções imediatas (antes de mostrar a qualquer usuário)

1. **RASTRO-001** — Fazer `?place=` abrir o destino em `/descobrir`, reusando o
   painel que já funciona em `/`. Alternativa mais simples: fazer o item do
   resultado navegar para `/?place=<slug>`.
2. **RASTRO-002** — Botão "usar minha localização" em `/perfil/origem` e no muro
   de `/descobrir`, com recusa tratada.
3. **RASTRO-003** — Substituir o muro por um formulário utilizável com origem
   aproximada, pedindo precisão só quando ela mudar o resultado.
4. **RASTRO-007** — Estado vazio deve dizer a causa real e sugerir a ação certa.
5. **RASTRO-009** — Restringir a chave do MapTiler por domínio no painel.

### Curto prazo

6. **RASTRO-004** — Reescrever a mensagem da entrada para liderar com descoberta.
7. **RASTRO-005** — Levar horário de retorno, autonomia e piso de acesso para o
   cartão do resultado.
8. **RASTRO-011** — Acrescentar 3 h, ou trocar por um controle contínuo.
9. **RASTRO-013** — Página 404 de verdade.
10. **RASTRO-008** — Dizer no produto onde ele tem cobertura, em vez de devolver
    zero em silêncio.

### Futuro

11. **RASTRO-006** — Postos no caminho. É a maior lacuna de produto, e exige
    fonte de dados (Overpass/OSM), camada no mapa e desvio calculado.
12. **RASTRO-012** — Tirar o mapa da primeira parada de tabulação.
13. Ampliar o catálogo além de Santa Catarina.
14. Medir o sobrevoo em aparelho real e decidir se 11 s se sustentam.

---

## 9. Backlog priorizado

| Prioridade | Problema | Impacto | Esforço | Tela | Recomendação |
|---|---|---|---|---|---|
| P1 | RASTRO-001 beco no destino | Fluxo principal morre | Pequeno | Descoberta | Navegar para `/?place=` ou renderizar o painel |
| P1 | RASTRO-002 sem geolocalização | Atrito no cenário real | Médio | Origem | `navigator.geolocation` com recusa graciosa |
| P1 | RASTRO-003 descoberta trancada | Primeira impressão vazia | Médio | Descoberta | Origem aproximada por padrão |
| P2 | RASTRO-009 chave sem restrição | Cota consumível | Pequeno | — | Painel do MapTiler |
| P2 | RASTRO-007 vazio dá conselho errado | Usuário persegue solução falsa | Pequeno | Descoberta | Nomear a causa real |
| P2 | RASTRO-004 mensagem do passado | Expectativa errada | Pequeno | Entrada | Reescrever H1 e subtítulo |
| P2 | RASTRO-005 resultado incompleto | Decisão exige abrir tudo | Médio | Resultado | Retorno, autonomia e piso no cartão |
| P2 | RASTRO-008 cobertura só SC | Produto vazio fora da região | Grande | Catálogo | Dizer a cobertura; ampliar depois |
| P2 | RASTRO-006 sem postos | Persona 3 desatendida | Grande | Rota | Fonte OSM + camada + desvio |
| P3 | RASTRO-011 sem opção de 3 h | Escolha imprecisa | Pequeno | Filtros | Acrescentar 3 h |
| P3 | RASTRO-016 ida vs ida e volta | Ambiguidade numérica | Pequeno | Filtros | Alternador explícito |
| P3 | RASTRO-013 404 vira login | Destino inexistente após entrar | Pequeno | — | `not-found.tsx` + validar `proximo` |
| P3 | RASTRO-010 sobrevoo sem pular | Repetição para recorrente | Pequeno | Entrada | Botão pular + lembrar que já viu |
| P3 | RASTRO-012 mapa antes da navegação | Custo para teclado | Pequeno | Mapa | `tabindex` só quando o mapa é o alvo |
| P3 | RASTRO-014 aviso de relevo | Ruído no console | Pequeno | Mapa | Fonte separada para o terreno |
| P3 | RASTRO-015 6,4 s para entrar | Espera no início | Médio | Entrada | Investigar o custo da sessão anônima |
| P4 | RASTRO-017 perfil órfão | Rota sem casa | Médio | Perfil | Criar a tela de perfil |
| P4 | RASTRO-018 sem termos/privacidade | Exigência legal | Pequeno | — | Páginas estáticas |
| P4 | RASTRO-019 dois cliques extras | Atrito no fim | Pequeno | Roteiro | Medir automaticamente ao chegar |

---

## 10. Nota por área

| Área | Nota | Justificativa |
|---|---|---|
| **Proposta de valor** | 6 | A ideia é forte e diferenciada — o conhecimento escrito à mão sobre cada lugar é algo que o Google Maps não tem. Mas o produto entregue hoje serve melhor ao registro do que à descoberta, que é o que ele declara ser. |
| **Primeira experiência** | 4 | Bonita e sem transbordamento em nenhum tamanho, mas comunica o passado em vez do hoje, cobra 6,43 s para entrar e roda 11 s de animação sem oferecer pular. |
| **Fluxo de descoberta** | 3 | Trancado na entrada, sem geolocalização, e interrompido exatamente no momento da escolha. É a nota mais baixa porque é o fluxo mais importante. |
| **Mapa** | 8 | Cartografia própria nos dois temas, relevo real, instância persistente entre rotas, zero erro de console. Perde ponto por ser a primeira parada de tabulação. |
| **Clareza das informações** | 7 | O `~`, a régua e o rodapé de metodologia são exemplares. Perde por omitir no resultado os dados que decidem. |
| **Autonomia** | 4 | A validação é das melhores que vi; a informação está no lugar errado e o dado que a completaria — postos — não existe. |
| **Navegação** | 7 | Middleware correto, destino preservado, quatro destinos consistentes. Perde por rota órfã, ausência de 404 e beco na descoberta. |
| **Responsividade** | 9 | Zero transbordamento em cinco tamanhos, alvos de 44 px, só a atribuição obrigatória abaixo disso. |
| **Acessibilidade** | 7 | Nomes acessíveis completos, foco sempre visível, ordem lógica, movimento reduzido respeitado. Perde pelo mapa antes da navegação e por não ter sido verificada com leitor de tela real. |
| **Performance** | 6 | TTFB e DCL bons, mas 6,4 s para entrar, 6 s de geocodificação e um sobrevoo de 11 s ainda não medido em aparelho real. |
| **Consistência visual** | 9 | Nenhum traço de template ou de "AI slop". Paleta, régua, hairlines e tipografia formam um sistema coerente e defendido por ADRs. |
| **Confiança transmitida** | 7 | A honestidade sobre estimativas gera muita confiança; o estado vazio que dá conselho errado tira parte dela de volta. |

**Média: 6,4.**

A distância entre a nota de execução (mapa 8, visual 9, responsividade 9) e a
nota de fluxo (descoberta 3) é o resumo desta auditoria: **o Rastro está bem
construído e mal apontado.** Os defeitos não são de acabamento — são de
caminho, e quase todos os P1 têm correção de esforço pequeno ou médio.
