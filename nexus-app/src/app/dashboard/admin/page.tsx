import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'
import Backdrop from '@/components/nx/Backdrop'
import Reveal from '@/components/nx/Reveal'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Middleware đã chặn truy cập không phải admin, kiểm tra lại cho chắc
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink text-white selection:bg-acid selection:text-black">
      <Backdrop />

      <p
        aria-hidden
        className="pointer-events-none absolute -top-6 right-0 z-0 select-none text-[20vw] font-black uppercase leading-[0.75] tracking-[-0.05em] nx-outline-text"
      >
        Admin
      </p>

      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-6 py-4">
            <Link href="/dashboard" className="flex items-baseline gap-3">
              <span className="text-xl font-black uppercase tracking-[-0.03em]">Nexus</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">
                Quản trị
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="border border-white/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/70 transition-colors hover:border-acid hover:text-acid"
              >
                Về khu người dùng
              </Link>
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

        <main className="mx-auto max-w-[1500px] px-6 py-16 md:py-24">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-acid">
              00 // Toàn quyền hệ thống
            </p>
            <h1 className="mt-6 text-[14vw] font-black uppercase leading-[0.95] tracking-[-0.05em] md:text-[8rem]">
              Bảng
              <br />
              <span className="text-acid">điều hành</span>
            </h1>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
              Đang đăng nhập: {user.email}
            </p>
          </Reveal>

          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Reveal delay={0.05}>
              <ModuleCard
                index="01"
                title="Quản lý người dùng"
                body="Xem toàn bộ tài khoản, kiểm tra phân quyền và thông tin liên hệ của từng rạp."
                href="/dashboard/admin/users"
                cta="Mở danh sách"
              />
            </Reveal>
            <Reveal delay={0.12}>
              <ModuleCard
                index="02"
                title="Nhật ký hệ thống"
                body="Theo dõi lượt sinh ảnh, chi phí API và lỗi phát sinh. Chưa xây dựng."
                disabled
                cta="Chưa mở"
              />
            </Reveal>
          </div>
        </main>
      </div>
    </div>
  )
}

function ModuleCard({
  index,
  title,
  body,
  href,
  cta,
  disabled = false,
}: {
  index: string
  title: string
  body: string
  href?: string
  cta: string
  disabled?: boolean
}) {
  const inner = (
    <div
      className={`group relative flex h-full flex-col justify-between border p-8 transition-colors ${
        disabled
          ? 'border-white/10 bg-ink-panel/50'
          : 'border-white/10 bg-ink-panel hover:border-acid/50'
      }`}
    >
      <div>
        <span className="font-mono text-[10px] tracking-[0.3em] text-acid">{index}</span>
        <h2
          className={`mt-5 text-3xl font-black uppercase leading-[1.05] tracking-[-0.03em] ${
            disabled ? 'text-white/35' : 'text-white'
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-4 max-w-sm text-sm leading-relaxed ${
            disabled ? 'text-white/25' : 'text-white/50'
          }`}
        >
          {body}
        </p>
      </div>

      <span
        className={`mt-12 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] ${
          disabled ? 'text-white/25' : 'text-acid'
        }`}
      >
        {cta}
        {!disabled && (
          <span className="transition-transform group-hover:translate-x-1">→</span>
        )}
      </span>
    </div>
  )

  if (disabled || !href) return inner
  return (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  )
}
