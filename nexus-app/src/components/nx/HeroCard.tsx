'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import ThreeDPosterWebGL from '@/components/ThreeDPosterWebGL'
import LiquidSphere from '@/components/nx/LiquidSphere'
import { hasWebGL, subscribeNever } from '@/lib/webgl'
import { useMediaQuery } from '@/lib/useMediaQuery'

/**
 * Thẻ tối bo góc chứa cảnh 3D, chiếm gần trọn khung nhìn đầu trang.
 * Cuộn xuống thì thẻ thu nhỏ và lùi dần ra sau.
 */
export default function HeroCard() {
  const ref = useRef<HTMLDivElement>(null)
  // Phía máy chủ luôn coi như không có WebGL, nên ảnh tĩnh là thứ hiện ra
  // đầu tiên; nếu máy dựng được 3D thì cảnh thật thay vào sau khi hydrate.
  const webgl = useSyncExternalStore(subscribeNever, hasWebGL, () => false)

  // Model nặng gần 12MB, không đáng tải về qua mạng di động chỉ để làm nền.
  // Muốn bật 3D cho cả điện thoại thì bỏ điều kiện này đi.
  const wideEnough = useMediaQuery('(min-width: 768px)')
  const show3D = webgl && wideEnough

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0

    const update = () => {
      frame = 0
      const height = el.offsetHeight || 1
      // 0 khi thẻ vừa chạm mép trên, 1 khi đã cuộn qua hết chiều cao thẻ
      const progress = Math.min(Math.max(-el.getBoundingClientRect().top / height, 0), 1)

      el.style.transform = `scale(${1 - progress * 0.08})`
      el.style.opacity = String(1 - progress * 0.65)
      el.style.borderRadius = `${28 + progress * 28}px`
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={ref}
      className="relative h-[calc(100vh-190px)] min-h-[440px] w-full origin-top overflow-hidden rounded-[28px] bg-black will-change-transform"
    >
      {/* Khối cầu vân chất lỏng làm nền, sinh bằng shader nên vân cuộn thật */}
      <LiquidSphere />
      {show3D ? (
        <ThreeDPosterWebGL />
      ) : (
        // Không dựng được 3D thì dùng ảnh tĩnh, đừng để trống một mảng đen
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/poster.jpg"
          alt="Nhân vật 3D của Nexus"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      )}

      {/* Nhãn góc, đặt trên cảnh 3D */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-6 md:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
          01 // Nexus Engine
        </p>
        <p className="hidden max-w-[240px] text-right text-[11px] leading-relaxed text-white/40 md:block">
          Giữ nguyên khuôn mặt và phong cách qua hàng trăm khung hình.
        </p>
      </div>
    </div>
  )
}
