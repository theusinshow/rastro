# Changelog

Todas as alterações relevantes deste projeto são registradas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o
projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> **Regra primordial do repositório:** todo commit exige uma entrada
> correspondente aqui. Ver `CLAUDE.md`.

---

## [Não lançado]

### Corrigido

- **O mapa não recebia o mouse.** A roda não dava zoom, o arrasto não movia, o
  clique no vazio não fechava o painel do lugar e o "clique no mapa para marcar
  o ponto" da tela de origem não marcava nada. A camada onde as telas são
  desenhadas cobre a tela inteira, e estava capturando o ponteiro em vez de
  deixá-lo passar para o mapa que fica atrás dela — de 121 pontos medidos na
  tela, 75 nunca chegavam ao mapa.

  Nada disso dava erro em lugar nenhum: o mapa simplesmente não respondia, e
  cada peça de interface em volta parecia culpada. Agora a camada é transparente
  ao ponteiro e cada barra, painel e botão reativa a própria área — sobre o mapa,
  o mapa é todo seu

- **O mapa entrava torto.** O passeio da tela de entrada deixa a câmera inclinada
  em 55°, com o relevo em 3D, e esse enquadramento atravessava para dentro do
  aplicativo — onde a rotação está desligada de propósito, e portanto não havia
  gesto nenhum capaz de endireitar o mapa. O sinal que mandava a câmera se
  assentar ao chegar existia, mas tinha deixado de ser emitido quando a entrada
  trocou o sobrevoo pelo passeio

### Infraestrutura

- O Rastro está no ar em **rastro-one.vercel.app**, ligado ao GitHub: daqui em
  diante, todo push na `main` publica sozinho. As duas variáveis da entrada de
  desenvolvimento **não** foram configuradas em produção de propósito — a
  ausência delas é o segundo dos três portões que fecham aquela rota, e o
  primeiro (`NODE_ENV`) já a devolve como 404 no ar

### Alterado

- O botão **"Para onde vamos hoje?"** deixou de ser cortado pelo painel do
  lugar. Ele centraliza na faixa de mapa que sobra entre as duas colunas, e não
  mais numa faixa que ignorava a da direita — depois de crescer, 115px dele
  terminavam embaixo do painel, com a pergunta central do produto partida no
  meio

- O botão **"Para onde vamos hoje?"** ficou maior e deixou de ser translúcido:
  virou a mesma peça em relevo da barra do topo. Com o mapa passeando por trás,
  uma superfície semitransparente ficava legível sobre um enquadramento e cinza
  sobre o seguinte — e ele é a resposta à pergunta central do produto, não o
  lugar de economizar contraste. Decisões em
  [ADR 0021](docs/decisions/0021-o-primeiro-minuto-depois-de-entrar.md)

- **Direção visual nova.** A superfície esquentou um grau, a tinta clareou um
  passo e o âmbar subiu em direção ao farol. O motivo não é gosto: o texto
  apagado sobre a superfície de hover dava 4,29:1, abaixo da norma de
  acessibilidade — agora o pior par do sistema inteiro passa. O mapa foi refeito
  junto, na mesma passada, porque ele desenha em WebGL e não lê a paleta da
  interface
- A barra e o mostrador viraram **cápsulas em relevo**, e cada destino ganhou a
  sua cor — âmbar, terracota, oliva e azul de carta náutica, sempre a mesma. O
  rótulo nunca é colorido; só o glifo e o preenchimento de onde você está
- O mostrador deixou de ocupar a tela inteira embaixo e virou uma cápsula no
  canto. Ele reivindicava a importância de uma barra de ferramentas para quatro
  leituras que ninguém aciona — e comia 36px de mapa de ponta a ponta
- A trilha do Explorar ganhou um **segmento Lista / Filtros** no lugar do botão
  "Filtrar" solto: os dois modos não são um principal e um secundário

### Adicionado

- **Os vinte lugares têm foto.** O catálogo inteiro ganhou capa do Wikimedia
  Commons, cada uma com autor, licença e link para o arquivo original — inclusive
  os seis lugares novos. Antes disso, o banco tinha **uma** foto de catorze: o
  arquivo que corrigia isso existia desde julho e nunca tinha sido aplicado

- **Seis lugares novos, e o mapa deixou de ser só o eixo Urubici–Florianópolis.**
  O catálogo tinha catorze lugares concentrados numa faixa do estado, e nada no
  extremo sul, no litoral sul, no alto do planalto ou no Vale do Itajaí. Entram
  **Urupema**, **São Joaquim**, **Lauro Müller** (o pé da Serra do Rio do Rastro
  pelo lado do litoral), **Praia Grande**, **Laguna** e **Pomerode** — cada um
  ancorando uma região que não tinha nenhum.

  A lista saiu de uma curadoria de relatos de viagem de moto pelo Sul, lida como
  fonte de **fatos**: que Lauro Müller fica no pé da serra é fato, e fato não tem
  dono. Nenhuma foto e nenhum texto de lá entrou no produto — as capas continuam
  vindo do Wikimedia Commons, com autor e licença.

  E as coordenadas destes seis, ao contrário das primeiras catorze, **não são
  aproximadas**: cada uma foi geocodificada e conferida como município em Santa
  Catarina. O banco guarda essa diferença na coluna `source`, para que ela não se
  perca

