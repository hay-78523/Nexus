'use client'

import { useState } from 'react'

/**
 * Ba loại ảnh tham chiếu theo mục 3 của bản mô tả chức năng. Chỉ ảnh nhân vật
 * là bắt buộc; hai loại còn lại chỉ được gửi đi khi máy chủ đã biết tên trường
 * tương ứng của model đang dùng.
 */
const SLOTS = [
  { key: 'character', label: 'Nhân vật', note: 'Bắt buộc' },
  { key: 'style', label: 'Phong cách', note: 'Tuỳ chọn' },
  { key: 'pose', label: 'Dáng / bố cục', note: 'Tuỳ chọn' },
] as const

type SlotKey = (typeof SLOTS)[number]['key']

/**
 * Một ô ảnh giữ một trong hai thứ: file người dùng vừa chọn, hoặc đường dẫn
 * một ảnh Fal.ai đã sinh ra ở lượt trước. Dạng thứ hai là cách nối tiếp cảnh:
 * ra được tấm ưng ý rồi thì lấy chính nó làm tham chiếu cho lượt sau.
 *
 * Dùng đường dẫn còn tránh được trần kích thước của Vercel, vì ảnh không phải
 * đi kèm trong yêu cầu — Fal.ai tự đi lấy.
 */
type SlotValue =
  | { kind: 'file'; file: File; preview: string }
  | { kind: 'url'; url: string; preview: string }

type Slots = Record<SlotKey, SlotValue | null>

const EMPTY_SLOTS: Slots = { character: null, style: null, pose: null }

