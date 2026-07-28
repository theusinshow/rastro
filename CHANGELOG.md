# Changelog

Todas as alterações relevantes deste projeto são registradas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o
projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> **Regra primordial do repositório:** todo commit exige uma entrada
> correspondente aqui. Ver `CLAUDE.md`.

---

## [Não lançado]

### Adicionado

- Os catorze lugares passam a viver num banco de verdade, como catálogo
  compartilhado — e continuam marcados como dado de desenvolvimento não
  verificado, porque é o que são
- Perfil criado automaticamente no primeiro login, sem origem definida: a origem
  é escolhida por você, e inventar uma faria o produto mentir sobre distâncias
  na primeira sessão
- Criar um lugar: clicar no mapa define onde é, e o formulário pede nome,
  categoria, município e descrição. O mapa deixa de ser um catálogo que alguém
  escolheu por você e passa a ser o seu
- Lugares criados por você nascem privados
- Editar e apagar um lugar que você criou. Lugares do catálogo compartilhado não
  oferecem nem uma coisa nem outra — sobre eles você tem opinião, não posse
- Apagar um lugar diz antes quantas visitas registradas vão junto, porque vão
- "Quero conhecer" passa a gravar, e o pin muda de cor no mapa
- Histórico de visitas por lugar: registrar uma visita acrescenta uma data ao
  seu histórico em vez de acender uma chave, e voltar ao mesmo lugar acrescenta
  outra. A data começa em hoje e pode ser corrigida
- "Visitado" continua sendo consequência de ter registrado uma visita, e não um
  botão: um controle que oferecesse desmarcar só poderia fazê-lo apagando
  memória
- Favoritar um lugar passa a gravar de verdade, e o anel do pin responde no
  quadro seguinte ao toque — não depois de uma ida ao servidor. Se a gravação
  falhar, o estado volta e o painel diz o motivo
- Você define seu ponto de partida clicando no mapa, e todas as distâncias do
  produto passam a ser medidas de onde suas viagens realmente começam
- Escolher uma coordenada passa a ser um clique no mapa, e a coordenada ao vivo
  da barra de status — que até aqui era só mostrador — vira a mira: o número que
  você lê é o que vai ser gravado
- Entrada pelo Google, em um toque e sem senha — o produto é usado na estrada, e
  digitar senha de luva não é um requisito razoável
- A tela de entrada diz em texto quando o banco não está configurado, em vez de
  oferecer um botão que falharia em silêncio
- As telas do aplicativo passam a exigir sessão, e uma sessão que expira no meio
  de uma tarefa devolve você ao ponto onde estava depois de entrar, em vez de
  jogar na tela inicial
- Um lugar passa a carregar o histórico de visitas e a informação de quem o
  criou — as duas coisas que o painel precisa para deixar de ser só leitura
- Validação de lugar como função pura e testada: nome, coordenada e categoria
  são recusados em português antes de qualquer ida ao servidor, espelhando as
  mesmas faixas que o banco impõe
- Conexão com o Supabase, criada por requisição e apenas no servidor: nenhum
  quilobyte de cliente de banco entra no navegador, num produto cujo peso de
  JavaScript já é quase todo mapa
- ADR 0007 registrando as duas dependências do Supabase e o critério que as
  aprovou, num projeto que recusa dependência por padrão
- ADR 0008 registrando a RLS como fronteira de autorização, em vez de um
  parâmetro de usuário que alguém pode esquecer de passar
- Roteiro de verificação manual das políticas de acesso em
  `docs/VERIFICACAO-RLS.md`, bloco por bloco e com o resultado esperado de cada
  um: nenhum teste automático cobre política de banco
- Plano de implementação da segunda fase em catorze tarefas, com código, testes,
  passos manuais de infraestrutura e critérios de verificação por passo
  (`docs/superpowers/plans/2026-07-27-rastro-persistencia-e-identidade.md`)
- Documento de design da segunda fase — persistência e identidade — definindo
  como o Rastro deixa de ser demonstração e passa a guardar o que é seu: conta
  própria, favoritos e visitas que duram, e lugares criados por você
  (`docs/superpowers/specs/2026-07-27-rastro-persistencia-e-identidade-design.md`)
- Auditoria de design da fundação em `docs/2026-07-27-auditoria-de-design.md`,
  com o plano de movimento completo e o backlog de polimento ainda não
  implementado

### Adicionado

- Documento de design da fundação do Rastro, definindo modelo de dados, estratégia
  de mapa, direção visual e escopo da primeira entrega
  (`docs/superpowers/specs/2026-07-27-rastro-fundacao-design.md`)
- `CLAUDE.md` com as regras operacionais do repositório, incluindo a regra
  primordial do changelog, a definição de concluído e as regras de camadas
