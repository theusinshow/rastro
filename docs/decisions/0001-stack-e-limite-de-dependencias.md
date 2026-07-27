# 0001 — Stack e limite de dependências

## Contexto

O Rastro parte de uma base vazia e precisa de uma fundação moderna e estável,
com deploy simples na Vercel, que não acumule dependências ao longo do
desenvolvimento. Cada dependência instalada é uma superfície a mais para
auditar, atualizar e depurar — em um projeto pessoal mantido por uma única
pessoa, isso pesa mais do que o tempo economizado ao adotar um pacote de
terceiros para um problema pequeno.

## Decisão

Adotamos:

- **Next.js (App Router)** como framework, com deploy na Vercel.
- **React** como biblioteca de UI.
- **TypeScript em modo `strict`**, sem `any` implícito.
- **Tailwind CSS v4 (CSS-first)** para estilos.
- **ESLint** para lint estático.
- **Vitest** para testes da camada de domínio (ambiente `node`, sem `jsdom`).

Versões reais instaladas pelo `create-next-app` e pelas instalações
subsequentes (`node -p "const p=require('./package.json');JSON.stringify({...p.dependencies,...p.devDependencies},null,2)"`):

```json
{
  "maplibre-gl": "^5.24.0",
  "next": "16.2.12",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.2.12",
  "tailwindcss": "^4",
  "typescript": "^5",
  "vitest": "^4.1.10"
}
```

## `maplibre-gl` na v5, não na v6

A v6 é a major mais recente, e mesmo assim ficamos na v5 deliberadamente.

A v6 deixou de embutir o worker no bundle: ela o resolve como arquivo ESM irmão
a partir de `import.meta.url`. O Turbopack não consegue servir isso — o módulo
vira um chunk hasheado, e mesmo forçando a emissão do worker como asset o seu
`import` relativo de `maplibre-gl-shared.mjs` não resolve a partir do diretório
de assets emitidos. Fazer a v6 funcionar exige copiar dois arquivos do
`node_modules` para o `public/` em cada instalação e apontar `setWorkerUrl` para
lá. Carregar uma etapa de build no primeiro commit da fundação, por causa de uma
major `.0` que o ecossistema de bundlers ainda não alcançou, é o trade errado:
o custo aparece em todo `npm install`, em todo deploy, e em toda leitura futura
do repositório.

A v5 instancia o worker a partir de uma Blob URL gerada do próprio bundle —
agnóstica de bundler, zero configuração. A API que usamos é idêntica nas duas:
`StyleSpecification`, as expressões de camada, `attributionControl`,
`touchZoomRotate.disableRotation()`.

**Ressalva:** o worker via Blob URL da v5 exige `worker-src blob:` sob uma CSP
estrita. Se o Rastro passar a servir uma CSP restritiva, a saída é o bundle
`maplibre-gl-csp-worker` que a própria v5 distribui para esse caso.

**O que nos faria mudar de ideia:** o Turbopack passar a emitir assets ESM
irmãos junto de seus chunks compartilhados, ou o maplibre voltar a embutir o
worker no bundle. Qualquer um dos dois torna a v6 uma atualização sem custo.

## Recusadas deliberadamente

- **`react-map-gl`** — custa uma dependência e um modelo mental adicional para
  economizar cerca de 80 linhas de hook, ao preço de perder controle fino
  sobre camadas e expressões do MapLibre.
- **Biblioteca de estado global** — filtros e seleção vivem na URL (ver
  ADR 0006).
- **Biblioteca de datas** — `Intl.DateTimeFormat` cobre a necessidade atual.

`shadcn/ui` é permitido pontualmente, apenas quando traz acessibilidade real
(primitivas Radix como popover, slider, tooltip), nunca como fonte da
estética.

## Consequências

Menos código de terceiros para auditar, em troca de mantermos integrações
próprias.