/** Đọc một file thành chuỗi base64 để gửi kèm trong thân yêu cầu. */
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AIGenerator({
  models,
  defaultModel,
  demo = false,
}: {
  models: string[]
  defaultModel: string
  demo?: boolean
}) {
  const [prompt, setPrompt] = useState('')
  const [slots, setSlots] = useState<Slots>(EMPTY_SLOTS)
  const [model, setModel] = useState(defaultModel)
  const [numImages, setNumImages] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const setSlot = (key: SlotKey, value: SlotValue | null) => {
    setSlots((prev) => {
      // Chỉ thu hồi đường dẫn xem trước do chính mình tạo ra từ file; đường dẫn
      // https của Fal.ai không phải của mình, thu hồi là lỗi.
      const old = prev[key]
      if (old?.kind === 'file') URL.revokeObjectURL(old.preview)
      return { ...prev, [key]: value }
    })
  }

  const pickFile = (key: SlotKey, file: File | null) =>
    setSlot(key, file ? { kind: 'file', file, preview: URL.createObjectURL(file) } : null)

  /** Lấy một ảnh vừa sinh ra làm tham chiếu cho lượt kế tiếp. */
  const continueFrom = (url: string, key: SlotKey) => {
    setSlot(key, { kind: 'url', url, preview: url })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleGenerate = async () => {
    if (!prompt || !slots.character) {
      setError('Cần ảnh nhân vật và mô tả trước khi chạy.')
      return
    }

    setError(null)
    setIsGenerating(true)
    setResults([])

    try {
      const images: Record<string, string> = {}
      for (const { key } of SLOTS) {
        const slot = slots[key]
        if (!slot) continue
        images[key] = slot.kind === 'file' ? await toBase64(slot.file) : slot.url
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, images, model, numImages }),
      })

      const data = await response.json()
      if (!response.ok) {
        // Máy chủ đính kèm nguyên văn phản hồi của Fal.ai và tên các trường
        // đang dùng. Hiện hết ra, vì đó là chỗ nói rõ sai ở đâu.
        const parts = [data.error || 'Không sinh được ảnh']
        if (data.fieldsUsed) {
          parts.push(
            `Đang gọi: ${data.fieldsUsed.model}\n` +
              `Trường nhân vật: ${data.fieldsUsed.nhanVat}\n` +
              `Trường phong cách: ${data.fieldsUsed.phongCach}\n` +
              `Trường dáng: ${data.fieldsUsed.dang}\n` +
              `Trường số lượng: ${data.fieldsUsed.soLuong}`
          )
        }
        if (typeof data.falResponse === 'string') parts.push(data.falResponse)
        throw new Error(parts.join('\n\n'))
      }

      setResults(Array.isArray(data.imageUrls) ? data.imageUrls : [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không sinh được ảnh')
    } finally {
      setIsGenerating(false)
    }
  }

  const ready = Boolean(slots.character && prompt)

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* ---------- CỘT NHẬP ---------- */}
      <div className="flex flex-col gap-8 bg-ink-panel p-6 md:p-8">
        <Field index="01" label="Ảnh tham chiếu" note="Giữ nhân vật">
          <div className="grid grid-cols-3 gap-3">
            {SLOTS.map(({ key, label, note }) => (
              <ImageSlot
                key={key}
                label={label}
                note={note}
                value={slots[key]}
                onPick={(file) => pickFile(key, file)}
              />
            ))}
          </div>
        </Field>

        <Field index="02" label="Mô tả" note="Cảnh">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-28 w-full resize-none border border-white/15 bg-black p-4 font-mono text-sm text-white transition-colors placeholder:text-white/25 focus:border-acid focus:outline-none"
            placeholder="Chân dung điện ảnh, ánh sáng neon xanh chanh, nền tối, độ nét cao"
          />
        </Field>

        <Field index="03" label="Thiết lập" note="Model & số lượng">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              aria-label="Chọn model"
              className="min-w-0 flex-1 border border-white/15 bg-black px-3 py-2.5 font-mono text-xs text-white focus:border-acid focus:outline-none"
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 border border-white/15 bg-black px-3 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Số ảnh
              </span>
              <input
                type="number"
                min={1}
                max={10}
                value={numImages}
                onChange={(e) => setNumImages(Number(e.target.value) || 1)}
                className="w-14 bg-transparent font-mono text-sm text-white focus:outline-none"
              />
            </label>
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-white/30">
            Mỗi ảnh là một lần tính tiền. Ô phong cách và dáng chỉ được gửi đi khi máy chủ
            đã biết tên trường tương ứng của model này.
          </p>
        </Field>

        {error && (
          <p
            role="alert"
            className="max-h-56 overflow-y-auto border-l-2 border-red-500 bg-red-500/10 px-4 py-3 font-mono text-xs whitespace-pre-wrap break-words text-red-300"
          >
            {error}
          </p>
        )}

        {demo && (
          <p className="border-l-2 border-amber-400 bg-amber-400/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-amber-200">
            <b>Chế độ thử.</b> Ảnh do một dịch vụ miễn phí sinh ra từ mô tả, không tốn
            tiền. Nó <b>không nhìn ba ảnh tham chiếu</b>, nên đừng đánh giá chuyện giữ
            khuôn mặt qua đây — chỉ để xem luồng chạy có thông không.
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !ready}
          className="group relative h-14 w-full overflow-hidden border border-acid bg-acid font-black uppercase tracking-[0.2em] text-black transition-all hover:tracking-[0.3em] disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-transparent disabled:tracking-[0.2em] disabled:text-white/30"
        >
          {isGenerating ? 'Đang dựng ảnh…' : 'Chạy AI'}
        </button>
      </div>

      {/* ---------- CỘT KẾT QUẢ ---------- */}
      <div className="flex flex-col bg-ink-panel">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            04 / Kết quả
          </span>
          <span
            className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] ${
              isGenerating ? 'text-acid' : 'text-white/40'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isGenerating ? 'animate-pulse bg-acid' : 'bg-white/30'
              }`}
            />
            {isGenerating ? 'Đang chạy' : results.length ? `${results.length} ảnh` : 'Chờ lệnh'}
          </span>
        </div>

        <div className="relative flex min-h-[380px] flex-1 items-center justify-center overflow-hidden bg-black">
          {isGenerating ? (
            <>
              <div className="absolute inset-0 nx-scanline" />
              <div className="absolute inset-x-0 top-0 h-24 animate-nx-sweep bg-gradient-to-b from-transparent via-acid/15 to-transparent" />
              <p className="relative font-mono text-[10px] uppercase tracking-[0.35em] text-acid">
                Đang xử lý
              </p>
            </>
          ) : results.length > 0 ? (
            <div className="grid h-full w-full grid-cols-1 gap-px self-stretch overflow-y-auto bg-white/10 sm:grid-cols-2">
              {results.map((url, i) => (
                <ResultTile
                  key={url}
                  url={url}
                  index={i + 1}
                  onContinue={(key) => continueFrom(url, key)}
                  demo={demo}
                />
              ))}
            </div>
          ) : (
            <div className="px-8 text-center">
              <p className="text-6xl font-black uppercase leading-[0.85] tracking-[-0.04em] nx-outline-text md:text-8xl">
                Nexus
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
                Chưa có tác vụ nào
              </p>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <p className="border-t border-white/10 px-6 py-3 font-mono text-[10px] leading-relaxed text-white/30 md:px-8">
            Ảnh chưa được lưu ở đâu cả. Tải về trước khi đóng tab, nếu không là mất.
          </p>
        )}
      </div>
    </div>
  )
}

/** Một ô ảnh tham chiếu. */
function ImageSlot({
  label,
  note,
  value,
  onPick,
}: {
  label: string
  note: string
  value: SlotValue | null
  onPick: (file: File | null) => void
}) {
  const preview = value?.preview ?? null
  return (
    <div className="flex flex-col gap-2">
      <div className="group relative aspect-square w-full overflow-hidden border border-dashed border-white/20 bg-black transition-colors hover:border-acid/60">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          aria-label={`Chọn ảnh ${label}`}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={`Ảnh ${label}`} className="h-full w-full object-cover" />
            {value?.kind === 'url' && (
              <span className="absolute left-1 top-1 z-20 bg-acid px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-black">
                Nối tiếp
              </span>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-3xl font-thin leading-none text-white/25 transition-colors group-hover:text-acid">
              +
            </span>
          </div>
        )}
      </div>
      {/* Xếp dọc chứ không dàn ngang: ở bề rộng một phần ba cột, nhãn và ghi
          chú nằm cạnh nhau sẽ xuống dòng rồi xô vào ô bên cạnh. */}
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
          {label}
        </span>
        <span className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">
          {note}
        </span>
      </div>
    </div>
  )
}

/** Một ảnh kết quả, kèm nút tải về. */
function ResultTile({
  url,
  index,
  onContinue,
  demo,
}: {
  url: string
  index: number
  onContinue: (key: SlotKey) => void
  demo: boolean
}) {
  const [saving, setSaving] = useState(false)

  const download = async () => {
    setSaving(true)
    try {
      // Thuộc tính download của thẻ a bị bỏ qua với ảnh khác tên miền, nên
      // phải tự tải nội dung về rồi mới lưu được đúng tên file.
      const blob = await fetch(url).then((r) => r.blob())
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `nexus-${String(index).padStart(3, '0')}.png`
      a.click()
      URL.revokeObjectURL(href)
    } catch {
      // Máy chủ ảnh chặn tải chéo tên miền thì mở ra tab mới để lưu tay.
      window.open(url, '_blank', 'noopener')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="group relative aspect-square bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Ảnh ${index}`} className="h-full w-full object-contain" />
      <div className="absolute inset-x-2 bottom-2 flex flex-wrap justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {/* Nối tiếp cảnh: đưa chính tấm này vào ô tham chiếu cho lượt sau. Gửi
            đi dưới dạng đường dẫn nên không đụng trần kích thước. */}
        <button
          onClick={() => onContinue('character')}
          className="border border-acid bg-black/80 px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-acid transition-colors hover:bg-acid hover:text-black"
        >
          Nối tiếp
        </button>
        <button
          onClick={() => onContinue('style')}
          className="border border-white/30 bg-black/80 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white/70 transition-colors hover:border-white hover:text-white"
        >
          Làm style
        </button>
        <button
          onClick={download}
          disabled={saving}
          className="bg-acid px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-black disabled:opacity-50"
        >
          {saving ? '…' : 'Tải về'}
        </button>
      </div>
      <span className="absolute left-2 top-2 bg-black/70 px-2 py-1 font-mono text-[10px] text-white/70">
        {String(index).padStart(2, '0')}
      </span>
      {demo && (
        <span className="absolute right-2 top-2 bg-amber-400 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-black">
          Thử
        </span>
      )}
    </div>
  )
}

function Field({
  index,
  label,
  note,
  children,
}: {
  index: string
  label: string
  note: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] tracking-[0.3em] text-acid">{index}</span>
        <span className="text-sm font-black uppercase tracking-[0.1em] text-white">{label}</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
          {note}
        </span>
      </div>
      {children}
    </div>
  )
}