- Plano de implementação da fundação em treze tarefas, com código, testes e
  critérios de verificação por passo
  (`docs/superpowers/plans/2026-07-27-rastro-fundacao.md`)
- Este changelog
- Estrutura base do projeto com Next.js App Router, TypeScript strict, Tailwind
  CSS v4, ESLint e Vitest
- ADR 0001 registrando a stack e o limite deliberado de dependências
- README com instruções de execução e índice da documentação
- Design system com tokens de superfície, texto, acento âmbar e estados de visita
- Primitivos de interface: Button, Chip, Toggle e Stat
- Tipografia Geist Sans e Geist Mono auto-hospedadas via next/font
- Documentação do design system em `docs/DESIGN-SYSTEM.md`
- Camada de domínio com tipos de lugar, moto e viagem, sem dependência de UI
- Cálculo de distância por haversine e formatadores de coordenada, distância e
  duração, cobertos por testes
- Derivação de status de visita a partir do estado pessoal do lugar
- Filtros de exploração por categoria, raio, status de visita e favoritos, como
  funções puras cobertas por testes
- Algoritmo de descoberta que estima distância rodoviária e tempo de ida e volta
  a partir do tempo disponível, reservando margem para paradas
- Interface `PlaceRepository` com adapter em memória, isolando a interface do
  banco de dados
- Coleção de 14 lugares de Santa Catarina como dados de desenvolvimento,
  explicitamente marcados como não verificados
- Moto inicial CFMOTO IBEX 450
- Migration inicial do Supabase com oito tabelas, enums, índices, trigger de
  derivação de visitas e políticas de RLS por usuário
- ADR 0003 registrando a separação entre catálogo, estado pessoal e visitas, e a
  remoção da entidade `Favorite`
- ADR 0004 registrando a decisão de não adotar PostGIS nesta fase
- Documentação do modelo de dados em `docs/DATA-MODEL.md`
- Shell da aplicação com barra superior, corpo de altura total e barra de status
- Navegação principal entre Explorar, Descobrir, Viagens e Memórias
- Painel de overlay reutilizável, posicionado sobre a área do mapa
- Rotas de Viagens e Memórias como stubs explicativos
- Mapa MapLibre em tela cheia com estilo escuro autoral sobre tiles do MapTiler,
  com relevo sombreado das serras e ênfase na malha viária
- Instância de mapa persistente no layout, preservando posição e zoom ao navegar
  entre as áreas do aplicativo
- Área "Para onde vamos?" com tempo disponível, distância máxima, categorias e
  filtros de não visitados e favoritos
- Resultados de descoberta ordenados por distância e recortados no mapa,
  considerando o tempo de ida e volta e reservando margem para paradas
- Estado de fallback explícito quando a chave do MapTiler não está configurada
- Coordenadas e zoom ao vivo na barra de status
- ADR 0002 registrando o mapa persistente no layout
- Documentação da estratégia de mapa em `docs/MAP-STRATEGY.md`
- Estado de erro explícito quando o mapa falha ao carregar, com a mensagem
  técnica visível, no lugar de uma tela preta silenciosa
- Pins de lugares no mapa com três canais visuais independentes: cor do miolo
  para o status de visita, anel externo para favorito e ponto satélite para
  lugares com fotos
- Seleção de lugar por clique no pin, refletida na URL e preservada ao recarregar
- ADR 0005 registrando os pins como camadas data-driven
- Painel lateral do lugar, aberto ao selecionar um pin, com categoria,
  localização, distância e tempo estimados, status de visita, fotografias,
  descrição e etiquetas
- Ação "Abrir rota", que delega a navegação a um aplicativo de rotas externo
- Formatação de datas de visita no vocabulário de diário de viagem
- Trilha de filtros por categoria, raio, situação de visita e favoritos
- Estado de filtros e seleção mantido na URL, tornando qualquer recorte do mapa
  compartilhável e reproduzível
- Contagem de lugares visíveis na barra de status
- ADR 0006 registrando a URL como fonte do estado de exploração
- Documentação de arquitetura, roadmap e contribuição
- Briefings de contexto do projeto para as skills de design, evitando respostas
  genéricas ao trabalhar na interface
- Tokens de movimento no design system: quatro durações, três curvas e um
  realce de sinal, com o ritmo declarado num lugar só em vez de espalhado
- Painéis entram e saem com um deslocamento curto em vez de piscar entre um
  quadro e outro, deixando claro de onde vieram e que o mapa continua atrás
- Recuo tátil ao pressionar qualquer botão, que confirma o toque mesmo quando o
  resultado acontece fora do campo de visão
