import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Gọi Fal.ai để sinh ảnh. Đây là bản demo một ảnh mỗi lượt, dùng để kiểm
 * chứng chất lượng trước khi xây hàng đợi và phần bán hàng.
 *
 * Ba thứ đặt ở biến môi trường vì mỗi model của Fal.ai một khác, và trang
 * model của họ mới là nguồn đúng về tên trường:
 *   FAL_KEY          khoá API, chỉ đọc ở phía máy chủ
 *   FAL_MODEL        đường dẫn model, ví dụ fal-ai/ip-adapter-face-id
 *   FAL_IMAGE_FIELD  tên trường nhận ảnh gốc, xem ở tab API của model
 */

const MODEL = process.env.FAL_MODEL ?? 'fal-ai/ip-adapter-face-id'
const IMAGE_FIELD = process.env.FAL_IMAGE_FIELD ?? 'image_url'

/** Ảnh gửi lên dạng base64 phình khoảng 4/3 so với file gốc. */
const MAX_IMAGE_CHARS = 8_000_000 // ~6MB file gốc

export async function POST(request: Request) {
  // --- 1. Chỉ người đã đăng nhập mới gọi được ---------------------------
  // Mỗi lượt gọi là tiền thật trong tài khoản Fal.ai, nên không để ngỏ.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để sinh ảnh.' }, { status: 401 })
  }

  // --- 2. Khoá phải có sẵn ở phía máy chủ -------------------------------
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return NextResponse.json(
      { error: 'Máy chủ chưa cấu hình FAL_KEY. Thêm vào .env.local rồi khởi động lại.' },
      { status: 501 }
    )
  }

  // --- 3. Đọc và kiểm tra dữ liệu gửi lên -------------------------------
  let body: { prompt?: unknown; image?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Không đọc được dữ liệu gửi lên. Ảnh có thể quá lớn.' },
      { status: 400 }
    )
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  const image = typeof body.image === 'string' ? body.image : ''

  if (!prompt || !image) {
    return NextResponse.json({ error: 'Thiếu ảnh gốc hoặc mô tả.' }, { status: 400 })
  }

  if (image.length > MAX_IMAGE_CHARS) {
    return NextResponse.json(
      { error: 'Ảnh quá lớn. Chọn ảnh dưới khoảng 6MB.' },
      { status: 413 }
    )
  }

  // --- 4. Gọi Fal.ai ----------------------------------------------------
  try {
    const falResponse = await fetch(`https://fal.run/${MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        [IMAGE_FIELD]: image,
      }),
    })

    const raw = await falResponse.text()

    if (!falResponse.ok) {
      // Trả nguyên văn lỗi của Fal.ai. Sai tên model hay sai tên trường ảnh
      // thì chính họ sẽ nói tên đúng là gì — đỡ phải đoán.
      console.error('Fal.ai trả lỗi', falResponse.status, raw)
      return NextResponse.json(
        {
          error: `Fal.ai từ chối (HTTP ${falResponse.status}). Model đang gọi: ${MODEL}, trường ảnh: ${IMAGE_FIELD}.`,
          falResponse: raw.slice(0, 2000),
        },
        { status: 502 }
      )
    }

    const data = JSON.parse(raw)

    // Mỗi model trả về một hình dạng khác nhau. Thử vài chỗ hay gặp, không
    // thấy thì trả cả phản hồi để xem tận mắt nó nằm ở đâu.
    const imageUrl =
      data?.images?.[0]?.url ??
      data?.image?.url ??
      data?.output?.[0]?.url ??
      (typeof data?.image === 'string' ? data.image : null)

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: 'Fal.ai chạy xong nhưng không tìm thấy đường dẫn ảnh trong phản hồi.',
          falResponse: raw.slice(0, 2000),
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ imageUrl })
  } catch (error: unknown) {
    console.error('Lỗi khi gọi Fal.ai:', error)
    const message = error instanceof Error ? error.message : 'Không rõ nguyên nhân'
    return NextResponse.json({ error: `Không gọi được Fal.ai: ${message}` }, { status: 502 })
  }
}
