/**
 * Nhãn đầu mục: số thứ tự cỡ lớn đứng cạnh tiêu đề, kiểu bảng chỉ dẫn kỹ thuật.
 */
export default function SectionLabel({
  index,
  title,
  note,
}: {
  index: string
  title: string
  note?: string
}) {
  return (
    <div className="flex items-baseline gap-4 border-b border-white/10 pb-4">
      <span className="font-mono text-[11px] tracking-[0.3em] text-acid">{index}</span>
      <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white md:text-3xl">
        {title}
      </h2>
      {note && (
        <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 md:block">
          {note}
        </span>
      )}
    </div>
  )
}
