import Link from 'next/link'
import AuthForm from './AuthForm'
import Backdrop from '@/components/nx/Backdrop'
import Marquee from '@/components/nx/Marquee'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-ink text-white selection:bg-acid selection:text-black">
      <Backdrop />

      <p
        aria-hidden
        className="pointer-events-none absolute -bottom-[6vw] left-0 z-0 select-none text-[26vw] font-black uppercase leading-[0.7] tracking-[-0.05em] nx-outline-text"
      >
        Nexus
      </p>

      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="text-xl font-black uppercase tracking-[-0.03em]">Nexus</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">Core</span>
        </Link>
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white"
        >
          ← Trang chủ
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-acid">
            00 // Xác thực
          </p>
          <h1 className="mt-5 text-6xl font-black uppercase leading-[1] tracking-[-0.04em]">
            Đăng
            <br />
            <span className="text-acid">nhập</span>
          </h1>

          <div className="mt-10 border border-white/10 bg-ink-panel/80 p-8 backdrop-blur-xl">
            <AuthForm error={error} />
          </div>
        </div>
      </main>

      <Marquee
        text="AI BATCH GENERATION · GIỮ MẶT · GIỮ PHONG CÁCH ·"
        className="relative z-10 border-t border-white/10 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/20"
      />
    </div>
  )
}
