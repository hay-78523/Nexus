/**
 * Cấu hình Fal.ai dùng chung cho cả route API và trang bảng điều khiển.
 *
 * Để ở file riêng vì file route của Next.js chỉ được phép xuất ra các hàm xử
 * lý HTTP; xuất thêm thứ khác là build hỏng.
 *
 * MỌI TÊN TRƯỜNG ĐỀU ĐẶT Ở BIẾN MÔI TRƯỜNG, và trừ trường ảnh nhân vật thì
 * không cái nào có giá trị mặc định. Lý do: mỗi model của Fal.ai đặt tên
 * trường một khác, mà gửi kèm một trường lạ thì nhiều model từ chối nguyên cả
 * yêu cầu. Chưa cấu hình thì không gửi — cách duy nhất an toàn khi chưa thử
 * được model nào.
 */

export const DEFAULT_MODEL = process.env.FAL_MODEL ?? 'fal-ai/ip-adapter-face-id'
export const CHARACTER_FIELD = process.env.FAL_IMAGE_FIELD ?? 'image_url'
export const STYLE_FIELD = process.env.FAL_STYLE_FIELD ?? ''
export const POSE_FIELD = process.env.FAL_POSE_FIELD ?? ''
export const NUM_IMAGES_FIELD = process.env.FAL_NUM_IMAGES_FIELD ?? ''

export const MAX_NUM_IMAGES = 10

/**
 * Vercel chặn thân yêu cầu lớn hơn khoảng 4,5MB. Ba ảnh nhúng thẳng dạng
 * base64 vượt ngưỡng đó rất dễ, nên chặn sớm để báo lỗi rõ ràng thay vì để hạ
 * tầng cắt ngang bằng một lỗi khó hiểu.
 *
 * Cách chữa tận gốc là tải ảnh lên kho lưu trữ trước rồi chỉ gửi đường dẫn —
 * việc đó thuộc phần lưu trữ, chưa làm.
 */
export const MAX_TOTAL_CHARS = 4_000_000 // ~3MB tổng cả ba ảnh

/**
 * Danh sách model được phép gọi. Người dùng chọn model nào là chọn mức giá đó,
 * nên không nhận một chuỗi tuỳ ý gửi lên — chỉ nhận tên nằm trong danh sách.
 */
export function allowedModels(): string[] {
  const extra = (process.env.FAL_MODELS ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  return Array.from(new Set([DEFAULT_MODEL, ...extra]))
}
