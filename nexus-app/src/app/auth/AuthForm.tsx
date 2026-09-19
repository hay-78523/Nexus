'use client'

import { useState } from 'react'
import { login, signup } from './actions'

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
            placeholder="email@cua-ban.com"
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

    </>
  )
}
