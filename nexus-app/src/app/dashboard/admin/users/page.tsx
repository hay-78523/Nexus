import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Backdrop from '@/components/nx/Backdrop'
import Reveal from '@/components/nx/Reveal'
import SectionLabel from '@/components/nx/SectionLabel'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth')
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true })

  const total = profiles?.length ?? 0
  const admins = profiles?.filter((p) => p.role === 'admin').length ?? 0

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink text-white selection:bg-acid selection:text-black">
      <Backdrop />

      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-6 py-4">
            <Link href="/dashboard/admin" className="flex items-baseline gap-3">
              <span className="text-xl font-black uppercase tracking-[-0.03em]">Nexus</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">
                Quản trị
              </span>
            </Link>
            <Link
              href="/dashboard/admin"
              className="border border-white/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/70 transition-colors hover:border-acid hover:text-acid"
            >
              ← Quay lại
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-6 py-16 md:py-20">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-acid">
              01 // Danh bạ tài khoản
            </p>
            <h1 className="mt-6 text-[13vw] font-black uppercase leading-[0.95] tracking-[-0.05em] md:text-[7rem]">
              Người dùng
            </h1>

            <div className="mt-12 flex flex-wrap gap-px border border-white/10 bg-white/10">
              <Stat label="Tổng tài khoản" value={String(total)} />
              <Stat label="Quản trị viên" value={String(admins)} accent />
              <Stat label="Người dùng thường" value={String(total - admins)} />
            </div>
          </Reveal>

          <Reveal delay={0.1} className="mt-16">
            <SectionLabel index="02" title="Bản ghi" note={`${total} dòng`} />

            {error ? (
              <p
                role="alert"
                className="mt-8 border-l-2 border-red-500 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-300"
              >
                Không đọc được dữ liệu: {error.message}
              </p>
            ) : total === 0 ? (
              <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.25em] text-white/30">
                Chưa có tài khoản nào
              </p>
            ) : (
              <div className="mt-8 overflow-x-auto border border-white/10 bg-ink-panel">
                <table className="w-full min-w-[880px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
                      <th className="w-12 p-4 font-normal">#</th>
                      <th className="p-4 font-normal">Họ tên</th>
                      <th className="p-4 font-normal">Email</th>
                      <th className="p-4 font-normal">Điện thoại</th>
                      <th className="p-4 font-normal">Quyền</th>
                      <th className="p-4 font-normal">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles?.map((p, i) => (
                      <tr
                        key={p.id}
                        className="group border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="p-4 font-mono text-[11px] text-white/25 group-hover:text-acid">
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td className="p-4 text-sm font-bold text-white">
                          {p.full_name || '—'}
                        </td>
                        <td className="p-4 font-mono text-xs text-white/70">{p.email}</td>
                        <td className="p-4 font-mono text-xs text-white/70">
                          {p.phone_number || '—'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${
                              p.role === 'admin'
                                ? 'bg-acid text-black'
                                : 'border border-white/20 text-white/60'
                            }`}
                          >
                            {p.role}
                          </span>
                        </td>
                        <td className="max-w-[220px] truncate p-4 font-mono text-[10px] text-white/20">
                          {p.id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Reveal>
        </main>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="min-w-[180px] flex-1 bg-ink-panel px-6 py-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">{label}</p>
      <p
        className={`mt-2 text-5xl font-black tracking-[-0.04em] ${
          accent ? 'text-acid' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
