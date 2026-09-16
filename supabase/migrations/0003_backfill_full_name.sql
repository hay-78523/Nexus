-- ============================================================================
-- 0003_backfill_full_name.sql
--
-- MỤC ĐÍCH   Chép họ tên từ auth.users sang profiles cho các tài khoản cũ.
-- VÌ SAO     Trigger sinh hồ sơ chỉ chạy cho người đăng ký MỚI. Hai tài khoản
--            có sẵn từ trước nên cột full_name đang rỗng, bảng quản trị hiện
--            dấu gạch ngang. Tài khoản Google thực tế có tên trong auth.users,
--            chỉ là chưa ai chép sang.
-- RỦI RO     Không. Chỉ điền vào ô đang rỗng, không ghi đè tên đã có, không
--            đụng tới cột role. Chạy lại nhiều lần vẫn cho cùng kết quả.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bù dữ liệu
--
-- Google lúc trả về khoá 'full_name', lúc trả 'name', tuỳ cấu hình. Lấy cả
-- hai, cái nào có trước thì dùng.
-- ---------------------------------------------------------------------------

update public.profiles p
   set full_name = coalesce(
         nullif(u.raw_user_meta_data ->> 'full_name', ''),
         nullif(u.raw_user_meta_data ->> 'name', '')
       )
  from auth.users u
 where p.id = u.id
   and (p.full_name is null or p.full_name = '');

-- ---------------------------------------------------------------------------
-- 2. Kiểm tra
--
-- Kỳ vọng: tài khoản Google hiện đúng tên, tài khoản tạo tay vẫn rỗng vì
-- bản thân auth.users cũng không có tên cho nó.
-- ---------------------------------------------------------------------------

select email, full_name, role
  from public.profiles
 order by role, email;
