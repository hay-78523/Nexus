-- ============================================================================
-- Nexus — bảo đảm mọi tài khoản đều có hồ sơ, và chỉ định ai là admin
--
-- MỤC ĐÍCH
-- Dựng lại trigger sinh hồ sơ khi có tài khoản mới, bù hồ sơ cho những tài
-- khoản đã tồn tại mà chưa có, rồi nâng đúng một tài khoản lên quyền admin.
--
-- VÌ SAO CÓ FILE NÀY
-- Trigger sinh hồ sơ nằm trong file 0001, mà 0001 đã bị đánh dấu thay thế và
-- chưa từng chạy. File 0002 — file thực sự đã chạy — chỉ lo phần policy và
-- chặn tự nâng quyền, hoàn toàn không đụng tới trigger đó. Nghĩa là rất có
-- thể database hiện không có trigger nào sinh hồ sơ cả.
--
-- Chuyện này im lặng cho tới khi có tài khoản mới: đăng nhập thì được, nhưng
-- middleware đọc bảng profiles không thấy dòng nào nên xếp người dùng vào
-- quyền thấp nhất. Đây đúng là triệu chứng "đăng nhập admin vẫn ra user" đã
-- gặp trước đây.
--
-- Tài khoản admin không bị ảnh hưởng vì nó có từ trước và đã có hồ sơ. Tài
-- khoản mới tạo cho Thịnh thì rơi đúng vào lỗ hổng này.
--
-- RỦI RO
-- Thấp. Không xoá gì, không đụng tới dữ liệu đang có. Phần bù hồ sơ chỉ chèn
-- cho tài khoản chưa có dòng nào, nên hồ sơ admin đang có vẫn nguyên vẹn.
-- Phần nâng quyền admin có ghi đè cột role, nên phải sửa đúng email ở mục 4
-- trước khi chạy.
--
-- An toàn khi chạy lại nhiều lần.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Xem hiện trạng trước khi sửa
--
-- Kết quả hiện ở bảng bên dưới. Nếu trigger_sinh_ho_so = 0 thì đúng như dự
-- đoán: database chưa có trigger nào. so_tai_khoan là số tài khoản thật, dùng
-- để đối chiếu với con số "Total: N users (estimated)" trên giao diện Supabase
-- — con số đó lấy từ thống kê ước lượng của Postgres nên hay sai sau khi xoá
-- tài khoản, không phải số thật.
-- ---------------------------------------------------------------------------

select
  (select count(*) from auth.users)                        as so_tai_khoan,
  (select count(*) from public.profiles)                   as so_ho_so,
  (select count(*) from pg_trigger
    where tgname = 'on_auth_user_created')                 as trigger_sinh_ho_so;

-- ---------------------------------------------------------------------------
-- 2. Dựng lại hàm và trigger sinh hồ sơ
--
-- Bắt buộc security definer: trigger chạy dưới phiên của người vừa đăng ký,
-- mà người đó chưa có quyền chèn vào profiles.
--
-- Trang đăng ký của ứng dụng gửi full_name và phone_number qua options.data
-- của signUp, Supabase cất vào raw_user_meta_data. Tài khoản tạo tay bằng nút
-- Add user trên bảng điều khiển thì không có hai trường đó, nên cột tên sẽ
-- trống — xử lý ở mục 5.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone_number, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone_number', ''),
    'user'
  )
  on conflict (id) do update
     set email        = excluded.email,
         full_name    = coalesce(profiles.full_name, excluded.full_name),
         phone_number = coalesce(profiles.phone_number, excluded.phone_number);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Bù hồ sơ cho tài khoản đã tồn tại
--
-- Chỉ chèn cho tài khoản chưa có dòng nào trong profiles. Ai đã có hồ sơ thì
-- không bị đụng tới, kể cả cột role — nên hồ sơ admin hiện tại vẫn y nguyên.
-- Thực tế lần chạy này chỉ có tài khoản của Thịnh được chèn.
-- ---------------------------------------------------------------------------

insert into public.profiles (id, email, full_name, phone_number, role)
select u.id,
       u.email,
       nullif(u.raw_user_meta_data ->> 'full_name', ''),
       nullif(u.raw_user_meta_data ->> 'phone_number', ''),
       'user'
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.id is null;

-- ---------------------------------------------------------------------------
-- 4. Chỉ định tài khoản admin
--
-- SỬA EMAIL Ở ĐÂY nếu tài khoản quản trị không phải admin@nexus.com.
--
-- Mọi tài khoản khác bị hạ về 'user'. Làm vậy là cố ý: nó bảo đảm chỉ có đúng
-- một admin, thay vì để sót quyền admin trên một tài khoản cũ nào đó.
--
-- Mệnh đề where cuối làm câu lệnh chỉ ghi vào dòng nào thực sự sai quyền.
-- admin@nexus.com vốn đã mang quyền admin nên sẽ không bị đụng tới.
-- ---------------------------------------------------------------------------

update public.profiles
   set role = case when email = 'admin@nexus.com' then 'admin' else 'user' end
 where role is distinct from
       (case when email = 'admin@nexus.com' then 'admin' else 'user' end);

-- ---------------------------------------------------------------------------
-- 5. Điền tên hiển thị
--
-- Tài khoản tạo bằng nút Add user không kèm tên nên cột full_name trống, và
-- trang quản trị sẽ hiện ô trống.
--
-- Chỉ ghi khi ô tên đang trống, nên chạy lại nhiều lần cũng không đè lên tên
-- mà người dùng tự sửa sau này trong ứng dụng.
-- ---------------------------------------------------------------------------

update public.profiles
   set full_name = 'Thịnh'
 where email = 'thinh123@gmail.com'
   and (full_name is null or full_name = '');

-- Tên cho tài khoản quản trị: sửa rồi bỏ dấu chú thích nếu muốn điền.
-- update public.profiles
--    set full_name = 'Quản trị'
--  where email = 'admin@nexus.com'
--    and (full_name is null or full_name = '');

-- ---------------------------------------------------------------------------
-- 6. Kiểm tra lại sau khi chạy
--
-- Mong đợi: so_tai_khoan bằng so_ho_so, trigger_sinh_ho_so bằng 1, và bảng
-- liệt kê bên dưới có đúng một dòng mang quyền admin.
-- ---------------------------------------------------------------------------

select
  (select count(*) from auth.users)                        as so_tai_khoan,
  (select count(*) from public.profiles)                   as so_ho_so,
  (select count(*) from pg_trigger
    where tgname = 'on_auth_user_created')                 as trigger_sinh_ho_so,
  (select count(*) from public.profiles where role = 'admin') as so_admin;

select id, email, coalesce(full_name, '(chua co ten)') as ten, role
  from public.profiles
 order by role, email;