- **A entrada pergunta de onde você sai.** Quem entra sem ponto de partida cai
  direto na tela que pergunta por ele, em vez de chegar a um mapa onde o raio
  está indisponível, a distância de cada lugar some e a descoberta mostra um
  muro. Era a mesma pergunta feita em quatro telas diferentes; agora é uma, no
  momento em que faz sentido.

  Não é muro: tem um "Depois — ir para o mapa" à vista, e o produto continua
  inteiro sem origem. Quem já definiu a sua entra direto, e quem entrou para
  chegar a uma viagem específica chega nela — a pergunta é de primeira vez, não
  de toda vez

- **O mapa passeia pelos lugares também depois de entrar.** A câmera desce sobre
  um lugar do catálogo, segura, e vai para o próximo — o mesmo movimento que já
  existia na tela de entrada, que sumia justamente para quem tinha acabado de
  decidir usar o produto.

  **Ele acaba no primeiro gesto seu, e não volta.** Um toque, um arrasto, uma
  rolagem, uma tecla — qualquer coisa. Aqui o mapa é ferramenta, e ferramenta que
  se mexe sozinha enquanto você a usa não é apresentação, é defeito. Por dentro
  do app a câmera também não inclina nem gira, ao contrário da tela de entrada: o
  norte é fixo neste produto, e um passeio que virasse o mapa deixaria você sem
  como endireitá-lo

- **Postos de combustível no mapa.** O botão "Postos", no alto da área de mapa,
  mostra os postos reais em volta de um ponto — a sua origem, o lugar que você
  acabou de abrir, ou o centro do mapa, se você ainda não definiu origem
  nenhuma. A lista vem do mais perto para o mais longe, cada posto abre com o
  endereço e o horário que existirem, e "traçar rota até aqui" leva ao Google
  com a partida já preenchida. O Rastro já sabia dizer que a sua volta exige uma
  parada para abastecer; agora ele sabe dizer **onde**.

  No mapa o posto é um **losango**, e não um disco como os lugares do catálogo:
  serviço não é destino, e separar os dois só por cor foi exatamente o defeito
  que a medição de contraste da paleta já tinha pegado nos pins. A forma
  sobrevive ao sol na tela, ao vidro do capacete e ao daltonismo.

  Nada busca sozinho. Arrastar o mapa não dispara requisição nenhuma — aparece
  um "buscar nesta área" quando você se afastou o bastante, e a decisão continua
  sua. Sem chave configurada, o botão continua na tela e diz que a busca não
  está disponível, em vez de girar para sempre. Dado do OpenStreetMap via
  Geoapify, com o crédito que as duas licenças exigem. Decisão registrada no
  [ADR 0020](docs/decisions/0020-geoapify-para-postos-de-combustivel.md)

- **O Rastro agora sabe onde você está.** Um toque em "usar minha localização"
  define o ponto de partida — antes, a única forma era digitar um endereço e
  escolher num resultado de busca, no exato cenário em que a pessoa está de pé
  ao lado da moto, de luva, querendo sair. Negar a permissão não trava nada: a
  mensagem diz o que aconteceu e a busca por endereço continua ali

- **Entrar sem conta.** A tela de entrada ganha uma segunda porta: dá para olhar
  o Rastro sem ter conta. O mapa chega cheio, porque o catálogo de lugares
  sempre foi público, e o visitante experimenta o produto inteiro — marcar
  visitado, favoritar, criar lugar, montar viagem, escrever memória. Só não sobe
  fotografia, que é a única coisa que deixaria arquivo permanente, e quem recusa
  é o banco e não um botão escondido. Nada do que o visitante faz sobrevive à
  sessão, e a barra de cima diz isso o tempo todo. Decisão registrada no
  [ADR 0017](docs/decisions/0017-sessao-anonima-como-entrada-de-visitante.md)

- **Os lugares agora têm fotografia.** (O SQL que preenche virou um comando
  único: em catorze comandos separados, o editor do Supabase roda só o primeiro,
  e o catálogo ficava com uma foto de catorze sem erro nenhum na tela.) Catorze de catorze, do Wikimedia
  Commons, todas com licença livre — e todas com o crédito ao lado, porque CC BY
  e CC BY-SA liberam a foto sob a condição de atribuir o autor. Foto sem autor
  ou sem licença é descartada pelo script: sem poder creditar, não há permissão
  para publicar. São fotos de terceiros, e continuam distintas das suas, que
  seguem sendo as únicas que contam no mapa

