import { expect, test, type Page } from '@playwright/test'

/**
 * O teste de fumaça do Rastro.
 *
 * **Cada caso aqui nasceu de um defeito real, não de imaginação.** Os três
 * primeiros estiveram em produção, nenhum deu erro, e todos passavam por lint,
 * typecheck e a suíte inteira do Vitest. Foram encontrados um a um, à mão, num
 * navegador — e é essa passada manual que este arquivo automatiza.
 *
 * O que ele **não** é: uma suíte de interface. Não confere texto, não confere
 * espaçamento, não confere cor. Confere as coisas que só existem quando o
 * produto está de pé e que nenhum teste de função pura alcança.
 */

/** O mapa vive em WebGL: sem esta porta, nada aqui pode ser perguntado. */
const AJUDA_GANCHO =
  'O gancho de teste do mapa não existe. Acrescente ' +
  'NEXT_PUBLIC_RASTRO_E2E=1 ao .env.local e reinicie o `npm run dev`.'

interface EstadoDoMapa {
  pitch: number
  bearing: number
  zoom: number
  camadasDoCatalogo: number
  fonteDoCatalogo: boolean
}

async function lerMapa(page: Page): Promise<EstadoDoMapa> {
  return page.evaluate(() => {
    const map = (window as unknown as { __rastroMap?: unknown }).__rastroMap as
      | {
          getPitch(): number
          getBearing(): number
          getZoom(): number
          getStyle(): { layers: { id: string }[] }
          getSource(id: string): unknown
        }
      | undefined
    if (!map) throw new Error('__rastroMap ausente')

    return {
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      zoom: map.getZoom(),
      camadasDoCatalogo: map
        .getStyle()
        .layers.filter((l) => l.id.startsWith('places-')).length,
      fonteDoCatalogo: !!map.getSource('places'),
    }
  })
}

/** Entra pela porta de desenvolvimento e para o passeio da câmera. */
async function entrarNoMapa(page: Page) {
  await page.goto('/entrar-dev')
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  // Uma tecla é um gesto: encerra o passeio, que é o que o produto promete.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1200)
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (erro) => {
    throw new Error(`erro de JavaScript na página: ${erro.message}`)
  })
})

test('o gancho de teste do mapa está disponível', async ({ page }) => {
  await entrarNoMapa(page)
  const existe = await page.evaluate(
    () => '__rastroMap' in (window as object),
  )
  expect(existe, AJUDA_GANCHO).toBe(true)
})

/*
 * DEFEITO 1 — a camada das telas cobria a viewport inteira capturando o
 * ponteiro. A roda não dava zoom em lugar nenhum do mapa, o arrasto não movia,
 * e cada peça de interface em volta parecia culpada.
 */
test('a roda do mouse dá zoom sobre o mapa', async ({ page }) => {
  await entrarNoMapa(page)
  const antes = (await lerMapa(page)).zoom

  await page.mouse.move(900, 450)
  await page.mouse.wheel(0, -400)
  await page.waitForTimeout(900)

  expect(
    (await lerMapa(page)).zoom,
    'a roda não chegou ao mapa — alguma camada está capturando o ponteiro',
  ).toBeGreaterThan(antes)
})

test('o ponteiro alcança o canvas no meio da área de mapa', async ({ page }) => {
  await entrarNoMapa(page)

  const alvo = await page.evaluate(() => {
    const el = document.elementFromPoint(900, 450)
    return el ? el.tagName + '.' + String(el.className) : null
  })

  expect(alvo, 'o ponto central do mapa não é o canvas').toContain(
    'maplibregl-canvas',
  )
})

test('clicar no vazio do mapa fecha o painel do lugar', async ({ page }) => {
  await page.goto('/entrar-dev')
  await page.goto('/?place=garopaba')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  const painel = page.locator("aside[data-side='right']")
  await expect(painel).toHaveCount(1)

  await page.mouse.click(800, 500)
  await page.waitForTimeout(1200)

  await expect(
    painel,
    'o clique no mapa não chegou ao MapLibre',
  ).toHaveCount(0)
})

