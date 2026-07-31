'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/Field'

interface PlaceSearchProps {
  /** O termo que está na URL — sempre já aparado. */
  value: string
  onCommit: (term: string) => void
}

/**
 * Campo de busca da trilha. Fica fora do painel "Filtrar" de propósito: filtrar
 * é um momento, mas procurar um lugar pelo nome é o caminho mais curto até ele —
 * e um caminho que some atrás de um botão não é curto.
 *
 * Escreve na URL com atraso, e guarda em `enviado` o que já mandou. Sem esse
 * registro, a volta do `router.replace` (que não é instantânea) chegaria com um
 * termo mais velho do que o que está sendo digitado e apagaria as teclas do
 * meio. Com ele, o campo só acompanha a URL quando ela muda **por fora**:
 * "Limpar", o botão de voltar, um link compartilhado.
 */
export function PlaceSearch({ value, onCommit }: PlaceSearchProps) {
  const [term, setTerm] = useState(value)
  const enviado = useRef(value)

  // `onCommit` nasce de novo a cada render do pai, e o pai renderiza a cada
  // passada do mouse sobre a lista. Como dependência do efeito, isso zeraria o
  // temporizador antes dos 300 ms e a busca nunca sairia.
  const commitRef = useRef(onCommit)
  useEffect(() => {
    commitRef.current = onCommit
  }, [onCommit])

  useEffect(() => {
    if (value === enviado.current) return
    enviado.current = value
    setTerm(value)
  }, [value])

  useEffect(() => {
    // Comparado já aparado: digitar o espaço entre "bom" e "jardim" não pode
    // disparar uma navegação, nem ver esse espaço ser comido de volta.
    const limpo = term.trim()
    if (limpo === enviado.current) return

    // Uma navegação por tecla encheria o histórico e refiltraria o mapa a cada
    // letra. 300 ms é a pausa entre palavras, não entre teclas.
    const id = setTimeout(() => {
      enviado.current = limpo
      commitRef.current(limpo)
    }, 300)
    return () => clearTimeout(id)
  }, [term])

  return (
    <Input
      type="search"
      value={term}
      onChange={(event) => setTerm(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setTerm('')
      }}
      aria-label="Buscar lugar por nome, cidade ou etiqueta"
      placeholder="Buscar lugar"
      // O `type="search"` vale pelo teclado do celular e pelo Esc nativo, mas o
      // navegador desenha junto um "✕" próprio — glifo sem função declarada,
      // fora da única exceção de ícone do ADR 0011. Quem limpa é o "Limpar".
      className="h-10 px-3 [&::-webkit-search-cancel-button]:appearance-none"
      autoComplete="off"
      spellCheck={false}
    />
  )
}