- **A entrada virou um passeio pelos lugares.** A câmera desce sobre um lugar
  do catálogo, segura alguns segundos e vai para o próximo, em ciclo — e ao lado
  aparece o nome dele, a categoria, a cidade e a linha escrita à mão sobre o que
  esperar. *"Vila litorânea entre morros, com enseadas abrigadas."* Esse
  conhecimento é o que o Rastro tem e o Google Maps não, e até agora ele só
  aparecia depois de entrar. Quem só quer entrar tem **Parar**; quem pediu
  movimento reduzido ao sistema vê um lugar só, parado

- **O botão da descoberta diz o que entrega.** Era só a pergunta "para onde
  vamos?"; agora tem uma segunda linha — *tempo, distância e o destino que
  cabe* — porque perguntar sem dizer o que volta faz o clique parecer um risco

- **A entrada virou um sobrevoo da Serra do Rio do Rastro.** A câmera começa
  alta e a sudeste, desce girando para o norte ao longo do paredão por onze
  segundos, e pousa. É a serra de verdade, com o relevo real em três dimensões —
  nada de vídeo, nada de imagem inventada: o mapa é o mesmo que responde às suas
  perguntas depois, e ele se apresenta sozinho. Ao entrar **não há corte**: o
  mapa não recomeça, a câmera só continua da serra até o enquadramento do app.
  Quem pediu movimento reduzido ao sistema não vê nada disso — o mapa já nasce
  parado, no ponto de pouso. Ver
  [ADR 0018](docs/decisions/0018-o-mapa-atravessa-a-entrada.md)

### Alterado

- **O mapa ganhou vida, e os pins pararam de mentir.** Dois pins que significam
  coisas opostas — "já fui" e "quero ir" — eram praticamente a mesma mancha na
  tela: mediam 1,19 de contraste um do outro no tema escuro e 1,006 no claro,
  onde tinham literalmente o mesmo brilho. Quem enxerga cor normalmente
  precisava de esforço; quem tem daltonismo vermelho-verde via um pin só. Agora
  "já fui" recua para um oliva fechado e "quero ir" fica no âmbar claro — o que
  também acerta o sentido, porque o lugar que você ainda quer conhecer deve
  chamar mais que o que você já riscou da lista. E o mapa em volta deixou de ser
  um vazio preto: o **mar e as lagoas aparecem**, as serras ganharam relevo de
  verdade — a sombra do terreno era preto puro sobre fundo quase preto — e a
  estrada de chão parou de sumir no fundo. Ver
  [ADR 0019](docs/decisions/0019-contraste-medido-na-paleta-do-mapa.md)

- Cada página fazia uma ida ao servidor de autenticação **por repositório que
  lia** — quem abre um lugar e seu estado pessoal pagava duas viagens de rede
  para descobrir duas vezes quem é a mesma pessoa. A sessão agora é lida uma vez
  por requisição

### Corrigido

- **A primeira tela pergunta "para onde você vai hoje?".** Antes ela dizia "o
  mapa da sua vida sobre duas rodas" e gastava dois terços do texto no que já
  aconteceu — bonito e verdadeiro, mas era a expectativa errada para quem chega
  de moto querendo sair. A memória continua na frase, no fim, que é onde ela
  entra na vida de quem usa: primeiro você vai, depois fica a história

- **"3 horas" entrou na escolha de tempo.** Havia 2, 4, 6 e dia inteiro — e o
  passeio de domingo de manhã, que é o caso mais comum do produto, caía no
  buraco entre duas opções: escolher 2 sobrava tempo, escolher 4 chegava tarde

- **O resultado da descoberta agora diz a que horas você volta.** Era o número
  que decide o passeio de domingo — "tenho até meio-dia" é a restrição real de
  quem sai de manhã — e ele não estava lá: a pessoa recebia "1h26 ida e volta" e
  fazia a soma de cabeça, no celular, ao lado da moto. Junto vieram duas outras
  leituras que também decidem: se a ida e volta **cabe no tanque**, quando você
  informou a autonomia, e se o acesso é de **terra** — um dado que já estava no
  banco e nunca aparecia onde a escolha acontece. Sem autonomia informada, o
  Rastro continua não opinando sobre combustível

- **A descoberta deixou de terminar no vazio.** Você escolhia o tempo, a
  distância, recebia cinco destinos, tocava num deles — e nada acontecia. O
  endereço mudava, o mapa se movia atrás, e a tela continuava a mesma. Agora o
  destino abre com tudo que ele tem: o que saber antes de ir, a rota e o
  roteiro. Fechar devolve a lista, sem refazer a busca

- **A tela de descoberta parou de ser um muro para quem chega.** Quem nunca
  definiu uma partida via um parágrafo e um link para outra tela. Agora resolve
  ali mesmo, num toque

- **O "nenhum destino encontrado" parou de dar conselho impossível.** Ele mandava
  remover o filtro de favoritos ou o de não visitados mesmo quando nenhum dos
  dois estava ligado — e o problema nunca foi filtro. Agora, quando ajuste
  nenhum resolve, ele diz a verdade: a que distância está o lugar mais próximo
  do catálogo, e que o Rastro ainda cobre só Santa Catarina. Quando um filtro
  *é* a causa, ele virou botão que resolve com um clique