/*
 * DEFEITO 2 — trocar de tema chama `setStyle`, que derruba todas as camadas
 * nossas. A escuta que devia recolocá-las tinha uma guarda que rejeitava
 * justamente os eventos que importavam, e os pins sumiam de vez.
 */
test('trocar de tema preserva as camadas do mapa', async ({ page }) => {
  await entrarNoMapa(page)
  const antes = await lerMapa(page)
  expect(antes.camadasDoCatalogo).toBeGreaterThan(0)

  await page.getByRole('button', { name: /Mudar para o tema/ }).click()
  await page.waitForTimeout(6000)

  const depois = await lerMapa(page)
  expect(
    depois.fonteDoCatalogo,
    'a fonte dos lugares não voltou depois do setStyle',
  ).toBe(true)
  expect(
    depois.camadasDoCatalogo,
    'as camadas dos lugares não voltaram depois do setStyle',
  ).toBe(antes.camadasDoCatalogo)
})

/*
 * DEFEITO 3 — o passeio da tela de entrada deixa a câmera inclinada em 55° com
 * relevo 3D, e esse enquadramento atravessava para dentro do aplicativo. A
 * rotação está desligada de propósito, então não havia gesto capaz de
 * endireitar o mapa.
 */
test('a câmera entra plana depois da tela de entrada', async ({ page }) => {
  await page.goto('/entrar')
  await page.waitForLoadState('networkidle')
  // Deixa o passeio inclinar de verdade antes de entrar.
  await page.waitForTimeout(6000)

  const naEntrada = await lerMapa(page)
  expect(
    naEntrada.pitch,
    'o passeio da entrada não inclinou — sem isso este teste não prova nada',
  ).toBeGreaterThan(10)

  /*
   * Entra pelo BOTÃO, e não por `goto`. As duas coisas aqui são deliberadas, e
   * cada uma foi aprendida vendo este teste passar quando não devia:
   *
   * 1. `page.goto` é carga completa de documento: destrói o mapa e cria outro,
   *    que nasce plano por construção. O defeito desaparece sozinho, e o teste
   *    vira enfeite. O botão dispara uma ação de servidor com redirecionamento,
   *    que o Next resolve **preservando a árvore** — e é isso que mantém a
   *    mesma instância de mapa viva da entrada até o app (ADR 0018). Só nesse
   *    caminho a câmera inclinada atravessa.
   *
   * 2. Entrar sem conta cai na tela de ORIGEM, que não monta passeio nenhum.
   *    No Explorar, o passeio usa a câmera de instrumento — que já voa com
   *    `pitch: 0` — e endireitaria o mapa sozinho, mascarando a ausência do
   *    bilhete de chegada. Foi exatamente assim que a primeira versão deste
   *    caso passou com o defeito reintroduzido de propósito.
   *
   * Sem passeio na tela de destino, quem endireita a câmera é o `MapChrome` — e
   * ele só age se o bilhete tiver sido emitido.
   */
  await page.getByRole('button', { name: 'Entrar sem conta' }).click()
  await page.waitForURL('**/perfil/origem', { timeout: 30_000 })
  await page.waitForTimeout(4500)

  const noApp = await lerMapa(page)
  expect(noApp.pitch, 'o mapa entrou inclinado').toBeLessThan(1)
  expect(Math.abs(noApp.bearing), 'o mapa entrou girado').toBeLessThan(1)
})

test('a capa do lugar carrega de verdade', async ({ page }) => {
  await page.goto('/entrar-dev')
  await page.goto('/?place=urupema')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3500)

  const carregou = await page.evaluate(() => {
    const img = document.querySelector<HTMLImageElement>(
      "aside[data-side='right'] img",
    )
    return img ? img.naturalWidth > 0 : null
  })

  expect(carregou, 'o painel do lugar não tem foto de capa').toBe(true)
})
