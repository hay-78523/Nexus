'use client'

import { useState } from 'react'
import { login, signup, signInWithGoogle } from './actions'

export default function AuthForm({ error }: { error?: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const isLogin = mode === 'login'

  return (
    <>
      {error && (
        <div className="mb-6 border-l-2 border-red-500 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-300">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-6" action={isLogin ? login : signup}>
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            className="border-b border-white/15 bg-transparent px-0 py-2.5 font-mono text-white transition-colors placeholder:text-white/20 focus:border-acid focus:outline-none"
            placeholder="ten@starlight.vn"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Mật khẩu</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            className="border-b border-white/15 bg-transparent px-0 py-2.5 font-mono text-white transition-colors placeholder:text-white/20 focus:border-acid focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {!isLogin && (
          <>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Họ và tên</label>
              <input 
                id="full_name" 
                name="full_name" 
                type="text" 
                required={!isLogin}
                className="border-b border-white/15 bg-transparent px-0 py-2.5 font-mono text-white transition-colors placeholder:text-white/20 focus:border-acid focus:outline-none"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Số điện thoại</label>
              <input 
                id="phone_number" 
                name="phone_number" 
                type="tel" 
                required={!isLogin}
                className="border-b border-white/15 bg-transparent px-0 py-2.5 font-mono text-white transition-colors placeholder:text-white/20 focus:border-acid focus:outline-none"
                placeholder="0905 123 456"
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <button 
            type="submit" 
            className="flex h-13 w-full items-center justify-center border border-acid bg-acid font-black uppercase tracking-[0.2em] text-black transition-all hover:tracking-[0.3em]"
          >
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
          
          <button 
            type="button" 
            onClick={() => setMode(isLogin ? 'register' : 'login')}
            className="flex h-8 w-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-acid"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-ink-panel px-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">Hoặc</span>
        </div>
      </div>

      <form action={signInWithGoogle}>
        <button 
          type="submit" 
          className="flex h-12 w-full items-center justify-center gap-3 border border-white/15 bg-transparent font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 transition-colors hover:border-white/40 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Tiếp tục với Google
        </button>
      </form>
    </>
  )
}