- O README mandava criar o banco rodando duas migrations, e existem oito. Quem
  montasse o projeto do zero terminava com um esquema de julho — sem fotos, sem
  viagens concluídas, sem autonomia e sem piso de acesso. A lista agora está
  inteira e em ordem

- A **régua** por baixo de todo número: sólida quando foi medido, tracejada
  quando é conta (e aí o valor vem com `~` na frente), pontilhada quando ninguém
  sabe. É a faixa central da estrada, que já era a marca e já era o traçado da
  viagem no mapa — e agora diz de onde veio cada valor sem precisar de legenda.
  A distância de um lugar, que aparecia como `161 km` liso e se lia como
  quilometragem rodada, agora aparece como `~ 161` com o traço interrompido e
  "linha reta" escrito embaixo

- **Tema claro**, com cartografia própria. O botão de sol e lua fica na barra, ao
  lado do Sair, e a escolha sobrevive a fechar o navegador. O mapa muda junto —
  no claro a rodovia é a via mais **escura**, porque o que faz a estrada ser o
  conteúdo é a distância do fundo, não a claridade

- **"Antes de ir"** no painel do lugar: o que se sabe da subida, do frio, da
  neblina e da hora certa de sair, escrito para doze dos catorze lugares. É
  orientação, e a tela diz isso — sai da fonte de medição, entra na de texto e
  ganha o filete de citação, o mesmo do relato de uma visita. Nada de horário de
  funcionamento nem de estado da estrada: isso muda sem avisar, e dica velha faz
  rodar 200 km à toa
- **Fotos de todos os lugares**, e não só dos que têm coordenada. A busca por
  nome entrou ao lado da busca por proximidade porque, medido, dez dos catorze
  lugares do catálogo não tinham foto nenhuma — o litoral inteiro, incluindo a
  Lagoa da Conceição. As duas procedências ficam distinguíveis: a foto com
  coordenada mostra a distância, a achada pelo nome mostra o nome do arquivo,
  porque ela pode ser de outro ponto do município

### Corrigido

- Três controles ficavam abaixo do alvo mínimo de 44px no celular: o segmento
  Lista/Filtros entregava 36px, e o link de trocar o ponto de partida, 12px.
  Achado varrendo as dez rotas do produto em 390px de largura, não por leitura
  de código

- `docs/PROMPT-REDESIGN.md` — o briefing completo para refazer a direção visual
  do produto do zero: contexto, paleta atual token a token nas duas metades
  (interface e mapa), inventário de todos os 56 componentes, o sistema de
  movimento existente, e o registro do que já foi tentado e por quê. Nada disso
  muda a interface ainda

- A viagem avisa quando **tem chão no caminho**, nomeando as paradas. Só conta o
  que foi marcado: parada em branco não vira aviso, porque "não sei" não é
  "terra"
- **Piso do acesso** no painel do lugar: asfalto, terra, ou os dois. Nasce em
  branco e branco significa *"não sei"* — nunca asfalto. Tocar no piso já
  marcado desmarca, porque marcação errada precisa poder ser desfeita. Vale para
  lugar do catálogo também, já que é a sua observação e não um fato do lugar

- **Condição na estrada** na página da viagem: para hoje, amanhã e depois, o que
  esperar em cada parada entre 7h e 19h — temperatura, chance de chuva e, o que
  mais importa aqui, neblina. Uma linha diz qual ponto decide a viagem: *"Serra
  do Corvo Branco — 3 h de neblina a partir das 07:00"*. Vem de previsão, e a
  tela diz isso o tempo todo. Viagem já concluída não mostra previsão, que seria
  o clima de outro dia que não o vivido

- Migration `0007_access_surface.sql`, preparando o piso do acesso (asfalto,
  terra ou misto). **Ainda não faz nada na tela** e depende de ser rodada no SQL
  Editor. O piso fica guardado como observação de quem foi, e não como fato do
  lugar: estrada de terra vira asfalto, e um lugar do catálogo não pode ser
  editado por quem não o criou

- **O ano em revista**, no topo de Memórias: quantas viagens, quantos
  quilômetros, quantos lugares e quantas fotos ficaram do ano mais recente com
  registro, e qual foi o mês mais cheio. Só aparece o que aconteceu — um ano sem
  viagem não mostra "viagens 0", e o mês mais cheio só é eleito quando houve mais
  de um mês. Quando parte das viagens não tem distância gravada, a tela diz de
  quantas o número saiu, em vez de apresentar uma soma parcial como se fosse o
  total do ano

- Perfil de altimetria na viagem. O traçado passa a ser pedido com a altitude de
  cada ponto, e a página da viagem desenha o relevo dela: dá para ver, antes de
  sair, onde vem a planície e onde começa a serra. Abaixo do desenho, três
  leituras — o ponto mais baixo, o mais alto e o desnível entre os dois. Uma
  volta de 556 km pelo Corvo Branco e pelo Morro da Igreja sai do nível do mar e
  chega a 1.758 m. Viagens gravadas antes disso não têm altitude registrada e
  seguem sem a seção
