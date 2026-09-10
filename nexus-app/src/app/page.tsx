import { Button } from "@/components/ui/button"
import Link from "next/link"
import ThreeDPosterWebGL from "@/components/ThreeDPosterWebGL"

export default function LandingPage() {
  return (
    <div className="bg-[#090909] min-h-screen text-white font-sans overflow-x-hidden selection:bg-[#ccff00] selection:text-black">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full flex items-center justify-between px-6 py-6 z-50 mix-blend-difference pointer-events-auto">
        <div className="flex items-center gap-4 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" fill="currentColor" viewBox="0 0 121 24" className="text-white">
            <path d="M0 23.781V.22h3.871v20.129h10.132v3.433H0ZM22.76.118v13.666c0 2.222.438 3.893 1.313 5.015.875 1.1 2.233 1.65 4.073 1.65 1.862 0 3.231-.55 4.106-1.65.898-1.122 1.347-2.793 1.347-5.015V.118h3.87v13.464c0 3.366-.796 5.924-2.39 7.675-1.57 1.75-3.881 2.625-6.933 2.625-3.03 0-5.33-.875-6.9-2.625-1.572-1.75-2.357-4.309-2.357-7.675V.118h3.871Z"/>
          </svg>
          <span className="font-bold text-xl uppercase tracking-widest text-white">NEXUS</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-2 group cursor-pointer">
            <span className="text-sm font-medium uppercase tracking-widest group-hover:text-gray-300 transition-colors text-white">Let&apos;s Talk</span>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          </div>
          <button className="text-sm font-medium uppercase tracking-widest hover:text-gray-300 transition-colors text-white">
            Menu
          </button>
        </div>
      </header>

      {/* HERO SECTION - Lusion Style (Minimal, Cinematic) */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
        
        {/* Layer 1: 3D Environment (Real 3D Model) */}
        <div className="absolute inset-0 z-10">
          <ThreeDPosterWebGL />
        </div>
        
        {/* Layer 2: Typography Overlay with Parallax */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none mix-blend-difference text-[#ccff00]">
           <h1 className="text-[60px] md:text-[120px] font-black uppercase leading-[0.8] tracking-tighter text-center mix-blend-difference">
             DISCONNECTED<br/><span className="text-white">THE INTERNET</span>
           </h1>
           <p className="mt-8 text-white max-w-lg text-center opacity-80 text-sm">
             We create 3D visual storytelling and interactive AI batch generation experiences that help creators stand out.
           </p>
        </div>

        {/* Footer info in Hero */}
        <div className="absolute bottom-8 left-8 z-20 mix-blend-difference text-white max-w-xs pointer-events-auto">
          <p className="text-xs uppercase tracking-widest font-bold mb-2">01 // Project Nexus</p>
          <p className="text-sm font-light leading-relaxed text-gray-300">
             We design and produce 3D visual storytelling, immersive websites, and interactive digital experiences.
          </p>
        </div>
        
      </section>

      {/* CALL TO ACTION */}
      <section className="h-screen bg-black flex flex-col items-center justify-center text-center p-6 relative">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold mb-8 text-white/50">Is Your Big Idea Ready to Go Wild?</div>
        <h2 className="text-6xl md:text-[120px] font-black uppercase leading-none tracking-tighter hover:scale-105 transition-transform duration-500 cursor-pointer">
          LET&apos;S WORK<br/>TOGETHER!
        </h2>
        
        <div className="mt-16 flex items-center gap-4">
          <Link href="/dashboard" passHref>
            <Button variant="default" size="lg" className="bg-white text-black hover:bg-gray-200 rounded-full px-8 uppercase tracking-widest text-xs font-bold h-14 transition-colors">
              Launch Core
            </Button>
          </Link>
        </div>
      </section>

    </div>
  )
}