- O mapa resolve num fade quando os primeiros tiles chegam, em vez de aparecer
  de estalo sobre o fundo escuro
- Respeito à preferência de movimento reduzido do sistema, sem desligar os dois
  movimentos que carregam informação: o crossfade dos pins e o realce da
  contagem sobrevivem; a câmera passa a cortar seco em vez de viajar
- O mapa passa a responder à seleção: escolher um lugar reposiciona a câmera com
  o painel descontado do enquadramento, para que o pin escolhido nunca fique
  embaixo dele
- "Encontrar destino" recompõe o mapa sobre os destinos encontrados, com as duas
  colunas descontadas — a pergunta "para onde vamos?" agora é respondida no
  mapa, e não só numa lista de texto
- Mudar o recorte faz os pins entrarem e saírem num crossfade, tornando legível
  o tamanho da mudança em vez de trocar tudo em um quadro
- O anel de seleção cresce a partir do miolo do pin, o que diz qual dos pins
  agrupados foi escolhido
- Lista dos lugares no recorte na trilha de filtros, com nome, categoria,
  distância e situação de visita: torna o produto navegável só com teclado —
  antes não havia caminho nenhum até um lugar sem mouse sobre o mapa — e realça
  no mapa o pin da linha sob o cursor ou o foco
- Estado vazio na tela inicial: quando nenhum lugar cabe no recorte, a interface
  diz qual filtro está eliminando mais lugares e oferece a remoção em um clique
- Estado vazio da descoberta com recuperação: no lugar de sugerir em prosa,
  oferece o menor ajuste de limite que devolveria destinos
- Contagem de lugares anunciada a leitores de tela, que era a única
  representação acessível do resultado de um filtro e era silenciosa
- Cabeçalho principal em cada rota, para navegação por cabeçalhos
- Contagem de lugares na barra de status também em "Descobrir", onde ela
  simplesmente sumia
- Revelação escalonada dos resultados da descoberta, que estabelece a ordem de
  leitura da lista — do mais distante ao mais próximo
- `--sheet-height`, variável compartilhada entre a folha inferior de filtros e o
  botão "Para onde vamos?": mudar a altura da folha move o botão junto, em vez
  de os dois números divergirem em silêncio
- Testes de `animateProgress` (duração zero, cancelamento em andamento e depois
  de completo) e de `usable()` (o descarte de padding por eixo perto do
  limiar), a interpolação de câmera e o tween fora do CSS que não tinham
  cobertura nenhuma

### Alterado

- Das quatro ações que ficavam sob "Em breve" no painel de lugar, três passaram
  a funcionar e mudaram de lugar: vivem agora junto do dado que alteram, e não
  num rodapé. Sobrou "Criar viagem", que é a etapa seguinte
- A origem das distâncias passa a ser sua, lida do seu perfil, em vez de uma
  constante fixa em Palhoça
- Sem origem definida, o raio e a descoberta dizem que precisam de uma e
  oferecem o caminho, em vez de calcular distâncias a partir de um ponto que não
  é o seu. A distância também some do painel e da lista, em vez de mostrar um
  número medido de lugar nenhum
- Os lugares passam a vir do banco, e não mais de um arquivo em memória. Sem
  configuração de banco a aplicação diz isso em texto, em vez de mostrar dados de
  exemplo e dar a impressão de que gravaria alguma coisa
- Texto terciário mais claro (`#7b8884` no lugar de `#5e6b66`): a statusbar, a
  contagem do recorte e os rótulos de instrumento estavam abaixo do mínimo de
  contraste da WCAG AA e agora passam
- Alvos de toque maiores sem mudar o desenho: chips com 32px de área clicável
  sobre a mesma caixa de 24px, checkboxes de 14px em linhas de 32px, e o botão
  de fechar o painel com 32×32
- Ações indisponíveis passam de 40% para 55% de opacidade, o que devolve
  legibilidade ao rótulo sem sugerir que estão ativas
- A interface deixa de quebrar em telas estreitas: abaixo de 768px os painéis
  viram folhas inferiores, a navegação rola na horizontal em vez de cortar
  "Memórias", e a barra de status mostra coordenada e contagem numa linha só
- "Para onde vamos?" passa a ser contorno âmbar sobre fundo opaco: o
  preenchimento âmbar sólido volta a significar exclusivamente "quero conhecer"
  no mapa, em vez de disputar leitura com o dado
- O botão principal da tela inicial vem antes da trilha de filtros na ordem de
  tabulação, e não mais depois de dezenove controles de refinamento
- A faixa de fotografia do painel de lugar só reserva os 160px quando existe
  imagem; sem foto, a contagem cabe numa linha e não empurra o nome, a distância
  e a situação do lugar para baixo