- **Subida acumulada foi deliberadamente deixada de fora.** O número é comum em
  aplicativos de ciclismo, mas aqui ele seria invenção: o modelo de elevação
  tremelica alguns metros ponto a ponto, e somar essa tremida deu *449 m de
  subida* em 78 km de planície costeira entre Tubarão e Araranguá, onde a
  altitude nunca passa de 89 m. Altitude e desnível são leituras e ficam;
  acumulação não se sustenta e não entra

- Busca por nome na trilha do Explorar. Digitar acha por nome, por município ou
  por etiqueta — "curvas" traz a Serra do Rio do Rastro e a Serra Dona Francisca
  sem que você precise lembrar o nome de nenhuma das duas. Acento não faz
  diferença: "conceicao" acha a Lagoa da Conceição. O termo entra no endereço da
  página, então uma busca pode ser guardada nos favoritos do navegador ou
  compartilhada

- Spec de **Fotos** fechada, em
  `docs/superpowers/specs/2026-07-30-fotos-design.md`. Nada disso funciona ainda.
  A foto passará a pertencer ao lugar, com a viagem opcional — hoje o esquema
  exigia uma viagem para cada foto, o que deixaria de fora toda fotografia
  anterior ao app. Elas ficam em armazenamento privado, a data e a coordenada saem
  do próprio arquivo, e foto sem essa informação fica com a data **em branco** em
  vez de fingir que foi tirada no dia em que você a subiu
- Plano de implementação de Fotos em
  `docs/superpowers/plans/2026-07-30-fotos.md`, em nove etapas
- Legenda de fotografia aceita até 280 caracteres, e arquivo em formato que o
  navegador não sabe processar é recusado dizendo qual mandar
- Uma fotografia com informação de GPS se posiciona sozinha, e a data vem do dia
  em que ela foi tirada — não do dia em que você a subiu
- Fotografias são reduzidas no seu próprio aparelho antes de subir, o que cabe
  cerca de dez vezes mais delas no armazenamento sem diferença visível na tela
- A fotografia sobe do seu aparelho direto para o armazenamento, sem passar pelo
  servidor do aplicativo — o que remove o limite de tamanho que existiria no
  caminho
- A galeria de um lugar carrega todas as fotos com um único pedido de acesso, em
  vez de um por imagem
- Apagar uma fotografia remove o registro e o arquivo, nessa ordem — uma imagem
  quebrada na tela seria pior que um arquivo esquecido

- Spec de **Viagens** fechada, em
  `docs/superpowers/specs/2026-07-29-viagens-design.md`. Nada disso funciona
  ainda. O Rastro vai propor a volta escolhendo as paradas — usando o que só ele
  sabe: o que você marcou como quero-conhecer, o que ainda não visitou e há quanto
  tempo não volta — e deixa o caminho com o Google. Ao concluir a viagem você
  confirma quais paradas realmente aconteceram, e só essas viram visita
  registrada, para o mapa nunca afirmar que você esteve onde não esteve. A
  primeira versão cobre só o passeio de um dia, saindo e voltando da sua origem
- Plano de implementação de Viagens em `docs/superpowers/plans/2026-07-30-viagens.md`,
  em treze etapas, cada uma com teste antes do código e um commit próprio
- Ao propor um roteiro, o Rastro passa a saber o que te interessa: lugar que você
  marcou como quero-conhecer vem antes do que ainda não viu, que vem antes de onde
  já esteve — e voltar a um lugar que você não vê há dois anos vale mais que
  voltar ao de mês passado
- A ordem das paradas de um roteiro é calculada, não arrastada: o Rastro
  reorganiza o caminho para ele não cruzar consigo mesmo
- Quando um roteiro não cabe no tempo que você tem, o Rastro tira a parada menos
  interessante e recalcula, em vez de desistir. Entre duas igualmente
  interessantes, sai a mais longe. Se nem o destino que você escolheu cabe, ele
  diz isso — nunca devolve uma lista vazia sem explicação
- Um roteiro montado no Rastro abre no Google Maps com as paradas já na ordem,
  saindo e voltando da sua origem
- O traçado de um roteiro passa a seguir a estrada de verdade, com quilometragem e
  tempo medidos em vez de estimados. Sem a chave do serviço, ou se ele estiver
  fora do ar, a viagem continua funcionando com a estimativa — e a tela diz qual
  das duas você está vendo
- Lugar afastado da estrada não derruba mais o traçado da viagem inteira. Mirante,
  cachoeira e praia costumam ficar longe do asfalto, e o serviço de rotas recusava
  a rota toda quando uma parada passava de 350 metros de uma via
- Viagens passam a ser salvas de verdade, com as paradas na ordem e o traçado
- Pedir uma sugestão de roteiro não cria viagem nenhuma: só ao salvar ela passa a
  existir. Tentar cinco combinações não enche seu histórico de rascunho
