/**
 * Nền dùng chung cho mọi trang phía trong: lưới kỹ thuật, quầng sáng xanh
 * chanh và một lớp nhiễu hạt. Đặt ở dưới cùng, không bắt sự kiện chuột.
 */
export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 nx-grain" aria-hidden>
      <div className="absolute inset-0 nx-grid" />
      <div className="absolute inset-0 nx-glow" />
      <div className="absolute inset-x-0 bottom-0 h-[45vh] bg-gradient-to-t from-black to-transparent" />
    </div>
  )
}
