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
- Mapa MapLibre em tela cheia com estilo escuro autoral sobre tiles do MapTiler,
  com relevo sombreado das serras e ênfase na malha viária
- Instância de mapa persistente no layout, preservando posição e zoom ao navegar
  entre as áreas do aplicativo
- Área "Para onde vamos?" com tempo disponível, distância máxima, categorias e
  filtros de não visitados e favoritos
- Resultados de descoberta ordenados por distância e recortados no mapa,
  considerando o tempo de ida e volta e reservando margem para paradas
- Estado de fallback explícito quando a chave do MapTiler não está configurada
- Coordenadas e zoom ao vivo na barra de status
- ADR 0002 registrando o mapa persistente no layout
- Documentação da estratégia de mapa em `docs/MAP-STRATEGY.md`
- Estado de erro explícito quando o mapa falha ao carregar, com a mensagem
  técnica visível, no lugar de uma tela preta silenciosa
- Pins de lugares no mapa com três canais visuais independentes: cor do miolo
  para o status de visita, anel externo para favorito e ponto satélite para
  lugares com fotos
- Seleção de lugar por clique no pin, refletida na URL e preservada ao recarregar
- ADR 0005 registrando os pins como camadas data-driven
- Painel lateral do lugar, aberto ao selecionar um pin, com categoria,
  localização, distância e tempo estimados, status de visita, fotografias,
  descrição e etiquetas
- Ação "Abrir rota", que delega a navegação a um aplicativo de rotas externo
- Formatação de datas de visita no vocabulário de diário de viagem
- Trilha de filtros por categoria, raio, situação de visita e favoritos
- Estado de filtros e seleção mantido na URL, tornando qualquer recorte do mapa
  compartilhável e reproduzível
- Contagem de lugares visíveis na barra de status
- ADR 0006 registrando a URL como fonte do estado de exploração
- Documentação de arquitetura, roadmap e contribuição
- Briefings de contexto do projeto para as skills de design, evitando respostas
  genéricas ao trabalhar na interface

### Alterado

- `maplibre-gl` fixado na v5: a v6 exige copiar o worker para `public/` a cada
  instalação para funcionar sob o Turbopack, e a v5 dispensa qualquer
  configuração
- ADR 0001 revisado com a versão do `maplibre-gl`, o motivo de ficarmos na v5 e
  o que nos faria migrar para a v6

### Removido

- Etapa de build que copiava o worker do `maplibre-gl` para `public/maplibre/`,
  desnecessária na v5
