# Changelog

Todas as alterações relevantes deste projeto são registradas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o
projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> **Regra primordial do repositório:** todo commit exige uma entrada
> correspondente aqui. Ver `CLAUDE.md`.

---

## [Não lançado]

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
