# AGENTS.md — Rastro

As instruções completas deste repositório estão em **[`CLAUDE.md`](./CLAUDE.md)**.
Leia esse arquivo antes de escrever qualquer linha. Este aqui é uma placa de
sinalização para agentes que só procuram por `AGENTS.md`, não uma segunda cópia
das regras.

## ⚠️ Regra primordial — CHANGELOG

Uma regra é importante demais para ficar a uma indireção de distância:

**Todo commit exige uma entrada correspondente em `CHANGELOG.md`**, sob
`## [Não lançado]`, nas categorias em PT-BR do
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) (`Adicionado`,
`Alterado`, `Corrigido`, `Removido`, `Descontinuado`, `Segurança`).

Não existe exceção para "mudança pequena", "só um ajuste", "só documentação" ou
"só um typo". Commitar sem tocar no `CHANGELOG.md` é trabalho incompleto.

## O que está em `CLAUDE.md`

- Definição de concluído (`npm run lint`, `npm run typecheck`, changelog, sem
  `any`/`@ts-ignore`/`console.log` novos)
- Regra de camadas por leitura de imports — e a proibição de lógica de negócio
  em componente visual
- Limite deliberado de dependências
- Direção visual não negociável (raio máximo 2px, hairlines, sem sombra difusa)
- Como tratar decisões arquiteturais registradas em `docs/decisions/`
- O princípio de produto que resolve dúvidas de escopo

Documentação de apoio em `docs/`: `ARCHITECTURE.md`, `DESIGN-SYSTEM.md`,
`DATA-MODEL.md`, `MAP-STRATEGY.md`, `ROADMAP.md` e os ADRs.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
