'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Hiện dần từ dưới lên khi khối lọt vào khung nhìn.
 *
 * Dùng IntersectionObserver cộng transition CSS thay vì thư viện chuyển
 * động chạy trên requestAnimationFrame: transition do trình duyệt tự chạy
 * ở tầng compositor, nên vẫn mượt khi cảnh 3D đang ăn hết luồng chính.
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const show = () => el.classList.add('is-visible')

    // Trình duyệt không hỗ trợ thì hiện luôn, đừng để nội dung ẩn mất
    if (typeof IntersectionObserver === 'undefined') {
      show()
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show()
            io.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -60px 0px' }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal
      className={`nx-reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}
