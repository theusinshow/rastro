# Rastro

O Google Maps responde *"como chego lá?"*. O Rastro responde *"para onde eu
vou?"*.

Rastro é um app pessoal para planejar e registrar viagens de moto em Santa
Catarina — o mapa como memória visual da vida do motociclista, não apenas
como rota.

## Executando localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> Sem a chave do MapTiler em `NEXT_PUBLIC_MAPTILER_KEY`, a aplicação sobe
> normalmente e mostra um aviso explícito no lugar do mapa, em vez de falhar
> em silêncio.

## Comandos

| Comando            | O que faz                                   |
| ------------------ | -------------------------------------------- |
| `npm run dev`       | Sobe o servidor de desenvolvimento           |
| `npm run lint`      | Roda o ESLint (`--max-warnings=0`)           |
| `npm run typecheck` | Verifica os tipos com `tsc --noEmit`         |
| `npm test`          | Roda os testes com Vitest                    |

## Documentação

- [`CLAUDE.md`](./CLAUDE.md) — instruções operacionais para agentes
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — arquitetura do projeto
- [`docs/DATA-MODEL.md`](./docs/DATA-MODEL.md) — modelo de dados
- [`docs/MAP-STRATEGY.md`](./docs/MAP-STRATEGY.md) — estratégia de mapa
- [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) — direção visual e sistema de design
- [`docs/decisions/`](./docs/decisions/) — decisões arquiteturais (ADRs)
- [`docs/skills/`](./docs/skills/) — briefings para invocar skills de design com o contexto do Rastro

## Dados mockados

Tudo em `src/mocks/` é dado de desenvolvimento **não verificado**. Coordenadas,
distâncias e avaliações não devem ser tratadas como informação real.
