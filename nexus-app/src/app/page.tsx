import Link from 'next/link'
import HeroCard from '@/components/nx/HeroCard'
import Marquee from '@/components/nx/Marquee'
import Reveal from '@/components/nx/Reveal'

const STEPS = [
  {
    index: '01',
    title: 'Tải một tấm ảnh',
    body: 'Một ảnh chân dung sắc nét là đủ. Không cần huấn luyện mô hình, không cần máy cấu hình cao.',
    meta: '~5 giây',
  },
  {
    index: '02',
    title: 'Chọn phong cách',
    body: 'Dùng model dựng sẵn hoặc đưa lên một bức tranh mẫu để sao chép màu sắc và nét cọ.',
    meta: 'Siêu thực · Hoạt hình · Tranh vẽ',
  },
  {
    index: '03',
    title: 'Nhận hàng trăm ảnh',
    body: 'Khuôn mặt giữ nguyên qua mọi khung cảnh. Tải về cả loạt chỉ trong một lần bấm.',
    meta: 'Tối đa 300 ảnh mỗi lượt',
  },
]

const STATS = [
  { value: '300', label: 'Ảnh mỗi lượt chạy' },
  { value: '01', label: 'Ảnh mẫu cần tải lên' },
  { value: '0đ', label: 'Chi phí máy chủ hàng tháng' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-acid selection:text-black">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8">
        {/* ---------- ĐẦU TRANG ---------- */}
        <header className="flex flex-wrap items-start justify-between gap-6 py-6 md:py-8">
          <div className="flex flex-wrap items-start gap-6 md:gap-12">
            <Link
              href="/"
              className="text-2xl font-bold uppercase tracking-[0.14em] md:text-[26px]"
            >
              Nexus
            </Link>
            <p className="max-w-[380px] text-[15px] leading-snug text-ink/75 md:text-base">
              Nền tảng sinh ảnh AI hàng loạt, giữ nguyên khuôn mặt và phong cách chỉ từ
              một tấm ảnh mẫu.
            </p>
          </div>

          <nav className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/[0.06] text-ink/60"
            >
              —
            </span>
            <Link
              href="/auth"
              className="group flex h-11 items-center gap-2.5 rounded-full bg-ink px-6 text-[11px] font-bold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ink/85"
            >
              Bắt đầu
              <span className="h-1.5 w-1.5 rounded-full bg-acid transition-transform group-hover:scale-150" />
            </Link>
            <Link
              href="/dashboard"
              className="flex h-11 items-center rounded-full bg-ink/[0.06] px-6 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-ink/[0.12]"
            >
              Bảng điều khiển
            </Link>
          </nav>
        </header>

        {/* ---------- THẺ 3D ---------- */}
        <HeroCard />

        {/* ---------- DẢI CHÂN MÀN HÌNH ---------- */}
        <div className="relative flex items-center justify-between border-t border-ink/10 py-5">
          {['a', 'b', 'c', 'd'].map((k) => (
            <span key={k} aria-hidden className="text-sm leading-none text-ink/25">
              +
            </span>
          ))}
          <span className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] text-ink/45">
            Cuộn để xem tiếp
          </span>
        </div>

        {/* ---------- CON SỐ ---------- */}
        <Reveal className="grid grid-cols-1 gap-6 py-20 md:grid-cols-3 md:py-28">
          {STATS.map((s) => (
            <div key={s.label} className="border-t border-ink/15 pt-6">
              <p className="text-7xl font-black tracking-[-0.05em] md:text-8xl">{s.value}</p>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-ink/50">
                {s.label}
              </p>
            </div>
          ))}
        </Reveal>
      </div>

      {/* ---------- DẢI CHỮ CHẠY ---------- */}
      <Marquee
        text="GIỮ MẶT · GIỮ PHONG CÁCH · SINH HÀNG LOẠT ·"
        className="border-y border-ink/10 py-7 text-4xl font-black uppercase leading-[1.25] tracking-[-0.02em] text-ink/15 md:text-6xl"
      />

      <div className="mx-auto max-w-[1600px] px-5 md:px-8">
        {/* ---------- BA BƯỚC ---------- */}
        <section className="py-24 md:py-32">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink/15 pb-8">
              <h2 className="max-w-2xl text-5xl font-black uppercase leading-[1.18] tracking-[-0.04em] md:text-7xl">
                Ba bước,
                <br />
                <span className="nx-outline-ink">không hơn</span>
              </h2>
              <p className="max-w-xs text-[15px] leading-relaxed text-ink/60">
                Không cài đặt, không huấn luyện mô hình. Mở trình duyệt lên là chạy được.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.index} delay={i * 0.08}>
                <article className="nx-lift flex h-full flex-col justify-between rounded-[24px] bg-white/70 p-8 md:p-10">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-ink/35">
                      {step.index}
                    </span>
                    <h3 className="mt-8 text-3xl font-bold leading-[1.15] tracking-[-0.02em]">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-relaxed text-ink/60">{step.body}</p>
                  </div>
                  <p className="mt-12 border-t border-ink/10 pt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/45">
                    {step.meta}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- KÊU GỌI ---------- */}
        <section className="pb-32 md:pb-44">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] bg-ink px-8 py-24 text-center md:py-32">
              <div className="absolute inset-0 nx-glow" aria-hidden />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-paper/45">
                  Sẵn sàng chưa?
                </p>
                <h2 className="mt-8 text-[11vw] font-black uppercase leading-[1.14] tracking-[-0.045em] text-paper md:text-[8rem]">
                  Bắt tay
                  <br />
                  <span className="text-acid">vào việc</span>
                </h2>
                <Link
                  href="/auth"
                  className="group mt-14 inline-flex h-16 items-center gap-4 rounded-full bg-acid px-12 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-all hover:gap-6"
                >
                  Vào Nexus
                  <span aria-hidden className="text-base leading-none">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </div>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-5 py-8 text-[10px] font-bold uppercase tracking-[0.25em] text-ink/40 md:flex-row md:justify-between md:px-8">
          <span>Nexus — AI Batch Generation</span>
          <span>Entertainment 2020</span>
        </div>
      </footer>
    </div>
  )
}
