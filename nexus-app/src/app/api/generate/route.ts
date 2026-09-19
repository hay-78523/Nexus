import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  DEFAULT_MODEL,
  CHARACTER_FIELD,
  STYLE_FIELD,
  POSE_FIELD,
  NUM_IMAGES_FIELD,
  MAX_NUM_IMAGES,
  MAX_TOTAL_CHARS,
  allowedModels,
  DEMO_MODE,
  demoImageUrls,
} from '@/lib/fal'

/**
 * Gọi Fal.ai để sinh ảnh.
 *
 * Bản này nhận ba loại ảnh tham chiếu (nhân vật / phong cách / dáng - bố cục)
 * theo đúng mục 3 của bản mô tả chức năng, cho chọn model theo từng lượt chạy
 * theo mục 2, và trả về mọi ảnh mà Fal.ai sinh ra chứ không chỉ tấm đầu.
 *
 * Tên trường và danh sách model nằm ở src/lib/fal.ts.
 */

type RefImages = {
  character: string
  style: string
  pose: string
}

/** Đọc một trường chuỗi, trả về chuỗi rỗng nếu không phải chuỗi. */
function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * Mỗi model trả về một hình dạng khác nhau. Gom mọi đường dẫn ảnh tìm được,
 * không chỉ tấm đầu: đã trả tiền cho tất cả thì phải hiện ra tất cả.
 */
