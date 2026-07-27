# 0003 — Estado pessoal separado do catálogo

## Contexto

O rascunho inicial do produto tratava `Place` como uma entidade única, contendo
ao mesmo tempo fato objetivo (nome, coordenadas, categoria) e opinião pessoal
(favorito, visitado, nota). Nesse rascunho, ainda se propunha uma entidade
`Favorite` separada, dedicada apenas a marcar quais lugares o usuário havia
favoritado.

Essa modelagem mistura dois conceitos de naturezas diferentes sob o mesmo teto:

- Um **fato**, compartilhável entre qualquer pessoa que olhe para aquele lugar
  — nome, coordenadas, categoria, município.
- Uma **opinião**, pessoal e intransferível — se eu favoritei, se quero
  conhecer, o que penso do lugar.

Ao construir o schema multiusuário desde o primeiro dia (ver princípio geral do
projeto), essa mistura se torna insustentável: cada linha de `places` passaria
a carregar colunas que só fazem sentido para um usuário por vez, ou o catálogo
deixaria de ser compartilhável.

## Decisão

Separar em três conceitos distintos, cada um em sua própria tabela:

1. **`places`** — o catálogo. Fato objetivo, compartilhável entre usuários.
   Não contém nada de opinião ou de estado pessoal.
2. **`place_user_states`** — o vínculo usuário ↔ lugar. Guarda a opinião atual
   e duradoura: `is_favorite`, `wants_to_visit`, `personal_notes`, `rating`
   (a opinião geral sobre o lugar, não sobre uma visita específica).
3. **`place_visits`** — o evento datado. Cada linha é uma visita real, com sua
   própria data, nota e observações.

**Não existe tabela `Favorite`.** Favorito é um atributo booleano do vínculo
usuário↔lugar (`place_user_states.is_favorite`), não uma entidade própria. Uma
tabela dedicada de duas colunas (`user_id`, `place_id`) só adicionaria mais um
JOIN ao caminho mais quente da aplicação — o desenho do mapa no Explore — sem
ganhar nada em troca, já que o vínculo usuário↔lugar já precisa existir para
guardar `wants_to_visit` e `rating`.

## Consequências

- **"Visitado" deixa de ser booleano.** Passa a significar *existe ao menos uma
  linha em `place_visits` para este usuário e este lugar*. Não há coluna
  `is_visited` em lugar nenhum do schema.
- É possível visitar o mesmo lugar várias vezes, cada visita com sua própria
  data, nota e observações — o que o modelo anterior, com um único booleano,
  não permitia representar.
- `place_user_states.visit_count`, `first_visited_at` e `last_visited_at` são
  **cache derivado**, mantido por um trigger (`refresh_place_user_state`,
  disparado sobre `place_visits`). A verdade sobre visitas permanece,
  inteiramente, na tabela de eventos. O cache existe só por desempenho de
  leitura — o mapa do Explore não pode fazer `count()`/`min()`/`max()` sobre
  `place_visits` para cada pin renderizado.
- O custo dessa decisão é duplo: (1) um trigger a mais para manter e entender,
  e (2) a disciplina de nunca escrever diretamente nas colunas derivadas de
  `place_user_states` — toda alteração de visita deve passar por
  `place_visits`, nunca por um `update` direto nas colunas de cache.
- Três colunas `rating` distintas coexistem no schema (`place_visits.rating`,
  `place_user_states.rating`, `trips.rating`), cada uma medindo uma coisa
  diferente. Ver `docs/DATA-MODEL.md` para a tabela comparativa.
