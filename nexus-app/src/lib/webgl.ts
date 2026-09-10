/**
 * Máy có dựng được WebGL không. Kiểm tra trước khi mount cảnh 3D, vì
 * three.js sẽ ném lỗi nếu không tạo được ngữ cảnh — máy văn phòng đời cũ,
 * máy ảo, hoặc trình duyệt bị tắt tăng tốc phần cứng đều rơi vào trường
 * hợp này.
 */
let cached: boolean | undefined

export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false
  if (cached !== undefined) return cached
  try {
    const canvas = document.createElement('canvas')
    cached = Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
    )
  } catch {
    cached = false
  }
  return cached
}

/** Dùng với useSyncExternalStore — kết quả không bao giờ đổi nên không cần theo dõi. */
export function subscribeNever(): () => void {
  return () => {}
}
