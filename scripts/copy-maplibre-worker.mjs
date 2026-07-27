/**
 * Copia o worker do maplibre-gl para `public/maplibre/`.
 *
 * O maplibre-gl 6 não embute mais o worker no bundle: ele resolve
 * `maplibre-gl-worker.mjs` como um arquivo irmão a partir de `import.meta.url`.
 * Sob o Turbopack esse caminho não existe — o módulo vira um chunk hasheado — e
 * o worker falha ao carregar, deixando o mapa preto sem erro visível no
 * console da página (o erro acontece dentro do worker).
 *
 * Servimos os dois arquivos do `public/` com os nomes originais, porque o
 * worker importa `./maplibre-gl-shared.mjs` por caminho relativo, e apontamos o
 * maplibre para lá com `setWorkerUrl`. São artefatos de build: ficam fora do
 * versionamento e são recopiados a cada `npm install`, `npm run dev` e
 * `npm run build`.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'node_modules', 'maplibre-gl', 'dist')
const to = join(root, 'public', 'maplibre')

await mkdir(to, { recursive: true })
for (const file of FILES) {
  await copyFile(join(from, file), join(to, file))
}
