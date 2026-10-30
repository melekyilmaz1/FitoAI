import { NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
// Hatada belirtilen yeni güncel Flash modeli
const GEMINI_MODEL = "gemini-3.6-flash"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

interface ChatMessage {
  id?: string
  sender: "user" | "ai"
  message: string
}

interface ChatRequest {
  message: string
  messages?: ChatMessage[]
  context?: {
    goal?: string
    dailyCalories?: number
    macros?: {
      protein: number
      carbs: number
      fat: number
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    let body: ChatRequest = { message: "" }

    if (rawBody) {
      try {
        body = JSON.parse(rawBody)
      } catch {
        return NextResponse.json(
          { reply: "Geçersiz istek biçimi.", message: "Geçersiz istek biçimi." },
          { status: 400 }
        )
      }
    }

    const { message, messages = [], context } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { reply: "Mesaj boş olamaz.", message: "Mesaj boş olamaz." },
        { status: 400 }
      )
    }

    if (!GEMINI_API_KEY) {
      const err = "HATA: GEMINI_API_KEY .env.local dosyasında tanımlı değil."
      return NextResponse.json({ reply: err, message: err }, { status: 500 })
    }

    const goalLabel = context?.goal
      ? context.goal === "weight_loss"
        ? "Kilo Verme"
        : context.goal === "muscle_gain"
        ? "Kas Yapma"
        : "Formu Koruma"
      : "Belirtilmemiş"

    const dailyCalories = context?.dailyCalories || "Belirtilmemiş"
    const protein = context?.macros?.protein || "Belirtilmemiş"
    const carbs = context?.macros?.carbs || "Belirtilmemiş"
    const fat = context?.macros?.fat || "Belirtilmemiş"

    const systemInstructionText = `Sen Fito uygulamasının kişisel beslenme ve fitness AI koçusun.
Kullanıcı Profili:
- Hedef: ${goalLabel}
- Günlük Kalori: ${dailyCalories} kcal
- Makrolar: Protein ${protein}g, Karbonhidrat ${carbs}g, Yağ ${fat}g

Kurallar:
1. Yanıtlarını MUTLAKA tam bitmiş cümlelerle tamamla. Yarıda kesme.
2. Samimi, Türkçe ve motive edici bir dille konuş.
3. Kısa ve net öneriler ver ama cümleni noktayla bitir.`

    // Geçmiş mesajları API formatına aktar
    const formattedHistory = messages.map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.message }]
    }))

    const lastMsgInHistory = formattedHistory[formattedHistory.length - 1]
    if (!lastMsgInHistory || lastMsgInHistory.parts[0].text !== message.trim()) {
      formattedHistory.push({
        role: "user",
        parts: [{ text: message.trim() }]
      })
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      contents: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const rawResponseText = await response.text()
    let data: any = {}

    try {
      data = JSON.parse(rawResponseText)
    } catch {
      const err = "Gemini API servisinden geçerli bir yanıt okunamadı."
      return NextResponse.json({ reply: err, message: err }, { status: 502 })
    }

    if (!response.ok) {
      console.error("Gemini API Hatası:", response.status, data)
      const err = `Gemini API Hatası (${response.status}): ${data?.error?.message || "Model hatası."}`
      return NextResponse.json({ reply: err, message: err }, { status: response.status })
    }

    const aiMessage =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Harika bir gün geçirmeni dilerim! Bugün senin için dengeye ve hedeflerine odaklı besleyici bir menü planlayabiliriz."

    return NextResponse.json({ reply: aiMessage, message: aiMessage })
  } catch (error: any) {
    console.error("Chat API error:", error)
    const err = `Sunucu hatası: ${error?.message || "Bilinmeyen bir hata oluştu."}`
    return NextResponse.json({ reply: err, message: err }, { status: 500 })
  }
}