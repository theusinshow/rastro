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
