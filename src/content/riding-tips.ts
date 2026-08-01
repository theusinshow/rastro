/**
 * Dicas de quem anda de moto, por lugar.
 *
 * ============================ LEIA ANTES DE EDITAR ============================
 *
 * Isto é **orientação**, e o produto diz isso na tela: sai da mono, entra na
 * sans e recebe o filete de citação — o mesmo tratamento do relato de uma
 * visita. É a quinta origem da régua do ADR 0016, a que **não tem régua**,
 * porque não foi medida.
 *
 * O que PODE entrar aqui:
 *   - Padrão estável de clima e de luz: "a serra costuma amanhecer fechada no
 *     inverno", "a descida pega sol de frente no fim da tarde".
 *   - Geografia que não muda: altitude, quantas curvas, para onde a estrada
 *     aponta, o que se vê de onde.
 *   - Conselho de quem pilota: o que vestir, quando sair, onde parar.
 *
 * O que NUNCA entra:
 *   - Horário de funcionamento, preço, telefone, se está aberto. Muda sem
 *     avisar, e uma dica desatualizada faz alguém rodar 200 km à toa.
 *   - Estado atual da estrada — buraco, obra, se está asfaltado. Para isso
 *     existe o **piso do acesso**, que é declaração de quem foi, com data.
 *   - Qualquer número que pareça medição. Medição tem régua e mora em `Stat`.
 *
 * Lugar sem dica é o estado normal, e não uma lacuna a preencher: a seção
 * simplesmente não aparece. Escrever qualquer coisa para não deixar em branco é
 * exatamente o defeito que este arquivo existe para evitar.
 */
export interface RidingTip {
  /** Uma frase. Se precisa de duas, provavelmente são duas dicas. */
  text: string
}

/**
 * Chaveado pelo `slug` do lugar.
 *
 * Fica em `src/content/` e não em `src/mocks/`: `mocks` é dado de
 * desenvolvimento, que não deve chegar ao usuário. Isto chega.
 */
export const RIDING_TIPS: Record<string, RidingTip[]> = {
  'serra-do-rio-do-rastro': [
    {
      text: 'A serra costuma amanhecer dentro da nuvem no inverno, e limpar no meio da manhã. Subir cedo é apostar; subir depois das dez, apostar menos.',
    },
    {
      text: 'O mirante fica no alto da subida, e é de lá que se vê o desenho inteiro das curvas — quem sobe olhando para a frente passa por ele sem ver o que subiu.',
    },
    {
      text: 'Lá em cima venta e faz muito mais frio que embaixo, mesmo num dia bom no litoral. A diferença é de casaco, não de manga comprida.',
    },
  ],
  'morro-da-igreja': [
    {
      text: 'É o ponto habitado mais alto do sul do Brasil, e o frio lá em cima não se parece com o do vale: geada em manhã de inverno é comum.',
    },
    {
      text: 'O acesso passa por área de parque nacional e tem controle de entrada — vale confirmar as regras do dia antes de subir, porque elas mudam.',
    },
    {
      text: 'A Pedra Furada é o que a maioria vem ver, e ela desaparece por completo quando a nuvem baixa. Sem visibilidade, não há o que fazer além de descer.',
    },
  ],
  'serra-do-corvo-branco': [
    {
      text: 'O corte na rocha no ponto mais alto é o retrato da estrada — paredões dos dois lados, e espaço curto. Não é lugar de parar no meio da pista.',
    },
    {
      text: 'É a mais isolada das três serras da região: menos movimento, menos posto, menos sinal. Suba com o tanque resolvido.',
    },
  ],
  urubici: [
    {
      text: 'Serve de base para quase tudo em volta — Morro da Igreja, Avencal, Corvo Branco. Quem tenta fazer os três num dia só costuma cortar o último.',
    },
    {
      text: 'No inverno as manhãs são de geada e as tardes abrem. Vale inverter o roteiro: cidade de manhã, altitude depois do almoço.',
    },
  ],
  'cascata-do-avencal': [
    {
      text: 'A queda é alta e o mirante fica de frente para ela — dá para ver de cima sem descer, o que ajuda quando se está de bota de moto.',
    },
    {
      text: 'Fica perto de Urubici e é o mais fácil de encaixar num dia que já tem serra.',
    },
  ],
  'guarda-do-embau': [
    {
      text: 'A vila fica de um lado do rio e a praia do outro — a travessia é de barco, e não dá para chegar de moto na areia.',
    },
    {
      text: 'É a praia mais perto de Palhoça que ainda parece afastada, o que faz dela a volta curta de fim de tarde.',
    },
  ],
  'praia-da-pinheira': [
    {
      text: 'A estrada de acesso corre em cima do costão e entrega a vista antes da praia — o trecho vale mais que o destino.',
    },
  ],
  garopaba: [
    {
      text: 'O centro é pequeno e o estacionamento no verão é disputado; fora da temporada, a mesma rua fica vazia.',
    },
  ],
  'praia-do-rosa': [
    {
      text: 'Os acessos descem morro e alguns terminam em chão batido. De moto de rua, vale parar em cima e descer a pé.',
    },
    {
      text: 'Entre junho e novembro é rota de baleia-franca, e os mirantes do costão valem a parada.',
    },
  ],
  'lagoa-da-conceicao': [
    {
      text: 'A via em volta da lagoa é estreita e cheia de travessia de pedestre — é passeio, não é trecho de andar.',
    },
    {
      text: 'No fim da tarde o sol bate na água do lado da Avenida das Rendeiras, e é a melhor hora para parar.',
    },
  ],
  'morro-da-cruz': [
    {
      text: 'É o mirante mais alto da cidade e mostra a ilha inteira de uma vez — ideal para começar o dia e entender onde tudo fica.',
    },
    {
      text: 'A subida é curta e urbana, com curvas fechadas e trânsito local.',
    },
  ],
  'serra-dona-francisca': [
    {
      text: 'Liga o litoral ao planalto por dentro da mata atlântica, e é uma das descidas mais fechadas de curva do estado.',
    },
    {
      text: 'A umidade da mata mantém o asfalto molhado em trecho de sombra mesmo depois de a chuva passar.',
    },
  ],
}

/** Dicas de um lugar. Lista vazia é o estado normal, e a seção não aparece. */
export function tipsFor(slug: string): RidingTip[] {
  return RIDING_TIPS[slug] ?? []
}
