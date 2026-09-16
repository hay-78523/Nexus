# Migration — quy ước và sổ theo dõi

Thư mục này là **bản ghi mọi thay đổi cấu trúc cơ sở dữ liệu**, theo thứ tự
thời gian. Đọc từ trên xuống là dựng lại được database từ con số không.

## Sổ theo dõi: file nào đã chạy trên database thật

Supabase không tự ghi lại việc này khi ta dán tay vào SQL Editor, nên phải
ghi ở đây. **Chạy xong file nào thì cập nhật bảng này ngay.**

| File | Đã chạy | Ghi chú |
|---|---|---|
| `0001_profiles_rls.sql` | ❌ Không chạy | Đã bị `0002` thay thế. Đừng chạy. |
| `0002_profiles_policy_reset.sql` | ✅ 16.09.2026 | Kết quả: 2 policy, is_admin có, trigger chặn nâng quyền có |
| `0003_backfill_full_name.sql` | ⬜ Chưa | Không còn cần gấp: hai tài khoản hiện tại tạo bằng nút Add user nên `auth.users` không có tên để chép sang. Vẫn hữu ích cho tài khoản đăng ký qua trang web. |
| `0004_bao_dam_ho_so.sql` | ⬜ Chưa | **Cần chạy.** Dựng trigger sinh hồ sơ mà `0002` không có, bù hồ sơ cho tài khoản mới của Thịnh, chỉ định admin, điền tên. Sửa email ở mục 4 trước khi chạy. |

Ngoài ra có một số câu SQL từng gõ tay thẳng vào SQL Editor, không qua file:
thêm cột `email` vào `profiles`, chép email từ `auth.users`, và đặt
`role = 'admin'` cho `admin@nexus.com`. Ghi lại ở đây để sau này còn biết vì
sao database có những thứ không thấy trong file nào.

## Quy ước đặt tên

```
0004_ten_ngan_gon.sql
^^^^ ^^^^^^^^^^^^^^
 |   việc file này làm, viết không dấu, ngăn bằng gạch dưới
 số thứ tự bốn chữ số, tăng dần, không nhảy cóc
```

Bắt đầu file mới bằng cách chép `_TEMPLATE.sql`.

## Bốn luật

**1. Không bao giờ sửa file đã chạy.**
File đã chạy trên database thật thì nó là quá khứ. Muốn đổi gì thì viết file
mới. Sửa file cũ là máy anh và database thật lệch nhau mà không ai biết.

**2. Một file làm một việc.**
Sau này đọc lại tên file là biết ngay nó làm gì, và lỡ có sai thì gỡ lại
cũng gọn.

**3. RLS và policy nằm chung file với câu tạo bảng.**
Nghe thì ngược với việc chia nhỏ, nhưng bảng mới mặc định **tắt** RLS. Tách
policy ra file riêng là sớm muộn cũng có lúc tạo bảng xong quên chạy file
policy — mà lỗ hổng đó không báo lỗi gì cả, mọi thứ vẫn chạy bình thường.
Đây là đánh đổi có chủ đích: hy sinh sự gọn gàng để lấy sự an toàn.

**4. File nào cũng phải chạy lại được nhiều lần.**
Dùng `if not exists` khi tạo, `drop ... if exists` trước khi tạo lại. Vì sẽ
có lúc không nhớ đã chạy chưa, và chạy lại phải vô hại.

## Cách chạy một file

1. Mở Supabase → **SQL Editor** → bấm **+** mở query trống
2. Chép toàn bộ nội dung file, dán vào, bấm **Run**
3. Xem tab **Results** đúng như phần kiểm tra cuối file mô tả
4. Xem tab **Messages** nếu file có in thông báo
5. **Quay lại đây tick vào bảng sổ theo dõi ở trên**

Bước 5 hay bị quên nhất, mà quên là hỏng cả hệ thống — vài tuần sau không ai
biết database đang ở trạng thái nào.

## Sau này nên chuyển sang Supabase CLI

Cách dán tay chỉ ổn khi còn ít file. Khi nhiều lên thì dùng CLI:

```bash
supabase migration new ten_viec      # tạo file đúng quy ước
supabase db push                     # đẩy những file chưa chạy
```

CLI **tự ghi nhớ file nào đã chạy** trong chính database, nên không cần sổ
theo dõi thủ công ở trên, và không bao giờ chạy nhầm hai lần hay bỏ sót.

Chưa cần làm ngay. Khi nào bắt đầu có bảng thứ ba thứ tư thì chuyển.
