import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'
import AIGenerator from '@/components/AIGenerator'
import Backdrop from '@/components/nx/Backdrop'
import Marquee from '@/components/nx/Marquee'
import Reveal from '@/components/nx/Reveal'
import SectionLabel from '@/components/nx/SectionLabel'
import Scene3D from '@/components/nx/Scene3D'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, phone_number, email')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink text-white selection:bg-acid selection:text-black">
      <Backdrop />

      {/* Chữ trang trí khổ lớn nằm sau nội dung */}
      <p
        aria-hidden
        className="pointer-events-none absolute -top-8 left-0 z-0 select-none text-[24vw] font-black uppercase leading-[0.75] tracking-[-0.05em] nx-outline-text"
      >
        Nexus
      </p>

      <div className="relative z-10">
        {/* ---------- THANH TRÊN ---------- */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-6 py-4">
            <Link href="/" className="group flex items-baseline gap-3">
              <span className="text-xl font-black uppercase tracking-[-0.03em]">Nexus</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid transition-opacity group-hover:opacity-60">
                Core
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className="border border-white/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/70 transition-colors hover:border-acid hover:text-acid"
                >
                  Quản trị
                </Link>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="border border-white/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/70 transition-colors hover:border-red-500 hover:text-red-400"
                >
                  Đăng xuất
                </button>
              </form>
            </nav>
          </div>
        </header>

        {/* ---------- TIÊU ĐỀ ---------- */}
        <section className="relative mx-auto max-w-[1500px] px-6 pb-10 pt-16 md:pt-24">
          <Scene3D className="left-auto right-[-8%] top-[-14%] hidden h-[130%] w-[62%] xl:block" />

          <Reveal className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-acid">
              01 // Khu vực điều khiển
            </p>
            <h1 className="mt-6 text-[15vw] font-black uppercase leading-[0.95] tracking-[-0.05em] md:text-[9rem]">
              Sinh ảnh
              <br />
              <span className="text-acid">hàng loạt</span>
            </h1>
            <p className="mt-8 max-w-lg text-sm leading-relaxed text-white/50">
              Một ảnh chân dung, một câu mô tả. Nexus giữ nguyên khuôn mặt và phong cách
              rồi dựng ra hàng trăm khung hình khác nhau.
            </p>
          </Reveal>
        </section>

        <Marquee
          text="AI BATCH GENERATION · GIỮ MẶT · GIỮ PHONG CÁCH ·"
          className="border-y border-white/10 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/25"
        />

        {/* ---------- NỘI DUNG ---------- */}
        <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-10 px-6 py-16 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Hồ sơ người dùng */}
          <Reveal className="xl:sticky xl:top-24 xl:self-start">
            <aside className="border border-white/10 bg-ink-panel">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Tài khoản
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isAdmin ? 'bg-acid' : 'bg-white/30'}`}
                />
              </div>

              <div className="px-6 py-6">
                <p
                  className={`text-4xl font-black uppercase leading-[1.05] tracking-[-0.03em] ${
                    isAdmin ? 'text-acid' : 'text-white'
                  }`}
                >
                  {profile?.role || 'user'}
                </p>

                <dl className="mt-8 flex flex-col gap-5">
                  <Row label="Email" value={profile?.email || user.email || '—'} />
                  <Row label="Điện thoại" value={profile?.phone_number || '—'} />
                </dl>
              </div>
            </aside>
          </Reveal>

          {/* Module AI */}
          <Reveal delay={0.1} className="min-w-0">
            <SectionLabel index="02" title="Module dựng ảnh" note="Fal.ai · chưa kết nối" />
            <div className="mt-8">
              <AIGenerator />
            </div>
          </Reveal>
        </main>

        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-6 py-8 font-mono text-[10px] uppercase tracking-[0.25em] text-white/25 md:flex-row md:justify-between">
            <span>Nexus — AI Batch Generation</span>
            <span>Đăng nhập với {profile?.email || user.email}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">{label}</dt>
      <dd className="mt-1 truncate font-mono text-sm text-white/85">{value}</dd>
    </div>
  )
}
