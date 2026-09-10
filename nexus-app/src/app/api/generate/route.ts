import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { prompt, image } = await request.json()

    if (!prompt || !image) {
      return NextResponse.json({ error: 'Missing prompt or image' }, { status: 400 })
    }

    // TODO: Connect to Fal.ai or Replicate here
    // Currently, we return a 501 Not Implemented error to prompt the user to configure API keys.
    
    return NextResponse.json(
      { error: 'Chưa cài đặt API Key cho AI (Fal.ai hoặc Replicate). Vui lòng cung cấp API Key để kết nối!' },
      { status: 501 }
    )
  } catch (error: unknown) {
    console.error('AI Generation error:', error)
    const message = error instanceof Error ? error.message : 'Something went wrong'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
