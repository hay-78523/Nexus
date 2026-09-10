'use client'

import { useState } from 'react'
import { login, signup, signInWithGoogle } from './actions'

export default function AuthForm({ error }: { error?: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const isLogin = mode === 'login'

  return (
    <>
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500 text-red-500 text-sm font-mono text-center">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-6" action={isLogin ? login : signup}>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Email Address</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            className="bg-transparent border-b border-white/20 px-0 py-2 text-white focus:outline-none focus:border-[#00ffff] transition-colors font-mono"
            placeholder="operator@nexus.com"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Passcode</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            className="bg-transparent border-b border-white/20 px-0 py-2 text-white focus:outline-none focus:border-[#00ffff] transition-colors font-mono"
            placeholder="••••••••"
          />
        </div>

        {!isLogin && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Full Name</label>
              <input 
                id="full_name" 
                name="full_name" 
                type="text" 
                required={!isLogin}
                className="bg-transparent border-b border-white/20 px-0 py-2 text-white focus:outline-none focus:border-[#00ffff] transition-colors font-mono"
                placeholder="John Doe"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Phone Number</label>
              <input 
                id="phone_number" 
                name="phone_number" 
                type="tel" 
                required={!isLogin}
                className="bg-transparent border-b border-white/20 px-0 py-2 text-white focus:outline-none focus:border-[#00ffff] transition-colors font-mono"
                placeholder="+84 987 654 321"
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold h-12 transition-colors flex items-center justify-center"
          >
            {isLogin ? 'Initialize Uplink (Login)' : 'Request Access (Register)'}
          </button>
          
          <button 
            type="button" 
            onClick={() => setMode(isLogin ? 'register' : 'login')}
            className="w-full bg-transparent text-white/50 hover:text-white uppercase tracking-widest text-[10px] font-bold h-8 transition-colors flex items-center justify-center"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest">
          <span className="bg-black/50 px-2 text-white/50 backdrop-blur-xl">Or continue with</span>
        </div>
      </div>

      <form action={signInWithGoogle}>
        <button 
          type="submit" 
          className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10 uppercase tracking-widest text-xs font-bold h-12 transition-colors flex items-center justify-center gap-3"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Authenticate via Google
        </button>
      </form>
    </>
  )
}
