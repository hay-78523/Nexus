import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth')
  }

  // 2. Verify Authorization (Admin only)
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 3. Fetch all profiles (Users)
  // We order by creation date if there is one, but profiles doesn't have it by default.
  // We'll just fetch them all.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true })

  return (
    <div className="min-h-screen bg-[#110000] text-white p-8 font-sans">
      <div className="fixed inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-screen pointer-events-none"></div>
      
      <header className="relative z-10 flex justify-between items-center mb-12 border-b border-red-500/30 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            User Directory
          </h1>
          <p className="text-xs text-red-300 mt-1">Classified Admin Access</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/admin" className="text-xs uppercase tracking-widest text-gray-400 hover:text-white flex items-center border border-gray-400/30 px-3 py-1 hover:border-white transition-colors">
            Return to Admin Hub
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto">
        <div className="bg-red-950/20 border border-red-500/20 p-6">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-widest text-red-400">Database Records</h2>
          
          {error ? (
            <div className="p-4 bg-red-900/50 text-red-200 border border-red-500 font-mono text-sm">
              Error fetching records: {error.message}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm border-collapse">
                <thead>
                  <tr className="border-b border-red-500/50 text-red-300 uppercase tracking-widest text-[10px]">
                    <th className="p-3 font-normal">ID</th>
                    <th className="p-3 font-normal">Email</th>
                    <th className="p-3 font-normal">Full Name</th>
                    <th className="p-3 font-normal">Phone</th>
                    <th className="p-3 font-normal">Role</th>
                  </tr>
                </thead>
                <tbody className="text-red-100">
                  {profiles?.map((profile) => (
                    <tr key={profile.id} className="border-b border-red-900/30 hover:bg-red-900/20 transition-colors">
                      <td className="p-3 text-[10px] text-red-500/50 break-all w-1/4">{profile.id}</td>
                      <td className="p-3">{profile.email}</td>
                      <td className="p-3 text-red-200">{profile.full_name || 'N/A'}</td>
                      <td className="p-3 text-red-200">{profile.phone_number || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-[10px] uppercase tracking-widest ${
                          profile.role === 'admin' 
                            ? 'bg-red-600 text-white font-bold' 
                            : 'bg-black text-red-300 border border-red-900/50'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
