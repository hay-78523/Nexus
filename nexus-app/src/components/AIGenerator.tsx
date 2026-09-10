'use client'

import { useState } from 'react'

export default function AIGenerator() {
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleGenerate = async () => {
    if (!prompt || !imageFile) {
      setError('Cần chọn ảnh gốc và nhập mô tả trước khi chạy.')
      return
    }

    setError(null)
    setIsGenerating(true)
    setResultImage(null)

    try {
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(imageFile)
      })

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, image: base64Image }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Không sinh được ảnh')

      setResultImage(data.imageUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không sinh được ảnh')
    } finally {
      setIsGenerating(false)
    }
  }

  const ready = Boolean(imageFile && prompt)

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden border border-white/10 bg-white/10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* ---------- CỘT NHẬP ---------- */}
      <div className="flex flex-col gap-8 bg-ink-panel p-6 md:p-8">
        <Field index="01" label="Ảnh gốc" note="Giữ khuôn mặt">
          <div className="group relative aspect-square w-full overflow-hidden border border-dashed border-white/20 bg-black transition-colors hover:border-acid/60">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              aria-label="Chọn ảnh gốc"
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
            {imagePreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Ảnh gốc đã chọn"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-3 left-3 bg-acid px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                  Đã nạp
                </span>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <span className="text-4xl font-thin leading-none text-white/25 transition-colors group-hover:text-acid">
                  +
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors group-hover:text-white/70">
                  Kéo thả hoặc bấm để chọn
                </span>
              </div>
            )}
          </div>
        </Field>

        <Field index="02" label="Mô tả" note="Phong cách">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-32 w-full resize-none border border-white/15 bg-black p-4 font-mono text-sm text-white transition-colors placeholder:text-white/25 focus:border-acid focus:outline-none"
            placeholder="Chân dung điện ảnh, ánh sáng neon xanh chanh, nền tối, độ nét cao"
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="border-l-2 border-red-500 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-300"
          >
            {error}
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
            03 / Kết quả
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
            {isGenerating ? 'Đang chạy' : 'Chờ lệnh'}
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
          ) : resultImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resultImage} alt="Ảnh do AI sinh ra" className="h-full w-full object-contain" />
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
      </div>
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
