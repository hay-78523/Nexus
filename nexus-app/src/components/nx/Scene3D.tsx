'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { hasWebGL } from '@/lib/webgl'

/**
 * Nạp cảnh 3D sau khi trang đã dựng xong. Model nặng gần 12MB nên không
 * để nó chặn nội dung chính; máy yếu hoặc người dùng bật giảm chuyển động
 * thì bỏ qua hẳn.
 */
const ThreeDPosterWebGL = dynamic(() => import('@/components/ThreeDPosterWebGL'), {
  ssr: false,
})

export default function Scene3D({ className = '' }: { className?: string }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Bỏ qua trên màn hình hẹp: tốn pin mà gần như không thấy gì
    if (window.matchMedia('(max-width: 1024px)').matches) return
    if (!hasWebGL()) return

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 800))
    const id = idle(() => setEnabled(true))
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id as number)
      else window.clearTimeout(id as number)
    }
  }, [])

  if (!enabled) return null

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_92%)] ${className}`}
      aria-hidden
    >
      <ThreeDPosterWebGL variant="backdrop" />
    </div>
  )
}
