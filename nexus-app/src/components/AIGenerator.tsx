'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Ba loại ảnh tham chiếu theo mục 3 của bản mô tả chức năng.
 *
 * Cả ba đều tuỳ chọn. Phần lớn cảnh được tả hoàn toàn bằng chữ; ảnh chỉ dùng
 * khi cần khoá một nhân vật đã dựng ở lượt trước cho giống nhau qua các cảnh.
 *
 * Ô phong cách và dáng chỉ thực sự được gửi đi khi máy chủ đã biết tên trường
 * tương ứng của model đang dùng, hoặc khi bật chế độ gộp mảng.
 */
const SLOTS = [
  { key: 'character', label: 'Nhân vật', note: 'Tuỳ chọn' },
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

/**
 * Trần kích thước cho các ảnh nhúng thẳng vào yêu cầu. Phải khớp với
 * MAX_TOTAL_CHARS ở máy chủ, và tồn tại ở đây để báo lỗi bằng tiếng Việt tử tế
 * trước khi Vercel kịp cắt yêu cầu bằng một dòng chữ thuần.
 */
const MAX_EMBEDDED_CHARS = 4_000_000

/** Số cảnh chạy trong một lần bấm "Chạy thử". */
const SO_CANH_CHAY_THU = 3

/** Một cảnh trong danh sách, kèm trạng thái riêng để chạy lại được từng cái. */
type Canh = {
  /** Dòng chữ người dùng gõ, cũng là tên cảnh. */
  moTa: string
  trangThai: 'cho' | 'dangChay' | 'xong' | 'loi'
  anh: string[]
  loi?: string
}

/** Đọc một file thành chuỗi base64 để gửi kèm trong thân yêu cầu. */
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Tách ô danh sách thành từng cảnh, bỏ dòng trống. */
function tachCanh(text: string): string[] {
  return text
    .split('\n')
    .map((d) => d.trim())
    .filter(Boolean)
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
  const [danhSachCanh, setDanhSachCanh] = useState('')
  const [slots, setSlots] = useState<Slots>(EMPTY_SLOTS)
  const [model, setModel] = useState(defaultModel)
  const [numImages, setNumImages] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [canhs, setCanhs] = useState<Canh[]>([])
  const [error, setError] = useState<string | null>(null)

  // Hai ô chữ đều tự cao theo nội dung. Prompt cho phong cách này thường dài
  // bốn năm trăm ký tự; nhốt trong ô cố định thì phải cuộn trong lúc gõ.
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const canhRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    for (const el of [promptRef.current, canhRef.current]) {
      if (!el) continue
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 460)}px`
    }
  }, [prompt, danhSachCanh])

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

  /** Dựng phần ảnh tham chiếu gửi kèm, dùng chung cho mọi cảnh trong một lượt. */
  const dungAnhThamChieu = async () => {
    const images: Record<string, string> = {}
    for (const { key } of SLOTS) {
      const slot = slots[key]
      if (!slot) continue
      images[key] = slot.kind === 'file' ? await toBase64(slot.file) : slot.url
    }

    // Chặn ảnh quá lớn NGAY Ở ĐÂY, trước khi gửi đi. Vercel cắt yêu cầu lớn
    // hơn khoảng 4,5MB ngay tại cổng vào, trước cả khi mã của mình chạy, và nó
    // trả về một dòng chữ thuần chứ không phải JSON — nên lớp kiểm tra ở máy
    // chủ không bao giờ có cơ hội báo lỗi cho tử tế.
    const embeddedChars = Object.values(images)
      .filter((v) => v.startsWith('data:'))
      .reduce((sum, v) => sum + v.length, 0)
    if (embeddedChars > MAX_EMBEDDED_CHARS) {
      const mb = (embeddedChars / 1_400_000).toFixed(1)
      throw new Error(
        `Ảnh quá lớn (khoảng ${mb}MB). Tổng các ảnh tải lên phải dưới 3MB.\n\n` +
          'Thu nhỏ ảnh rồi thử lại. Ảnh lấy từ nút Nối tiếp thì không tính vào ' +
          'giới hạn này, vì nó gửi đi dưới dạng đường dẫn.'
      )
    }
    return images
  }

  /** Gọi máy chủ cho đúng một cảnh. Ném lỗi để nơi gọi quyết định xử lý. */
  const chayMotCanh = async (moTaDayDu: string, images: Record<string, string>) => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: moTaDayDu, images, model, numImages }),
    })

    // Đọc dạng chữ trước rồi mới phân tích. Khi hạ tầng chặn yêu cầu, nó trả về
    // chữ thuần; gọi thẳng response.json() sẽ ném ra lỗi cú pháp khó hiểu che
    // mất nguyên nhân thật.
    const raw = await response.text()
    let data: Record<string, unknown>
    try {
      data = JSON.parse(raw)
    } catch {
      throw new Error(
        response.status === 413
          ? 'Ảnh quá lớn, máy chủ từ chối nhận. Thu nhỏ ảnh rồi thử lại.'
          : `Máy chủ trả về phản hồi không đọc được (HTTP ${response.status}).\n\n${raw.slice(0, 500)}`
      )
    }

    if (!response.ok) {
      // Máy chủ đính kèm nguyên văn phản hồi của Fal.ai và tên các trường đang
      // dùng. Hiện hết ra, vì đó là chỗ nói rõ sai ở đâu.
      const parts = [String(data.error || 'Không sinh được ảnh')]
      const f = data.fieldsUsed as Record<string, string> | undefined
      if (f) {
        parts.push(
          `Đang gọi: ${f.model}\n` +
            `Trường nhân vật: ${f.nhanVat}\n` +
            `Trường phong cách: ${f.phongCach}\n` +
            `Trường dáng: ${f.dang}\n` +
            `Trường số lượng: ${f.soLuong}`
        )
      }
      if (typeof data.falResponse === 'string') parts.push(data.falResponse)
      throw new Error(parts.join('\n\n'))
    }

    return Array.isArray(data.imageUrls) ? (data.imageUrls as string[]) : []
  }

  /**
   * Chạy một loạt cảnh, lần lượt từng cái.
   *
   * Chạy tuần tự chứ không song song là có chủ ý: mỗi cảnh là tiền thật, nên
   * hỏng ở cảnh thứ ba thì dừng được ngay thay vì đã bắn đi cả trăm yêu cầu.
   * Một cảnh lỗi không làm hỏng cả lượt — nó tự mang trạng thái lỗi và các cảnh
   * sau vẫn chạy.
   */
  const chayDanhSach = async (dsCanh: string[]) => {
    setError(null)
    setIsGenerating(true)
    setCanhs(dsCanh.map((moTa) => ({ moTa, trangThai: 'cho', anh: [] })))

    try {
      const images = await dungAnhThamChieu()

      for (let i = 0; i < dsCanh.length; i++) {
        setCanhs((prev) => prev.map((c, j) => (j === i ? { ...c, trangThai: 'dangChay' } : c)))
        try {
          // Mô tả gốc đứng trước, mô tả cảnh nối vào sau. Nhờ vậy phần phong
          // cách và nhân vật chỉ phải viết một lần cho cả danh sách.
          const dayDu = [prompt.trim(), dsCanh[i]].filter(Boolean).join(', ')
          const anh = await chayMotCanh(dayDu, images)
          setCanhs((prev) => prev.map((c, j) => (j === i ? { ...c, trangThai: 'xong', anh } : c)))
        } catch (err: unknown) {
          const loi = err instanceof Error ? err.message : 'Không sinh được ảnh'
          setCanhs((prev) => prev.map((c, j) => (j === i ? { ...c, trangThai: 'loi', loi } : c)))
        }
      }
    } catch (err: unknown) {
      // Lỗi ở khâu dựng ảnh tham chiếu thì chưa cảnh nào chạy được.
      setError(err instanceof Error ? err.message : 'Không sinh được ảnh')
      setCanhs([])
    } finally {
      setIsGenerating(false)
    }
  }

  /** Chạy lại đúng một cảnh đã lỗi, không đụng tới các cảnh khác. */
  const chayLaiMotCanh = async (i: number) => {
    setIsGenerating(true)
    setCanhs((prev) => prev.map((c, j) => (j === i ? { ...c, trangThai: 'dangChay' } : c)))
    try {
      const images = await dungAnhThamChieu()
      const dayDu = [prompt.trim(), canhs[i].moTa].filter(Boolean).join(', ')
      const anh = await chayMotCanh(dayDu, images)
      setCanhs((prev) =>
        prev.map((c, j) => (j === i ? { ...c, trangThai: 'xong', anh, loi: undefined } : c))
      )
    } catch (err: unknown) {
      const loi = err instanceof Error ? err.message : 'Không sinh được ảnh'
      setCanhs((prev) => prev.map((c, j) => (j === i ? { ...c, trangThai: 'loi', loi } : c)))
    } finally {
      setIsGenerating(false)
    }
  }

  const cacCanh = tachCanh(danhSachCanh)
  const soCanh = cacCanh.length
  // Không có danh sách thì chạy đúng một cảnh từ ô mô tả gốc.
  const soLuotChay = soCanh || 1
  const tongAnh = soLuotChay * numImages
  const ready = Boolean(prompt.trim() || soCanh > 0)
  const soAnhDaChon = SLOTS.filter(({ key }) => slots[key]).length
  const soXong = canhs.filter((c) => c.trangThai === 'xong').length
  const soLoi = canhs.filter((c) => c.trangThai === 'loi').length

  const chay = () => chayDanhSach(soCanh > 0 ? cacCanh : [''])
  const chayThu = () => chayDanhSach(cacCanh.slice(0, SO_CANH_CHAY_THU))

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* ---------- CỘT NHẬP ---------- */}
      <div className="flex flex-col gap-8 bg-ink-panel p-6 md:p-8">
        <Field index="01" label="Mô tả gốc" note={`${prompt.length} ký tự`}>
          <textarea
            ref={promptRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && ready && !isGenerating) chay()
            }}
            rows={6}
            className="min-h-[160px] w-full resize-y border border-white/15 bg-black p-4 font-mono text-[13px] leading-relaxed text-white transition-colors placeholder:text-white/25 focus:border-acid focus:outline-none"
            placeholder={
              '2D cartoon illustration, thick bold black outlines, flat saturated colors,\n' +
              'no text, no words, no letters — a chubby middle-aged man in a light blue shirt'
            }
          />
          <p className="font-mono text-[10px] leading-relaxed text-white/30">
            Phong cách và nhân vật — phần lặp lại ở mọi cảnh. Viết bằng tiếng Anh cho kết
            quả tốt hơn hẳn.
          </p>
        </Field>

        {/* Danh sách cảnh: mỗi dòng một cảnh. Đây là cách duy nhất chịu nổi vài
            trăm cảnh — không ai ngồi bấm từng cái, họ soạn ở bảng tính rồi dán
            cả cột vào. */}
        <Field index="02" label="Danh sách cảnh" note={soCanh > 0 ? `${soCanh} cảnh` : 'Tuỳ chọn'}>
          <textarea
            ref={canhRef}
            value={danhSachCanh}
            onChange={(e) => setDanhSachCanh(e.target.value)}
            rows={6}
            className="min-h-[160px] w-full resize-y border border-white/15 bg-black p-4 font-mono text-[13px] leading-relaxed text-white transition-colors placeholder:text-white/25 focus:border-acid focus:outline-none"
            placeholder={
              'sitting at a desk pointing at a laptop\n' +
              'standing beside a blank whiteboard\n' +
              'walking through an open door'
            }
          />
          <p className="font-mono text-[10px] leading-relaxed text-white/30">
            Mỗi dòng là một cảnh, nối sau mô tả gốc. Dán thẳng cả cột từ Excel được. Để
            trống thì chỉ chạy mô tả gốc.
          </p>
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
                Ảnh mỗi cảnh
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
            Lượt này sẽ sinh <b className="text-white/60">{tongAnh} ảnh</b> ({soLuotChay} cảnh ×{' '}
            {numImages}). Mỗi ảnh là một lần tính tiền.
          </p>
        </Field>

        <Field
          index="04"
          label="Ảnh tham chiếu"
          note={soAnhDaChon > 0 ? `Đã chọn ${soAnhDaChon}` : 'Tuỳ chọn'}
        >
          <div className="grid grid-cols-3 gap-3">
            {SLOTS.map(({ key, label, note }) => (
              <ImageSlot
                key={key}
                label={label}
                note={note}
                value={slots[key]}
                onPick={(file) => pickFile(key, file)}
                onClear={() => setSlot(key, null)}
              />
            ))}
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-white/30">
            Bấm để chọn file, hoặc bấm vào ô rồi <b className="text-white/60">Ctrl+V</b> để dán
            ảnh từ bộ nhớ tạm. Dùng chung cho mọi cảnh trong lượt.
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

        <div className="flex flex-col gap-3">
          {/* Chạy thử vài cảnh trước khi đốt tiền cho cả danh sách. Fal.ai không
              hoàn tiền, nên cửa lọc phải đặt trước lúc trả tiền. */}
          {soCanh > SO_CANH_CHAY_THU && (
            <button
              onClick={chayThu}
              disabled={isGenerating}
              className="h-12 w-full border border-white/25 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 transition-colors hover:border-acid hover:text-acid disabled:cursor-not-allowed disabled:opacity-40"
            >
              Chạy thử {SO_CANH_CHAY_THU} cảnh đầu
            </button>
          )}

          <button
            onClick={chay}
            disabled={isGenerating || !ready}
            className="group relative h-14 w-full overflow-hidden border border-acid bg-acid font-black uppercase tracking-[0.2em] text-black transition-all hover:tracking-[0.3em] disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-transparent disabled:tracking-[0.2em] disabled:text-white/30"
          >
            {isGenerating
              ? `Đang chạy ${soXong + soLoi}/${canhs.length}…`
              : soCanh > 1
                ? `Chạy ${soCanh} cảnh`
                : 'Chạy AI'}
          </button>
        </div>
      </div>

      {/* ---------- CỘT KẾT QUẢ ---------- */}
      <div className="flex flex-col bg-ink-panel">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            05 / Kết quả
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
            {isGenerating
              ? `${soXong + soLoi}/${canhs.length}`
              : canhs.length > 0
                ? `${soXong} xong${soLoi ? ` · ${soLoi} lỗi` : ''}`
                : 'Chờ lệnh'}
          </span>
        </div>

        <div className="relative min-h-[380px] flex-1 overflow-y-auto bg-black">
          {canhs.length === 0 ? (
            <div className="flex h-full min-h-[380px] items-center justify-center px-8 text-center">
              <div>
                <p className="text-6xl font-black uppercase leading-[0.85] tracking-[-0.04em] nx-outline-text md:text-8xl">
                  Nexus
                </p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
                  Chưa có tác vụ nào
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-px bg-white/10">
              {canhs.map((canh, i) => (
                <KhoiCanh
                  key={i}
                  canh={canh}
                  soThuTu={i + 1}
                  demo={demo}
                  dangChay={isGenerating}
                  onChayLai={() => chayLaiMotCanh(i)}
                  onContinue={(url, key) => continueFrom(url, key)}
                />
              ))}
            </div>
          )}
        </div>

        {canhs.length > 0 && (
          <p className="border-t border-white/10 px-6 py-3 font-mono text-[10px] leading-relaxed text-white/30 md:px-8">
            Ảnh chưa được lưu ở đâu cả. Tải về trước khi đóng tab, nếu không là mất.
          </p>
        )}
      </div>
    </div>
  )
}

/** Một cảnh trong cột kết quả: tên cảnh, trạng thái, và các ảnh của nó. */
function KhoiCanh({
  canh,
  soThuTu,
  demo,
  dangChay,
  onChayLai,
  onContinue,
}: {
  canh: Canh
  soThuTu: number
  demo: boolean
  dangChay: boolean
  onChayLai: () => void
  onContinue: (url: string, key: SlotKey) => void
}) {
  const mau = {
    cho: 'text-white/30',
    dangChay: 'text-acid',
    xong: 'text-white/50',
    loi: 'text-red-400',
  }[canh.trangThai]

  const chu = {
    cho: 'Chờ',
    dangChay: 'Đang chạy',
    xong: 'Xong',
    loi: 'Lỗi',
  }[canh.trangThai]

  return (
    <div className="bg-ink-panel">
      <div className="flex items-baseline gap-3 px-6 py-3 md:px-8">
        <span className="font-mono text-[10px] text-white/40">
          {String(soThuTu).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-white/70">
          {canh.moTa || '(mô tả gốc)'}
        </span>
        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${mau}`}>{chu}</span>
        {canh.trangThai === 'loi' && (
          <button
            onClick={onChayLai}
            disabled={dangChay}
            className="border border-white/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/70 transition-colors hover:border-acid hover:text-acid disabled:opacity-40"
          >
            Chạy lại
          </button>
        )}
      </div>

      {canh.trangThai === 'loi' && canh.loi && (
        <p className="mx-6 mb-3 max-h-40 overflow-y-auto border-l-2 border-red-500 bg-red-500/10 px-3 py-2 font-mono text-[10px] whitespace-pre-wrap break-words text-red-300 md:mx-8">
          {canh.loi}
        </p>
      )}

      {canh.anh.length > 0 && (
        <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3">
          {canh.anh.map((url, i) => (
            <ResultTile
              key={url}
              url={url}
              index={i + 1}
              demo={demo}
              onContinue={(key) => onContinue(url, key)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Một ô ảnh tham chiếu. Nhận file chọn tay hoặc ảnh dán từ bộ nhớ tạm. */
function ImageSlot({
  label,
  note,
  value,
  onPick,
  onClear,
}: {
  label: string
  note: string
  value: SlotValue | null
  onPick: (file: File | null) => void
  onClear: () => void
}) {
  const preview = value?.preview ?? null

  /**
   * Dán ảnh bằng Ctrl+V. Ô phải nhận được tiêu điểm thì trình duyệt mới gửi sự
   * kiện dán tới đây, nên nó có tabIndex và viền sáng lên khi được chọn.
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((it) => it.type.startsWith('image/'))
    if (!item) return
    const file = item.getAsFile()
    if (file) {
      e.preventDefault()
      onPick(file)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        tabIndex={0}
        onPaste={handlePaste}
        className="group relative aspect-square w-full overflow-hidden border border-dashed border-white/20 bg-black transition-colors hover:border-acid/60 focus:border-acid focus:outline-none"
      >
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
            <button
              onClick={onClear}
              aria-label={`Bỏ ảnh ${label}`}
              className="absolute right-1 top-1 z-20 bg-black/80 px-1.5 py-0.5 font-mono text-[11px] leading-none text-white/70 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
            >
              ×
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1">
            <span className="text-3xl font-thin leading-none text-white/25 transition-colors group-hover:text-acid">
              +
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/20">
              Ctrl+V
            </span>
          </div>
        )}
      </div>
      {/* Xếp dọc chứ không dàn ngang: ở bề rộng một phần ba cột, nhãn và ghi chú
          nằm cạnh nhau sẽ xuống dòng rồi xô vào ô bên cạnh. */}
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

/** Một ảnh kết quả, kèm nút nối tiếp và tải về. */
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
  // Đường dẫn có về không có nghĩa là ảnh tải được: máy chủ ảnh có thể chậm,
  // quá tải hoặc chặn. Không bắt trạng thái này thì người dùng nhìn thấy một ô
  // đen trơn, không biết đang chờ hay đã hỏng.
  const [state, setState] = useState<'dangTai' | 'xong' | 'hong'>('dangTai')

  const download = async () => {
    setSaving(true)
    try {
      // Thuộc tính download của thẻ a bị bỏ qua với ảnh khác tên miền, nên phải
      // tự tải nội dung về rồi mới lưu được đúng tên file.
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
      <img
        src={url}
        alt={`Ảnh ${index}`}
        onLoad={() => setState('xong')}
        onError={() => setState('hong')}
        className={`h-full w-full object-contain transition-opacity ${
          state === 'xong' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {state === 'dangTai' && (
        <p className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
          Đang tải ảnh…
        </p>
      )}

      {state === 'hong' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-400">
            Không tải được ảnh
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/30 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/70 transition-colors hover:border-white hover:text-white"
          >
            Mở đường dẫn
          </a>
        </div>
      )}

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
