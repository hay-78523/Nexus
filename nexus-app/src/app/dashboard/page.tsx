import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import AIGenerator from '@/components/AIGenerator'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Lấy dữ liệu user từ bảng profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, phone_number, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#ccff00] text-black font-sans overflow-x-hidden selection:bg-black selection:text-[#ccff00] relative">
      
      {/* BACKGROUND IMAGE (Absolute, cover full height, object-cover) */}
      <div className="fixed inset-0 z-0 opacity-80 pointer-events-none flex justify-center items-center mix-blend-multiply">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/cyber_head_bg.jpg" 
          alt="Cyber Head Background" 
          className="w-full h-full object-cover grayscale-[30%] contrast-125"
        />
      </div>

      {/* MẢNG TRANG TRÍ CHỮ ACID GRAPHICS (Nằm dưới UI nhưng trên nền) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-2%] text-[200px] md:text-[300px] font-black uppercase leading-[0.75] tracking-tighter mix-blend-overlay opacity-40">
          DIS<br/>CO<br/>NN<br/>EC<br/>TE<br/>D
        </div>
        <div className="absolute bottom-[5%] left-[20%] text-[80px] md:text-[150px] font-black uppercase leading-[0.8] tracking-tighter opacity-80">
          the » »<br/>INTERNET<br/>INTERNET
        </div>
        <div className="absolute top-[20%] right-[5%] text-[60px] md:text-[100px] font-black uppercase leading-none tracking-tighter text-right">
          ARE<br/>YOU<br/>READY?
        </div>
        
        {/* Họa tiết bàn cờ & Crap inside */}
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMjAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMwMDAiLz48L3N2Zz4=')] opacity-50 mix-blend-multiply rotate-12"></div>
        
        <div className="absolute bottom-5 left-5 border-4 border-black bg-[#ccff00] p-2 font-black uppercase tracking-widest text-2xl rotate-[-5deg]">
          crap<br/>inside
        </div>
      </div>

      {/* GIAO DIỆN CHÍNH (Nổi lên trên) */}
      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* HEADER / USER PROFILE */}
        <aside className="xl:col-span-4 flex flex-col gap-8">
          
          {/* Logo / Header Block */}
          <div className="bg-black text-[#ccff00] border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] p-6 rotate-[-2deg] hover:rotate-0 transition-transform">
            <h1 className="text-6xl font-black uppercase tracking-tighter mb-2">NEXUS<br/>CORE</h1>
            <p className="font-mono text-sm uppercase tracking-widest bg-[#ccff00] text-black inline-block px-2 py-1 font-bold">
              {'// SYSTEM OVERRIDE'}
            </p>
          </div>

          {/* Profile Card Brutalism */}
          <div className="bg-[#ccff00] border-8 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] p-6 relative">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-black text-[#ccff00] flex items-center justify-center rounded-full font-black text-2xl rotate-12 border-4 border-[#ccff00]">
              {profile?.role === 'admin' ? 'AD' : 'US'}
            </div>
            
            <h2 className="text-4xl font-black uppercase tracking-tighter border-b-8 border-black pb-4 mb-4">
              Operator<br/>Profile
            </h2>
            
            <div className="space-y-4 font-mono font-bold text-lg uppercase tracking-wider">
              <div>
                <div className="text-sm bg-black text-[#ccff00] inline-block px-2 mb-1">Designation</div>
                <div className="text-2xl font-black">{profile?.full_name || 'GUEST_ENTITY'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t-4 border-black pt-4">
                <div>
                  <div className="text-xs bg-black text-[#ccff00] inline-block px-1 mb-1">Comm</div>
                  <div className="truncate">{profile?.phone_number || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs bg-black text-[#ccff00] inline-block px-1 mb-1">Clearance</div>
                  <div className="">{profile?.role || 'USER'}</div>
                </div>
              </div>

              <div className="border-t-4 border-black pt-4">
                <div className="text-xs bg-black text-[#ccff00] inline-block px-1 mb-1">Identity</div>
                <div className="truncate bg-white border-2 border-black p-2 mt-1">{profile?.email || user.email}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 font-black text-xl uppercase tracking-tighter">
            {profile?.role === 'admin' && (
              <a href="/dashboard/admin" className="w-full bg-black text-white border-4 border-black p-4 text-center hover:bg-white hover:text-black hover:translate-x-1 hover:translate-y-1 shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[0_0_0_0_rgba(0,0,0,1)] transition-all">
                ADMINISTRATION PANEL
              </a>
            )}
            <form action={logout}>
              <button type="submit" className="w-full bg-white text-black border-4 border-black p-4 text-center hover:bg-red-500 hover:text-white hover:translate-x-1 hover:translate-y-1 shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[0_0_0_0_rgba(0,0,0,1)] transition-all">
                DISCONNECT (LOGOUT)
              </button>
            </form>
          </div>
          
        </aside>

        {/* AI GENERATOR AREA */}
        <main className="xl:col-span-8 flex flex-col h-full">
          <div className="bg-white border-8 border-black shadow-[20px_20px_0_0_rgba(0,0,0,1)] h-full flex flex-col relative z-20">
            
            {/* Header của Block */}
            <div className="bg-black text-[#ccff00] p-4 flex justify-between items-center border-b-8 border-black">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                AI RENDERING MODULE
              </h2>
              <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse border-2 border-white"></div>
            </div>
            
            {/* Vùng chứa Component AI */}
            {/* Chúng ta dùng CSS override để ép UI của AIGenerator theo phong cách Brutalism */}
            <div className="p-4 md:p-8 flex-1 [&_div]:border-black [&_button]:border-black [&_input]:border-black [&_textarea]:border-black [&_select]:border-black">
              <style dangerouslySetInnerHTML={{__html: `
                /* CSS hack để Brutalism-hóa component AIGenerator bên trong */
                .aigenerator-wrapper {
                  font-family: inherit;
                }
                .aigenerator-wrapper input, 
                .aigenerator-wrapper textarea, 
                .aigenerator-wrapper select {
                  background-color: #fff !important;
                  border: 4px solid #000 !important;
                  border-radius: 0 !important;
                  box-shadow: 4px 4px 0 0 #000 !important;
                  color: #000 !important;
                  font-weight: bold;
                }
                .aigenerator-wrapper button {
                  background-color: #ccff00 !important;
                  color: #000 !important;
                  border: 4px solid #000 !important;
                  border-radius: 0 !important;
                  box-shadow: 6px 6px 0 0 #000 !important;
                  text-transform: uppercase !important;
                  font-weight: 900 !important;
                  transition: all 0.1s !important;
                }
                .aigenerator-wrapper button:active {
                  transform: translate(4px, 4px) !important;
                  box-shadow: 0 0 0 0 #000 !important;
                }
                .aigenerator-wrapper .bg-black {
                  background-color: #f0f0f0 !important;
                  border: 4px solid #000 !important;
                  box-shadow: 8px 8px 0 0 #000 !important;
                }
              `}} />
              <div className="aigenerator-wrapper h-full">
                <AIGenerator />
              </div>
            </div>

            {/* Chữ trang trí đè bậy bạ ở viền */}
            <div className="absolute -bottom-8 -right-8 bg-black text-[#ccff00] p-4 font-black text-3xl uppercase tracking-widest border-4 border-[#ccff00] rotate-[-10deg] shadow-[8px_8px_0_0_#ccff00]">
              #GOOD #COOL
            </div>
          </div>
        </main>

      </div>
    </div>
  )
}
