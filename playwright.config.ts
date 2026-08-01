import { defineConfig } from '@playwright/test'

/**
 * O teste de fumaça — a rede que faltava.
 *
 * Não substitui o Vitest e não disputa com ele: aquele prova funções puras, e é
 * onde vivem 443 casos. Este abre o produto num navegador de verdade e pergunta
 * as coisas que só o navegador sabe responder — se a roda do mouse chega ao
 * mapa, se as camadas sobrevivem a uma troca de tema, se a câmera entra plana.
 *
 * Roda **à mão**, e não em integração contínua: depende de Supabase, de chave de
 * mapa e de uma sessão. Ver ADR 0022.
 */
export default defineConfig({
  testDir: './e2e',

  // Um mapa, um servidor de desenvolvimento, um usuário. Paralelismo aqui só
  // produziria disputa por WebGL e resultados que dependem da ordem.
  workers: 1,
  fullyParallel: false,

  /*
   * Sem repetição automática.
   *
   * Um teste de fumaça que passa na terceira tentativa está dizendo que o
   * produto falha um terço das vezes, e `retries` transformaria essa informação
   * em silêncio. Se um caso for instável, o instável é o caso — ou o produto.
   */
  retries: 0,

  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    // Só do que falhou: captura de tela e traço viram o anexo que explica.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/entrar',
    // Reaproveita o servidor que já estiver de pé: o Next recusa uma segunda
    // instância no mesmo diretório, e subir outra aqui derrubaria a sessão de
    // quem está desenvolvendo.
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
