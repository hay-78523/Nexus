-- ============================================================================
-- <SỐ>_<tên_ngắn_gọn>.sql
--
-- MỤC ĐÍCH   Một câu. File này thay đổi cái gì.
-- VÌ SAO     Một hai câu. Vì sao cần thay đổi đó.
-- RỦI RO     Có xoá dữ liệu không, có khoá bảng lâu không, chạy lại được không.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bảng và cột
-- ---------------------------------------------------------------------------

-- create table if not exists public.ten_bang (
--   id         uuid primary key default gen_random_uuid(),
--   user_id    uuid not null references auth.users (id) on delete cascade,
--   created_at timestamptz not null default now()
-- );

-- ---------------------------------------------------------------------------
-- 2. RLS và policy
--
-- ĐỂ CHUNG FILE VỚI CÂU TẠO BẢNG, ĐỪNG TÁCH RA FILE RIÊNG.
-- Bảng mới mặc định TẮT RLS. Tách ra file riêng là sớm muộn cũng có lúc tạo
-- bảng xong quên chạy file policy — mà lỗ hổng đó không báo lỗi gì cả, mọi
-- thứ vẫn chạy bình thường. Đi chung một file thì không quên được.
-- ---------------------------------------------------------------------------

-- alter table public.ten_bang enable row level security;
--
-- drop policy if exists ten_bang_select on public.ten_bang;
-- create policy ten_bang_select on public.ten_bang
--   for select to authenticated
--   using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Hàm và trigger, nếu có
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4. Câu kiểm tra — chạy xong nhìn vào đây để biết đúng hay sai
-- ---------------------------------------------------------------------------

-- select ... ;
