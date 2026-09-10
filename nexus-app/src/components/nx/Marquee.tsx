/**
 * Dải chữ chạy ngang vô tận. Nội dung được nhân đôi để vòng lặp không có
 * điểm nối, nên chuỗi truyền vào nên ngắn.
 */
export default function Marquee({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const strip = Array.from({ length: 8 }, (_, i) => (
    <span key={i} className="mx-6 shrink-0">
      {text}
    </span>
  ))

  return (
    <div className={`relative overflow-x-clip ${className}`} aria-hidden>
      <div className="flex w-max animate-nx-marquee whitespace-nowrap">
        {strip}
        {strip}
      </div>
    </div>
  )
}
