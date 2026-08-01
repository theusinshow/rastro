import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PlaceCategory } from '@/domain/place'

/** O mínimo para apresentar um lugar a quem ainda não entrou. */
export interface ShowcasePlace {
  slug: string
  name: string
  municipality: string
  stateCode: string
  category: PlaceCategory
  description: string
  latitude: number
  longitude: number
  /** Foto de capa. `null` quando não há. */
  coverImageUrl: string | null
  /** Autor e licença andam JUNTOS com a URL: CC BY e CC BY-SA obrigam creditar. */
  coverImageAuthor: string | null
  coverImageLicense: string | null
  coverImageSource: string | null
}

/**
 * Os lugares públicos do catálogo, **sem exigir sessão**.
 *
 * Existe fora de `index.ts` de propósito: todos os repositórios de lá passam por
 * `sessionContext`, que lança sem usuário — e a tela de entrada, por definição,
 * não tem usuário. Um `getPlaceRepository()` ali quebraria a tela de login.
 *
 * **Isto não contorna a RLS.** A política `places_read` da migration 0001 é
 * `using (is_public or created_by = auth.uid())`: para uma requisição sem sessão
 * o segundo lado é falso, e o banco devolve exatamente o catálogo público. O
 * `.eq('is_public', true)` aqui é intenção declarada, não proteção — quem
 * protege continua sendo a política.
 *
 * Nunca lança: sem Supabase configurado ou com o banco fora, devolve `[]` e a
 * entrada mostra o mapa sem o passeio.
 */
export async function listShowcasePlaces(): Promise<ShowcasePlace[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('places')
      // Uma string literal única, e não concatenação: o `@supabase/supabase-js`
      // infere o tipo da linha a partir do LITERAL do select, e uma soma de
      // pedaços faz a inferência cair para um tipo de erro genérico.
      .select(
        'slug, name, municipality, state_code, category, description, latitude, longitude, cover_image_url, cover_image_author, cover_image_license, cover_image_source',
      )
      .eq('is_public', true)
      .order('name')

    if (error || !data) return []

    return data.map((row) => ({
      slug: String(row.slug),
      name: String(row.name),
      municipality: String(row.municipality ?? ''),
      stateCode: String(row.state_code ?? ''),
      category: row.category as PlaceCategory,
      description: String(row.description ?? ''),
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      coverImageUrl: (row.cover_image_url as string | null) ?? null,
      coverImageAuthor: (row.cover_image_author as string | null) ?? null,
      coverImageLicense: (row.cover_image_license as string | null) ?? null,
      coverImageSource: (row.cover_image_source as string | null) ?? null,
    }))
  } catch {
    return []
  }
}