- As quatro ações ainda não implementadas do painel de lugar deixam de ser uma
  grade de botões de peso idêntico acima da única ação que funciona: "Abrir
  rota" sobe para o topo e as demais viram uma linha sob "Em breve"
- `maplibre-gl` fixado na v5: a v6 exige copiar o worker para `public/` a cada
  instalação para funcionar sob o Turbopack, e a v5 dispensa qualquer
  configuração
- ADR 0001 revisado com a versão do `maplibre-gl`, o motivo de ficarmos na v5 e
  o que nos faria migrar para a v6
- A estimativa de estrada e a de tempo de pilotagem passam a viver como funções
  nomeadas do domínio (`estimateRoadKm`, `estimateRidingMinutes`), cobertas por
  teste: o painel de lugar repetia a mesma conta por fora, sem teste, e era daí
  que vinha a divergência de distância entre as telas
- A nota de rodapé da descoberta lê a velocidade média e a margem para paradas
  das constantes do domínio, em vez de repeti-las como texto que envelheceria em
  silêncio na primeira calibragem
- `AGENTS.md` deixa de ser o texto padrão do create-next-app e passa a apontar
  para `CLAUDE.md`, carregando junto a regra primordial do changelog: agentes
  que só leem `AGENTS.md` não enxergavam nenhuma regra do repositório

### Corrigido

- A tela de entrada dizia "a volta do Google veio sem o código de autorização"
  quando o Google tinha autorizado normalmente e a falha era outra, na troca do
  código por sessão. A explicação real vinha na resposta e era descartada; agora
  a tela nomeia a etapa que falhou e mostra a mensagem técnica, como o estado de
  falha do mapa já fazia
- Redirecionamento aberto na volta do login: um destino começando com `//` sai
  do site e passava pela verificação de "começa com barra", o que mandaria a
  pessoa para fora logo depois de entrar, com a sessão recém-criada
- A lista do recorte e o painel do lugar mostravam distâncias diferentes para o
  mesmo lugar — 119 km na lista e 161 km no painel para a Serra do Rio do
  Rastro, ambos rotulados "km", com os dois visíveis ao mesmo tempo. A lista
  mostrava linha reta; agora as duas telas e a descoberta mostram a mesma
  distância corrigida por estrada
- Clicar no anel externo de um lugar favorito fechava o painel que o clique
  acabara de abrir: o mapa só considerava o miolo do pin, e a borda do anel
  contava como clique no fundo
- Comentário da camada de rótulo do mapa dizia que o rótulo do pin nunca some
  por colisão, enquanto a configuração logo abaixo faz exatamente o contrário —
  e faz de propósito, para não empilhar nomes onde os pins se agrupam
- ADR 0004 afirmava que existem dois adapters de `PlaceRepository`, um deles
  sobre Supabase; só o adapter em memória existe. O argumento da decisão vale
  igual no tempo futuro e foi preservado
- Documentação alcançada pelo passe de movimento: `docs/ARCHITECTURE.md` não
  citava `src/lib/motion/` nem `src/lib/utils/`, `docs/MAP-STRATEGY.md` dizia
  "cinco camadas" sobre uma tabela de seis e atribuía aos rótulos de pin a
  tipografia dos topônimos da base, `docs/ROADMAP.md` listava telas estreitas
  como trabalho futuro depois de a folha inferior já ter sido entregue, e
  `docs/DESIGN-SYSTEM.md` omitia `--empty-delay` da lista de tokens zerados sob
  movimento reduzido
- Comentário de `photoCount` no domínio, que descrevia o campo como derivado de
  `place_visits` e mantido por trigger; ele deriva de `trip_photos` e nenhum
  trigger o mantém ainda
- Estado vazio (recorte de lugares e busca de descoberta) que sob movimento
  reduzido ficava 120ms em branco antes de aparecer: o atraso da animação era
  um valor fixo em vez de um token, e sobrevivia à duração zerada. Agora é
  `--empty-delay`, zerado no mesmo bloco que já zerava o passo do
  escalonamento pelo defeito idêntico
- Comentário de `--dur-slow` corrigido: dizia "mudança de camada de dados",
  mas o token é usado pelo fade da primeira pintura do mapa
- Duas seções "Alterado" duplicadas neste changelog, mescladas numa só sem
  perder entrada nenhuma
- Contrato de `useExitTransition` documentado: o valor recebido precisa ter
  identidade estável entre renders, ou o ajuste de estado durante o render
  entra em loop infinito

### Removido

- O usuário fixo de desenvolvimento, substituído pela conta autenticada de
  verdade. `src/mocks/user.ts` some junto: nada mais o importava
- Etapa de build que copiava o worker do `maplibre-gl` para `public/maplibre/`,
  desnecessária na v5
