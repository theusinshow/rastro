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
  "maplibre-gl": "^6.0.0",
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
