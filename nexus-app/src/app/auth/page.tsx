import AuthForm from './AuthForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Background Noise */}
      <div className="fixed inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-screen pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 bg-black/50 border border-white/10 backdrop-blur-xl">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-widest text-white mb-2">NEXUS<span className="text-[#00ffff]">_OS</span></h1>
          <p className="text-[10px] uppercase tracking-widest text-white/50">Authenticate to access Core</p>
        </div>

        <AuthForm error={error} />
      </div>
    </div>
  )
}