- A tela de Viagens deixa de ser um aviso de "em breve" e passa a listar as suas
  viagens, com quilometragem e duração — e dizendo quando o número é estimativa
- **O Rastro propõe a volta inteira.** Você diz quanto tempo tem, que tipo de
  lugar quer ver, e opcionalmente o destino que já tem em mente — ele encadeia as
  paradas priorizando o que você marcou como quero-conhecer e o que ainda não viu
- A rota de uma viagem é desenhada no mapa como a própria marca do Rastro: asfalto
  âmbar com faixa central tracejada. É o único lugar em que o desenho da marca
  vira informação de verdade
- Abrir uma viagem reenquadra o mapa nela. Antes o mapa continuaria olhando para
  onde você estava
- **Ao concluir uma viagem você confirma quais paradas realmente aconteceram**, e
  só essas viram visita registrada — o pin muda de cor sozinho no mapa. O que você
  desmarcou continua sendo só roteiro, porque o mapa não deve afirmar que você
  esteve onde não esteve
- **Há três jeitos de montar uma viagem:** deixar o Rastro propor a volta inteira,
  dizer o destino que você já tem em mente e receber o resto como sugestão, ou
  escolher as paradas você mesmo a partir do painel de cada lugar. Na montagem à
  mão nada é descartado — quem escolhe não quer ver a escolha trocada. Em todos os
  três, a ordem é calculada

### Corrigido

- **Cada visita ganha "como foi?": uma nota de 1 a 5 e um relato.** O produto
  registrava *que* você esteve na serra; agora registra que ela estava fechada de
  neblina e que você voltou no mês seguinte. A nota vem com o nome do que
  significa — "muito boa", "daquelas que ficam" — porque um 4 solto não diz nada
  daqui a cinco anos. Não dar nota continua sendo uma resposta válida
- **A tela de Memórias deixa de ser um aviso e vira a sua linha do tempo.** Visitas
  registradas, viagens concluídas e fotografias aparecem juntas, agrupadas por mês,
  da mais recente para a mais antiga. A foto cai no mês em que foi **tirada** — não
  no dia em que você a subiu. Mês em que você não andou de moto não aparece: uma
  fileira de meses vazios seria um calendário de ausências, não uma memória
- **Fotografias suas num lugar.** Suba pelo painel do lugar e elas aparecem ali,
  privadas — só você acessa, por um link temporário. A que traz data no arquivo
  mostra a data em que foi tirada; a que não traz diz "sem data", em vez de fingir
  que foi hoje. **E o pin no mapa passa a marcar quais lugares têm fotografia**
- **Você pode informar a autonomia da sua moto, e o roteiro passa a avisar quando
  a volta não fecha num tanque** — dizendo quantas vezes e por volta de qual
  quilômetro abastecer. É um número só, o que a moto faz com um tanque, e ele
  guarda 15% de reserva: rodar até a última gota não é plano. Em branco, o Rastro
  não opina sobre combustível, porque chutar a autonomia da sua moto seria
  inventar dado sobre ela
- **Postos de combustível no mapa**, ao aproximar. Aparecem como anel discreto e
  ganham o nome mais perto ainda — posto é infraestrutura, não destino, e não deve
  disputar atenção com os lugares. Sai dos mesmos dados de mapa que já
  carregávamos: nenhum serviço novo
- **Clicar num pin passa a mostrar fotografias das redondezas**, vindas do
  Wikimedia Commons, com o autor, a licença e a **distância** de cada uma. Elas
  são apresentadas como o que são — tiradas perto dali, por outras pessoas — e não
  como fotos daquele lugar: medindo o catálogo, a Serra do Corvo Branco traz uma
  imagem da Pedra Furada do Morro da Igreja, a 2,2 km. Tocar na foto abre a página
  original, onde a licença pode ser conferida
- **Botões e alvos de toque no celular passam a ter 44px de altura**, o piso para
  dedo com luva. Medidos, seis alvos ficavam abaixo disso — inclusive a marca, que
  é o caminho de volta ao mapa. Restam só os créditos de licença do mapa, que não
  são nossos para mexer
- **Dá para definir o ponto de partida buscando o endereço**, em vez de só clicar
  no mapa. Escolher um resultado grava o nome e a coordenada **juntos**, e é isso
  que conserta um erro silencioso: antes o nome era texto livre e podia discordar
  do ponto. Este perfil dizia "Palhoça, SC" com o pino 82 km dali, no alto da
  serra — e como toda distância do Rastro parte da origem, o produto informava que
  o Morro da Cruz, que fica em Florianópolis, estava a 130 km de Palhoça. São 19
- **O roteiro proposto passa a mostrar a quilometragem e o tempo da estrada de
  verdade, na hora de escolher.** Antes ele media a estrada só depois de salvo:
  uma volta apresentada como 180 km e 3h16 virava 379 km e 6h53, e você só
  descobria com a viagem já criada — o produto errava exatamente no momento da
  decisão
