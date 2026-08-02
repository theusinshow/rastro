# Como adicionar um lugar ao catálogo

O que precisa ser coletado para um lugar entrar em `supabase/seeds/`, e o que
**não** deve ser coletado porque o produto calcula, ou porque não cabe no
catálogo.

Campos e regras vêm de `supabase/migrations/0001_initial_schema.sql`,
`src/domain/place.ts` e `src/domain/slug.ts`. Se algo aqui divergir deles, eles
estão certos.

---

## Obrigatório

Sem qualquer um destes, o lugar não entra.

| Campo | Regra | Exemplo |
|---|---|---|
| **Nome** | 1 a 120 caracteres. A forma corrente, não a do cadastro oficial | `Morro do Queimado` |
| **Latitude** | −90 a 90. Ponto do LUGAR, não do município | `-27.7176` |
| **Longitude** | −180 a 180. Idem | `-48.7799` |
| **Categoria** | Uma das dez abaixo, exatamente | `mirante` |
| **Município** | Nome do município | `Santo Amaro da Imperatriz` |
| **UF** | Sigla | `SC` |

### As dez categorias

Só estas. Não invente uma décima primeira — ela não existe no tipo do banco e o
`insert` é recusado.

`serra` · `praia` · `mirante` · `natureza` · `cachoeira` · `estrada` ·
`cidade` · `cafe` · `restaurante` · `ponto_turistico`

Rótulos na interface: Serra, Praia, Mirante, Natureza, Cachoeira, Estrada,
Cidade, Café, Restaurante, Ponto turístico.

---

## A coordenada é a parte que dá errado

**Não aceite o primeiro resultado do geocodificador.** Pedir "Morro do
Queimado, Santo Amaro da Imperatriz" ao MapTiler devolve o *bairro* de mesmo
nome, no sopé — 1,4 km e 400 m de altitude longe do mirante. O nome bate, o
município bate, e o pino fica no lugar errado sem que nada acuse.

Três defesas, e vale usar as três:

1. **Prefira o ponto do acidente geográfico ou do ponto turístico**, não o
   centroide de bairro ou município. No OpenStreetMap isso é `natural=peak`,
   `tourism=attraction`, `tourism=viewpoint`, `waterway=waterfall`.
2. **Cruze com a altitude.** `https://api.open-meteo.com/v1/elevation?latitude=<lat>&longitude=<lon>`
   devolve a elevação do modelo. Um mirante que dá a mesma altitude do centro da
   cidade não é o mirante.
3. **Duas fontes independentes** apontando para perto do mesmo ponto.

Registre **de onde veio a coordenada** e **como foi conferida**. Isso vai escrito
no cabeçalho do seed, e é o que separa este catálogo de uma lista chutada.

---

## Importante, mas não bloqueia

| Campo | Regra |
|---|---|
| **Descrição** | **Uma frase.** O que o lugar É |
| **Tags** | 2 a 3, minúsculas, com acento. Ex.: `parapente`, `vista`, `cânions` |

### O que a descrição não pode dizer

- **Nada de condição de estrada.** "Estrada em boas condições" envelhece na
  primeira chuva. Que o acesso é de chão é a natureza do lugar e pode entrar;
  o estado dele, não.
- **Nada de horário, preço ou telefone.** Mudam, e o produto não é guia.
- **Nada de número que outra fonte contradiga.** O Morro do Queimado tem três
  altitudes publicadas — 580, 606 e 694 m. Nenhuma entrou.
- **Nada copiado.** Texto nosso, escrito a partir de leitura.

---

## Opcional — a capa

| Campo | Quando |
|---|---|
| **URL da foto** | Endereço estável e público. CDN de terceiro quebra sem avisar |
| **Autor** | **Obrigatório se a foto não for sua** |
| **Licença** | Nome curto, ex.: `CC BY-SA 4.0`. Obrigatória se houver autor |
| **Página de origem** | Onde a licença pode ser conferida |

Foto própria deixa os três nulos — a
[migration 0009](../supabase/migrations/0009_credito_da_foto_de_capa.sql) define
nulo como "não há crédito a exibir", nunca "crédito desconhecido".

Sem capa também serve: `scripts/fotos-de-capa.mjs` busca uma no Wikimedia
Commons com autor e licença. **Mas ele reescreve a capa de todo mundo** — se o
lugar tiver capa própria, ele a sobrescreve.

---

## NÃO colete

**O produto calcula, e coletar seria criar uma segunda verdade:**

- Distância e tempo até o lugar — dependem da origem de quem consulta
- Altitude — sai da coordenada, e aparece com régua
- Clima e previsão — Open-Meteo, em tempo de leitura
- Postos de combustível — Geoapify, em tempo de leitura

**Eu gero:** `slug` (do nome, por `slugify`), `id`, `source`, `created_by`,
`is_public`, `country_code`.

**Não cabe no catálogo, mesmo sendo o que mais importa numa moto:** a superfície
e a condição do acesso. `access_surface` vive em `place_user_states`
([migration 0007](../supabase/migrations/0007_access_surface.sql)) porque é
leitura de quem foi, não fato compartilhável. Se a pesquisa levantar isso, me
mande à parte — é informação boa, só não é do catálogo.

---

## Formato de saída

Um objeto por lugar. É isto que eu transformo em seed sem retrabalho.

```json
{
  "nome": "Morro do Queimado",
  "latitude": -27.7176,
  "longitude": -48.7799,
  "categoria": "mirante",
  "municipio": "Santo Amaro da Imperatriz",
  "uf": "SC",
  "descricao": "Rampa de parapente e mirante sobre a Grande Florianópolis, no alto do Parque Estadual da Serra do Tabuleiro, alcançado por estrada de chão.",
  "tags": ["parapente", "vista", "serra do tabuleiro"],
  "coordenada_veio_de": "OpenStreetMap, nó natural=peak, CEP 88140-000",
  "coordenada_conferida_com": "Open-Meteo dá 606 m no ponto; o bairro homônimo dá 200 m",
  "fontes": [
    "https://visitefloripa.com.br/o-que-ver/mirante-do-morro-do-queimado/",
    "https://guia4ventos.com.br/santo-amaro-da-imperatriz-rampa-do-morro-do-queimado-sc/"
  ],
  "capa": null,
  "acesso_observado": "estrada de chão, ~11 km da cidade; trecho final com sulcos depois de chuva"
}
```

`capa`, quando houver:

```json
"capa": {
  "url": "https://…",
  "autor": "Nome de quem fez, ou null se for sua",
  "licenca": "CC BY-SA 4.0, ou null se for sua",
  "pagina": "https://…"
}
```

---

## Duplicata

Antes de coletar, confira se já existe: o catálogo tem 21 lugares, e o `insert`
é `on conflict (slug) do nothing` — um lugar repetido não quebra nada, mas
também não entra, e você perde o trabalho.

```sql
select slug, name, municipality from places order by name;
```
