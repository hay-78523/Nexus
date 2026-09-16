-- ============================================================================
-- Nexus — dọn sạch policy của bảng profiles rồi dựng lại đúng hai cái cần
--
-- VÌ SAO CÓ FILE NÀY
-- File 0001 chỉ gỡ policy theo đúng hai cái tên nó tự đặt. Bảng profiles thực
-- tế đang có ba policy, cái thứ ba không rõ nguồn gốc. Policy trên cùng một
-- bảng cộng dồn theo kiểu "hoặc", nên chỉ cần một policy rộng rãi là vô hiệu
-- hoá mọi policy chặt chẽ còn lại. Không gỡ nó thì RLS bật cũng như không.
--
-- File này tự đứng được: chạy riêng nó cũng đủ khoá bảng profiles, không cần
-- 0001 chạy trước.
--
-- MUỐN XEM TRƯỚC CÁI GÌ SẼ BỊ GỠ thì chạy câu này trước:
--
--   select policyname, cmd, qual, with_check
--     from pg_policies
--    where schemaname = 'public' and tablename = 'profiles';
--
-- An toàn khi chạy lại nhiều lần. Không đụng tới dữ liệu, không đổi cột role.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Hàm kiểm tra quyền admin
--
-- Bắt buộc security definer: viết thẳng câu truy vấn profiles vào policy của
-- chính bảng profiles sẽ gây đệ quy vô hạn.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid()
       and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Gỡ sạch mọi policy đang có trên bảng
--
-- Gỡ hết rồi dựng lại là cách duy nhất chắc chắn, vì ta không biết tên những
-- policy được tạo từ trước. Tên từng cái bị gỡ sẽ hiện ở tab Messages.
-- ---------------------------------------------------------------------------

do $$
declare
  pol record;
  dem int := 0;
begin
  for pol in
    select policyname
      from pg_policies
     where schemaname = 'public'
       and tablename  = 'profiles'
  loop
    raise notice 'Go policy cu: %', pol.policyname;
    execute format('drop policy %I on public.profiles', pol.policyname);
    dem := dem + 1;
  end loop;

  raise notice 'Da go tong cong % policy', dem;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Dựng lại đúng hai policy cần thiết
--
-- Không khai báo policy cho insert và delete, nghĩa là người dùng cuối không
-- thể tự thêm hay xoá hồ sơ. Trigger sinh hồ sơ khi đăng ký chạy dưới quyền
-- chủ bảng nên vẫn chèn được.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Đọc: chỉ dòng của chính mình, trừ admin thì đọc được tất cả
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Sửa: cũng chỉ dòng của chính mình. with_check chặn việc sửa xong lại đẩy
-- dòng đó sang thuộc về người khác.
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

grant select, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Chặn tự nâng quyền
--
-- RLS không làm được việc này: mệnh đề with check không đọc được giá trị cũ
-- của dòng nên không so sánh được role trước và sau. Phải dùng trigger.
-- ---------------------------------------------------------------------------

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() rỗng nghĩa là lệnh không đến từ người dùng cuối: SQL Editor,
  -- service_role, hoặc chính file migration này. Những đường đó vốn tin cậy.
  if auth.uid() is null then
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Khong duoc tu doi quyen han';
  end if;

  if new.id is distinct from old.id then
    raise exception 'Khong duoc doi id ho so';
  end if;

  return new;
end $$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
-- 5. Kiểm tra lại sau khi chạy
-- ---------------------------------------------------------------------------

select
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'profiles')          as so_policy_con_lai,
  (select string_agg(policyname, ', ' order by policyname)
     from pg_policies
    where schemaname = 'public' and tablename = 'profiles')          as ten_policy,
  (select count(*) from pg_proc where proname = 'is_admin')          as ham_is_admin,
  (select count(*) from pg_trigger
    where tgname = 'profiles_guard_role')                            as trigger_chan_nang_quyen;
