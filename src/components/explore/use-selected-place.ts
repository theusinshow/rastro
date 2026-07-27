'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export const SELECTED_PLACE_PARAM = 'place'

export function useSelectedPlace() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const slug = searchParams.get(SELECTED_PLACE_PARAM)

  const select = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) {
        params.set(SELECTED_PLACE_PARAM, next)
      } else {
        params.delete(SELECTED_PLACE_PARAM)
      }
      const query = params.toString()
      // `replace` e não `push`: selecionar pins não deve encher o histórico.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams],
  )

  return { slug, select }
}
