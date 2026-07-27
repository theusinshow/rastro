# Briefings de skills

Os arquivos desta pasta **não são documentação de produto**. São
**briefings de contexto**: o texto que se cola junto de um pedido ao invocar
uma skill de design, para que a resposta seja sobre o Rastro — o mapa como
memória visual da vida do motociclista, o âmbar de instrumento, os hairlines
— e não conselho genérico de dashboard SaaS.

Sem esse contexto, uma skill de design não tem como saber que este produto
proíbe sombra difusa, ou que o mapa nunca pode virar um widget dentro de um
card, ou que "Não visitado" e "favorito" são dois bits independentes, não um
único estado. Ela vai sugerir o que sugeriria para qualquer produto: mais
cards, mais sombra, mais arredondamento. O briefing existe para evitar
exatamente isso.

## Quando usar cada uma

| Situação | Skill | Briefing |
|---|---|---|
| Revisar ou elevar uma tela existente, hierarquia, densidade, microinterações | `/impeccable` | `docs/skills/impeccable.md` |
| Criar uma tela ou componente novo, definir direção estética | `/frontend-design` | `docs/skills/frontend-design.md` |
| Auditar acessibilidade, foco, contraste, semântica | `/web-design-guidelines` | `docs/skills/web-design-guidelines.md` |

## Como usar

Antes de invocar a skill correspondente, cole o conteúdo inteiro do briefing
junto com o pedido — ou peça explicitamente que a skill leia o arquivo antes
de responder (`Leia docs/skills/impeccable.md antes de revisar esta tela`).
Uma resposta que sugira qualquer anti-padrão listado nos briefings — cards
demais, sombra difusa, glassmorphism decorativo — é sinal de que o briefing
não foi lido, não de que o produto mudou de direção.
