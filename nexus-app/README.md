# Nexus App

Web app của **NEXUS** — nền tảng AI Batch Generation (xem `../Bao_Cao_AI_Flow.md` cho bản kiến trúc tổng thể).

## Stack

| Lớp | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Giao diện | Tailwind CSS v4 + shadcn/ui |
| 3D | three.js + @react-three/fiber / drei / postprocessing |
| Auth & DB | Supabase (`@supabase/ssr`) |
| AI Engine | Fal.ai hoặc Replicate — **chưa nối** |

## Chạy local

```bash
npm install
cp .env.example .env.local   # rồi điền key Supabase vào
npm run dev
```

Mở http://localhost:3000.

## Biến môi trường

Xem `.env.example`. Bắt buộc phải có `NEXT_PUBLIC_SUPABASE_URL` và
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, nếu không middleware sẽ crash ở mọi request.

## Cấu trúc

```
src/
├── app/
│   ├── page.tsx                  Landing 3D
│   ├── auth/                     Đăng nhập / đăng ký / Google OAuth
│   ├── dashboard/                Khu vực người dùng + module AI
│   ├── dashboard/admin/          Admin hub + danh sách user
│   └── api/generate/route.ts     Endpoint sinh ảnh (đang trả 501)
├── components/                   AIGenerator, 3D, shadcn ui/
├── utils/supabase/               client / server / middleware
└── middleware.ts                 Bảo vệ route + phân quyền admin
```

## Phân quyền

`src/middleware.ts` chạy trên `/dashboard/*` và `/auth/*`:

1. Chưa đăng nhập mà vào `/dashboard` → đá về `/auth`
2. Đã đăng nhập mà vào `/auth` → đá về `/dashboard`
3. Vào `/dashboard/admin` → phải có `profiles.role = 'admin'`

> **Quan trọng:** phân quyền dựa hoàn toàn vào cột `role` của bảng `profiles`
> trên Supabase. Phải bật RLS và chặn user tự `UPDATE` cột `role` của chính
> mình, nếu không ai cũng tự nâng được lên admin. Schema/RLS hiện **chưa có**
> trong repo.

## Việc còn dang dở

- [ ] Nối Fal.ai / Replicate vào `/api/generate` (hiện trả về 501)
- [ ] Batch generation — hiện `AIGenerator` mới chạy 1 ảnh/lượt, chưa có hàng đợi
- [ ] IP-Adapter FaceID (giữ mặt) và Style Reference (giữ phong cách)
- [ ] SQL migration + RLS policy cho bảng `profiles`
- [ ] Thiếu ảnh `public/cyber_head_bg.jpg` mà `dashboard/page.tsx` đang trỏ tới
- [ ] `src/lib/utils.ts` đang dùng package `cn`, nên đổi sang `clsx` + `tailwind-merge` chuẩn shadcn
- [ ] Next 16 báo `middleware.ts` đã deprecated, cần migrate sang `proxy.ts`
