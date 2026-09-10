import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Middleware đã chặn các truy cập không phải admin, nhưng kiểm tra lại cho chắc
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#110000] text-white p-8 font-sans">
      <div className="fixed inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-screen pointer-events-none"></div>
      
      <header className="relative z-10 flex justify-between items-center mb-12 border-b border-red-500/30 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            Admin Override
          </h1>
          <p className="text-xs text-red-300 mt-1">Superuser: {user.email}</p>
        </div>
        <div className="flex gap-4">
          <a href="/dashboard" className="text-xs uppercase tracking-widest text-gray-400 hover:text-white flex items-center">
            Return to User Core
          </a>
          <form action={logout}>
            <button type="submit" className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white uppercase tracking-widest text-xs transition-colors">
              Disconnect
            </button>
          </form>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-red-950/20 border border-red-500/20">
            <h2 className="text-lg font-bold mb-2 uppercase tracking-widest text-red-400">User Management</h2>
            <p className="text-sm text-gray-400 mb-4">
              Access control panel to modify user permissions and roles.
            </p>
            <Link href="/dashboard/admin/users" className="w-full flex justify-center items-center h-12 bg-red-600 hover:bg-red-500 text-white uppercase tracking-widest text-xs font-bold transition-colors">
              Open Directory
            </Link>
          </div>
          
          <div className="p-6 bg-red-950/20 border border-red-500/20 opacity-50">
            <h2 className="text-lg font-bold mb-2 uppercase tracking-widest text-red-400">System Logs</h2>
            <p className="text-sm text-gray-400 mb-4">
              [ ENCRYPTED DATA MODULE - OFFLINE ]
            </p>
            <div className="w-full flex justify-center items-center h-12 border border-red-600 text-red-600 uppercase tracking-widest text-xs font-bold cursor-not-allowed">
              Access Denied
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