- **E ele avisa quando a volta não cabe no tempo que você pediu**, somando o tempo
  parado em cada parada: "esta volta toma 8h29 — mais que as 6h00 que você pediu".
  Junto do aviso vem o conserto: **"tirar a parada mais distante"**, que é a que
  mais custa. Antes ele apontava o problema e deixava você adivinhar qual
  sacrificar
- Precisar abastecer deixou de ser tratado como alarme e virou nota de
  planejamento: numa volta de 435 km, parar no posto é o plano, não a falha
- **Dá para apagar uma viagem.** Antes era possível criar e não era possível
  desfazer. A confirmação diz o que some e, principalmente, o que **não** some: as
  visitas que aquela viagem registrou permanecem no mapa, porque elas são memória
  do que aconteceu, não propriedade do roteiro
- Botão, chip e mensagem de erro passam a fixar o próprio tamanho de texto em vez
  de herdá-lo. Eles já apareciam no tamanho certo, mas por coincidência — a classe
  que declarava isso não existia mais, e bastaria colocá-los dentro de um bloco de
  texto maior para encolherem ou crescerem sem ninguém pedir

### Removido

- O aviso de "Em breve: criar viagem" no painel do lugar, que agora é um botão que
  funciona

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
- O Rastro ganha marca própria: um R cuja perna é uma estrada terminando num
  destino. Ela aparece na barra superior, na tela de entrada, na aba do navegador
  e como ícone quando o app é salvo na tela inicial do celular — no lugar do
  ícone padrão do framework, que era o que estava lá
- A estrada da marca ganha faixa central tracejada, que é o que a faz ler como
  estrada e não como um segundo traço da letra
- Campos de formulário, mensagens de estado e cabeçalhos de seção viram peças do
  sistema em vez de serem remontados a cada tela — a mesma marcação estava colada
  à mão em onze lugares, e um deles esquecia a ligação entre rótulo e campo que
  leitores de tela precisam
- ADR 0009 registrando a nova direção visual e substituindo as decisões de
  paleta, raio e tipografia — inclusive o que foi deliberadamente preservado da
  versão anterior, e o que custou refazer o mapa junto
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

- **O produto deixa de ser marrom.** Ele tinha um matiz só: 65% da tela caía na
  mesma faixa de laranja, e não sobrava nenhuma área neutra para o olho
  descansar. O couro continua, mas agora mora onde se lê — texto e estrada
  seguem quentes, o chão fica quase neutro. Medido na tela: a faixa marrom cai
  de 65% para 30%
- **O mar passa a existir.** Estava tão escuro que lia como buraco preto, e o
  Atlântico aparece em qualquer vista do litoral catarinense. Era a maior massa
  fria disponível, e estava escondida
- **A mata fica verde.** Com o terreno em volta neutro, a floresta finalmente tem
  contra o que aparecer — e Santa Catarina é floresta
- **Os pins ficam mais fortes sem terem mudado de cor.** Âmbar, verde de visitado
  e vermelho de erro estão exatamente iguais; o que mudou foi passarem a ter
  fundo contra o qual contrastar
- **A marca foi reconstruída sobre grade de 100, com um peso de traço só.** A
  perna do R sai de dentro da barriga, desce com um único ponto de inflexão e
  pousa na mesma linha de base da haste — a curva agora lê como serra, e não como
  rabisco. O ponto de destino saiu: a estrada termina onde a letra termina
- **A marca engorda o traço conforme encolhe, e abaixo de 32px a faixa central da
  estrada some.** Reduzida proporcionalmente, a letra ficava fina demais para
  sobreviver ao antialiasing; e na marca de 24px da barra cada tracinho da faixa
  media menos de um pixel, o que não lia como estrada, só sujava o âmbar. Quem
  usa o componente não escolhe — ele decide pelo tamanho
- **"Novo lugar" passa a ser bloco de cor cheia, e é o único da tela.** Estava com
  contorno, o peso que o sistema reserva para ação secundária, e o mapa ficava sem
  nenhum ponto de entrada evidente
- Os destinos da navegação passam de pílula a retângulo arredondado. A pílula é a
  forma do que se aperta; o destino é um lugar onde se está
- **A palavra "Rastro" fica igual em todas as telas**: mais larga, mais pesada e
  com o espaçamento fechado. Estava com o espaçamento largo que o produto reserva
  a rótulo de instrumento, e a assinatura lia como legenda de painel
- Na tela de entrada, a marca e a palavra passam a ser separadas por um traço de
  1px, e a marca perde a placa — que era da cor do painel e não desenhava nada
- **O cromo que flutua sobre o mapa ganha uma sombra**, a única do produto. O
  traço de 1px que separava as peças desaparece sobre relevo escuro, e barra e
  mapa viravam a mesma mancha. É um vinco embaixo da peça, não um halo em volta:
  declara qual camada está por cima, não decora uma caixa
- **A navegação principal ganha ícones**, e os rótulos saem da caixa alta. Em
  caixa alta com espaçamento largo, os quatro destinos não cabiam na barra do
  celular — e gastavam no menu o vocabulário que o produto reserva para número
  medido. O ícone de Viagens é a curva da própria marca
