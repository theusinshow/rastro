import { tipsFor } from '@/content/riding-tips'
import { SectionHeader } from '@/components/ui/Section'

/**
 * O que se sabe do lugar, dito por quem anda de moto.
 *
 * É a quinta origem da régua do ADR 0016 — a que **não tem régua**. Sai da mono,
 * entra na sans e recebe o filete de citação, exatamente como o relato de uma
 * visita: o que está aqui foi dito, não medido. Dar régua a isto seria emprestar
 * a uma orientação a autoridade de um instrumento.
 *
 * Lugar sem dica não mostra a seção. Um cabeçalho seguido de nada seria uma
 * promessa não cumprida em cada um dos lugares que ainda não têm texto.
 */
export function PlaceTips({ slug }: { slug: string }) {
  const tips = tipsFor(slug)
  if (tips.length === 0) return null

  return (
    <section className="border-b border-line px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <SectionHeader label="Antes de ir" />
        {/* Dito uma vez, sempre visível, como "previsão" na condição da estrada:
            é o que separa este bloco dos números medidos logo acima. */}
        <span className="instrument-label text-ink-faint">orientação</span>
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {tips.map((tip) => (
          <li key={tip.text} className="type-note">
            {tip.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
