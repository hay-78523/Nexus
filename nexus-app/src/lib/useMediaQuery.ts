'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Theo dõi một media query. Phía máy chủ luôn trả về false, nên component
 * phải viết sao cho nhánh false là phương án an toàn.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    [query]
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