- No celular o rótulo desce para baixo do ícone, e os quatro destinos passam a
  caber sem rolagem lateral. Antes, "Memórias" ficava fora da tela
- **O mapa passa a ocupar a tela inteira, e todo o resto flutua sobre ele.**
  Antes ele era o retângulo que sobrava entre as barras — o produto dizia que o
  mapa é a estrutura e desenhava ele como o buraco no meio do enquadramento.
  Agora a superfície é contínua e os painéis são o que são: temporários
- No celular a barra de navegação passa a ter duas linhas. Espremida numa linha
  só, ela cortava "Descobrir" no meio da palavra
- A navegação principal marca onde você está com um traço âmbar, e não só com a
  cor do texto — quem não distingue os dois tons continuava sem saber em que
  tela estava
- "Novo lugar" deixa de ser um item de navegação e vira ação com contorno, com
  uma hairline separando "Sair". As duas ficavam coladas e com o mesmo peso:
  errar o alvo custava a sessão
- "Para onde vamos?" passa a ser centralizado na área de mapa, e não na página.
  A trilha da esquerda empurrava o centro óptico e o botão ficava visivelmente
  torto em relação ao mapa que ele comanda
- O enquadramento inicial do mapa mostra mais continente e menos Atlântico. O
  oceano continua lá, mas deixa de ser o protagonista de um app sobre estradas
- A trilha da esquerda abre mostrando os **lugares**, não os filtros. Antes eles
  ocupavam mais espaço do que a coluna tinha: a seção "Situação" ficava cortada
  ao meio e seus quatro controles não apareciam na tela, e a lista sobrava com um
  terço do espaço mostrando 4 lugares de 14. Agora aparecem 13, e o recorte
  ativo fica descrito em palavras no topo — dá para saber o que está escondendo
  lugares sem abrir nada
- Os filtros abrem por cima quando você quer mexer, com o conjunto inteiro
  visível de uma vez e um botão que diz quantos lugares sobraram antes de fechar
- A tela de entrada passa a mostrar o mapa. Ela usa a mesma estrutura do
  aplicativo — mapa como superfície, painel ancorado por cima —, então o produto
  já se apresenta antes de você entrar, em vez de um formulário centralizado num
  vazio. O mapa ali não se arrasta nem se aproxima: ele diz o que o produto é e
  não disputa com o único botão da tela
- Os pins do mapa passam a crescer com o número de visitas. O mapa deixa de
  mostrar só onde os lugares estão e passa a mostrar onde a sua vida aconteceu
  mais
- O botão de fechar painel cresce para 44px de alvo mantendo o glifo pequeno: era
  o controle mais difícil de acertar da interface, e é a única saída do painel
- Os tamanhos de texto do produto passam a vir de uma escala nomeada, em vez de
  oito valores soltos escolhidos um de cada vez. O espaçamento ganha nomes pela
  mesma razão: dois painéis com respiros diferentes não eram duas decisões, eram
  nenhuma
- O mapa deixa de ser uma lavagem marrom só. A vegetação volta a ser verde —
  floresta marrom não lê como floresta — e o relevo perde a saturação laranja que
  dominava a tela inteira. Agora dá para distinguir a mata do litoral do planalto
  aberto, que é informação que estava se perdendo
- **Nova direção visual: couro e instrumento.** A superfície deixa de ser carvão
  frio e passa a couro queimado, o acento vira amarelo queimado, e a tipografia
  troca para Archivo com JetBrains Mono. O mapa foi refeito junto — ele desenha
  em WebGL e não acompanharia sozinho, e uma interface quente sobre um mapa frio
  brigaria a tela inteira
- O texto do produto ficou maior: piso de 17px no corpo e 12px nos rótulos de
  instrumento. O produto é lido parado no acostamento, com luva e sol na tela, e
  a auditoria já tinha flagrado o texto pequeno demais
- Alvos de toque maiores: botões de 48px, chips de 40px, caixas de seleção com
  44px de área. Alvo de luva não se acerta em 14px
- Mensagens de erro deixam de parecer legenda. Ganharam cor própria, moldura e um
  rótulo que diz o que aconteceu antes de dizer o quê
- Apagar um lugar deixa de usar o mesmo botão de uma ação comum: contorno
  vermelho em repouso, preenchimento só quando o cursor está em cima
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

- A data de uma visita gerada por viagem é o dia em que você viajou, no seu fuso —
  não o dia seguinte. Uma viagem encerrada às 23h30 em Brasília já é o dia seguinte
  em UTC, e converter errado registraria a memória na data errada

- **Os pins não apareciam no mapa.** A mudança que fez o pin crescer com o número
  de visitas montou a escala de tamanho de um jeito que a biblioteca de mapa
  rejeita, e ela descartava a camada inteira em silêncio — sem erro no console,
  sem falha no carregamento, e com todos os testes passando. O mapa ficou sem
  nenhum dos catorze pins até isto ser visto na tela
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