function collectImageUrls(data: unknown): string[] {
  const urls: string[] = []

  const push = (value: unknown) => {
    if (typeof value === 'string' && value) urls.push(value)
    else if (value && typeof value === 'object') {
      const url = (value as { url?: unknown }).url
      if (typeof url === 'string' && url) urls.push(url)
    }
  }

  const root = data as Record<string, unknown> | null
  if (!root) return urls

  for (const key of ['images', 'output', 'outputs'] as const) {
    const list = root[key]
    if (Array.isArray(list)) list.forEach(push)
  }
  push(root.image)

  return Array.from(new Set(urls))
}

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
  // Chế độ thử không gọi Fal.ai nên không cần khoá.
  const falKey = process.env.FAL_KEY
  if (!falKey && !DEMO_MODE) {
    return NextResponse.json(
      { error: 'Máy chủ chưa cấu hình FAL_KEY. Thêm vào biến môi trường rồi triển khai lại.' },
      { status: 501 }
    )
  }

  // --- 3. Đọc và kiểm tra dữ liệu gửi lên -------------------------------
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { error: 'Không đọc được dữ liệu gửi lên. Ảnh có thể quá lớn.' },
      { status: 400 }
    )
  }

  const prompt = str(body.prompt).trim()

  const rawImages = (body.images ?? {}) as Record<string, unknown>
  const images: RefImages = {
    // Vẫn nhận khoá "image" của bản cũ để không phá thứ gì đang gọi tới.
    character: str(rawImages.character) || str(body.image),
    style: str(rawImages.style),
    pose: str(rawImages.pose),
  }

  if (!prompt) {
    return NextResponse.json({ error: 'Thiếu mô tả.' }, { status: 400 })
  }
  // Ảnh tham chiếu nay đều là tuỳ chọn. Phần lớn cảnh được tả hoàn toàn bằng
  // chữ; ảnh chỉ dùng khi cần khoá một nhân vật đã dựng từ lượt trước.
  // Mỗi ô nhận một trong hai dạng: ảnh nhúng thẳng (data:image/...) do người
  // dùng vừa chọn, hoặc một đường dẫn https — thường là ảnh Fal.ai vừa sinh ra
  // ở lượt trước, dùng để nối tiếp cảnh.
  //
  // Chỉ nhận đúng hai dạng đó. Không để lọt một chuỗi tuỳ ý xuống Fal.ai, vì
  // trường này đi thẳng vào yêu cầu gửi ra ngoài.
  for (const [ten, giaTri] of Object.entries(images)) {
    if (!giaTri) continue
    if (!giaTri.startsWith('data:image/') && !giaTri.startsWith('https://')) {
      return NextResponse.json(
        { error: `Ảnh ${ten} không hợp lệ: phải là ảnh tải lên hoặc một đường dẫn https.` },
        { status: 400 }
      )
    }
  }

  // Chỉ ảnh nhúng mới tính vào hạn mức; đường dẫn https thì Fal.ai tự đi lấy
  // nên không chiếm dung lượng của yêu cầu. Đây cũng là lý do nối tiếp cảnh
  // không bao giờ đụng trần kích thước.
  const totalChars = Object.values(images)
    .filter((v) => v.startsWith('data:'))
    .reduce((sum, v) => sum + v.length, 0)
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json(
      {
        error:
          'Ảnh quá lớn. Tổng cả ba ảnh nên dưới khoảng 3MB — Vercel chặn yêu cầu lớn hơn thế. ' +
          'Thu nhỏ ảnh rồi thử lại.',
      },
      { status: 413 }
    )
  }

  // Model do người dùng chọn quyết định mức giá mỗi ảnh, nên chỉ nhận tên
  // nằm trong danh sách cho phép.
  const requestedModel = str(body.model).trim()
  const models = allowedModels()
  if (requestedModel && !models.includes(requestedModel)) {
    return NextResponse.json(
      { error: `Model không nằm trong danh sách được phép: ${requestedModel}` },
      { status: 400 }
    )
  }
  const model = requestedModel || DEFAULT_MODEL

  const rawNum = Number(body.numImages)
  const numImages =
    Number.isFinite(rawNum) && rawNum >= 1 ? Math.min(Math.floor(rawNum), MAX_NUM_IMAGES) : 1

  // --- 4. Chế độ thử: dừng ở đây, không gọi ra ngoài --------------------
  //
  // Đặt sau toàn bộ phần kiểm tra dữ liệu ở trên là có chủ ý: chế độ thử vẫn
  // phải đi qua đúng những cửa ải mà bản thật đi qua — bắt đăng nhập, bắt có
  // mô tả, bắt có ảnh nhân vật, chặn ảnh quá lớn, chặn model lạ. Nếu không thì
  // thử xong vẫn không biết mấy lớp kiểm tra đó có chạy không.
  if (DEMO_MODE) {
    const urls = demoImageUrls(prompt, numImages)
    return NextResponse.json({ imageUrls: urls, imageUrl: urls[0], model, demo: true })
  }

  // --- 5. Dựng thân yêu cầu gửi sang Fal.ai -----------------------------
  const payload: Record<string, unknown> = {
    prompt,
    [CHARACTER_FIELD]: images.character,
  }
  if (STYLE_FIELD && images.style) payload[STYLE_FIELD] = images.style
  if (POSE_FIELD && images.pose) payload[POSE_FIELD] = images.pose
  if (NUM_IMAGES_FIELD && numImages > 1) payload[NUM_IMAGES_FIELD] = numImages

  // Tên trường đang dùng, trả kèm mọi lỗi để đoán được ngay sai ở đâu.
  const fieldsUsed = {
    model,
    nhanVat: CHARACTER_FIELD,
    phongCach: STYLE_FIELD || '(chưa cấu hình)',
    dang: POSE_FIELD || '(chưa cấu hình)',
    soLuong: NUM_IMAGES_FIELD || '(chưa cấu hình)',
  }

  // --- 6. Gọi Fal.ai ----------------------------------------------------
  try {
    const falResponse = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const raw = await falResponse.text()

    if (!falResponse.ok) {
      // Trả nguyên văn lỗi của Fal.ai. Sai tên model hay sai tên trường thì
      // chính họ sẽ nói tên đúng là gì — đỡ phải đoán.
      console.error('Fal.ai trả lỗi', falResponse.status, raw)
      return NextResponse.json(
        {
          error: `Fal.ai từ chối (HTTP ${falResponse.status}).`,
          fieldsUsed,
          falResponse: raw.slice(0, 2000),
        },
        { status: 502 }
      )
    }

    const data = JSON.parse(raw)
    const imageUrls = collectImageUrls(data)

    if (imageUrls.length === 0) {
      return NextResponse.json(
        {
          error: 'Fal.ai chạy xong nhưng không tìm thấy đường dẫn ảnh trong phản hồi.',
          fieldsUsed,
          falResponse: raw.slice(0, 2000),
        },
        { status: 502 }
      )
    }

    // imageUrl giữ lại cho tương thích ngược; imageUrls mới là cái đầy đủ.
    return NextResponse.json({ imageUrls, imageUrl: imageUrls[0], model })
  } catch (error: unknown) {
    console.error('Lỗi khi gọi Fal.ai:', error)
    const message = error instanceof Error ? error.message : 'Không rõ nguyên nhân'
    return NextResponse.json(
      { error: `Không gọi được Fal.ai: ${message}`, fieldsUsed },
      { status: 502 }
    )
  }
}
