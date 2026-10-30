import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // 1. İstek gövdesini güvenli bir şekilde oku
    const rawBody = await request.text()
    let body: any = {}
    
    if (rawBody) {
      try {
        body = JSON.parse(rawBody)
      } catch (e) {
        return NextResponse.json(
          { reply: "Geçersiz JSON formatında istek gönderildi." },
          { status: 400 }
        )
      }
    }

    const { message } = body

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { reply: "Mesaj alanı boş olamaz." },
        { status: 400 }
      )
    }

    // 2. API Anahtarı kontrolü
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { reply: "HATA: GEMINI_API_KEY .env.local dosyasında bulunamadı. Lütfen sunucuyu yeniden başlatın." },
        { status: 500 }
      )
    }

    // 3. Gemini API Çağrısı (Kararlı Flash Endpoint)
    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Sen Fito uygulamasının samimi ve uzman kişisel beslenme koçusun. Kullanıcıya kısa, Türkçe ve motive edici yanıtlar ver.\n\nKullanıcı: ${message}`,
                },
              ],
            },
          ],
        }),
      }
    )

    // 4. Yanıtın metin olarak çekilip güvenli şekilde JSON'a çevrilmesi (SyntaxError Önleyici)
    const responseText = await googleResponse.text()
    let data: any = {}

    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Gemini API metin yanıtı veriyor (JSON değil):", responseText)
      return NextResponse.json(
        { reply: `Gemini API servisinden geçersiz yanıt alındı (${googleResponse.status}).` },
        { status: 502 }
      )
    }

    // 5. Hata Kontrolü
    if (!googleResponse.ok) {
      console.error("Gemini API Hatası Detayları:", data)
      return NextResponse.json(
        { reply: `Gemini API Hatası (${googleResponse.status}): ${data?.error?.message || "Servis yanıt vermedi."}` },
        { status: googleResponse.status }
      )
    }

    // 6. Yanıtı Çıkarma
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Üzgünüm, şu an yanıt oluşturulamadı."

    return NextResponse.json({ reply: replyText }, { status: 200 })

  } catch (error: any) {
    console.error("Route catch error:", error)
    return NextResponse.json(
      { reply: `Sunucu Hatası: ${error?.message || "İstek işlenirken beklenmeyen bir hata oluştu."}` },
      { status: 500 }
    )
  }
}