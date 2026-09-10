'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Hiện dần từ dưới lên khi khối lọt vào khung nhìn. `delay` dùng để xếp
 * so le nhiều khối cạnh nhau.
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
  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
