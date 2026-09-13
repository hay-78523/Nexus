-- ============================================================================
-- Nexus — bảng profiles, tự sinh hồ sơ khi đăng ký, và khoá quyền bằng RLS
--
-- Chạy trong Supabase SQL Editor. An toàn khi chạy lại nhiều lần, và không
-- xoá dữ liệu sẵn có.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bảng
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  phone_number text,
  role         text not null default 'user',
  created_at   timestamptz not null default now()
);

-- Bảng có thể đã được tạo tay từ trước và thiếu cột
alter table public.profiles add column if not exists email        text;
alter table public.profiles add column if not exists full_name    text;
alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists role         text;
alter table public.profiles add column if not exists created_at   timestamptz not null default now();

-- Dọn dữ liệu cũ trước khi siết ràng buộc, nếu không câu set not null sẽ lỗi
update public.profiles
   set role = 'user'
 where role is null
    or role not in ('user', 'admin');

alter table public.profiles alter column role set default 'user';
alter table public.profiles alter column role set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Hàm kiểm tra quyền admin
--
-- Bắt buộc phải là security definer. Nếu viết thẳng câu truy vấn profiles vào
-- trong policy của chính bảng profiles thì Postgres sẽ đệ quy vô hạn.
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
-- 3. Tự sinh hồ sơ khi có người đăng ký
--
-- Trang đăng ký gửi full_name và phone_number qua options.data của signUp,
-- Supabase cất vào raw_user_meta_data.
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

-- Bù hồ sơ cho những tài khoản đã đăng ký trước khi có trigger.
-- Đây nhiều khả năng là lý do tài khoản admin đang không có dòng nào trong
-- profiles, nên middleware đọc ra không phải admin.
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
-- 4. Chặn tự nâng quyền
--
-- RLS không làm được việc này: mệnh đề with check không đọc được giá trị cũ
-- của dòng, nên không so sánh được role trước và sau. Phải dùng trigger.
-- ---------------------------------------------------------------------------

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() rỗng nghĩa là lệnh không đến từ người dùng cuối: SQL Editor,
  -- service_role, hoặc chính file migration này. Những đường đó vốn đã tin cậy.
  if auth.uid() is null then
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Không được tự đổi quyền hạn';
  end if;

  if new.id is distinct from old.id then
    raise exception 'Không được đổi id hồ sơ';
  end if;

  return new;
end $$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
-- 5. Bật RLS
--
-- Không khai báo policy cho insert và delete, nghĩa là người dùng cuối không
-- thể thêm hay xoá hồ sơ. Trigger ở mục 3 chạy dưới quyền chủ bảng nên vẫn
-- chèn được.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

grant select, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Nâng tài khoản của bạn lên admin
--
-- Sửa email cho đúng rồi bỏ dấu chú thích và chạy. Đây là lý do tài khoản
-- admin đang hiển thị là user.
-- ---------------------------------------------------------------------------

-- update public.profiles set role = 'admin' where email = 'admin@nexus.com';

-- Kiểm tra lại sau khi chạy:
-- select id, email, full_name, role from public.profiles order by role;
