import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { mode, text, image } = await req.json()

    if (!text && !image) {
      return NextResponse.json({ error: "Metin veya görsel gerekli" }, { status: 400 })
    }

    // In a real app, you'd call an AI service like OpenAI GPT-4 Vision or similar
    // For now, we'll return a simulated response based on the input

    const mealTypes = ["Kahvaltı", "Öğle", "Akşam", "Ara Öğün"] as const
    const hour = new Date().getHours()
    let meal_type: typeof mealTypes[number] = "Ara Öğün"
    if (hour < 11) meal_type = "Kahvaltı"
    else if (hour < 16) meal_type = "Öğle"
    else if (hour < 21) meal_type = "Akşam"

    // Simple keyword-based estimation for demo
    let calories = 350
    let protein_g = 25
    let carbs_g = 35
    let fat_g = 12
    let meal_name = "Yemek"
    let portion_count = 1
    let total_grams = 250

    if (text) {
      const lower = text.toLowerCase()
      if (lower.includes("tavuk") || lower.includes("chicken")) { protein_g += 15; calories += 80; meal_name = "Tavuk Yemeği" }
      if (lower.includes("balık") || lower.includes("fish")) { protein_g += 18; calories += 70; meal_name = "Balık Yemeği" }
      if (lower.includes("yumurta") || lower.includes("egg")) { protein_g += 12; calories += 90; meal_name = "Yumurta Yemeği" }
      if (lower.includes("pirinç") || lower.includes("rice")) { carbs_g += 30; calories += 120 }
      if (lower.includes("ekmek") || lower.includes("bread")) { carbs_g += 20; calories += 80 }
      if (lower.includes("patates") || lower.includes("potato")) { carbs_g += 25; calories += 100 }
      if (lower.includes("salata") || lower.includes("salad")) { calories += 20; total_grams += 100 }
      if (lower.includes("yağ") || lower.includes("oil") || lower.includes("tereyağı")) { fat_g += 10; calories += 90 }
      if (lower.includes("peynir") || lower.includes("cheese")) { protein_g += 10; fat_g += 8; calories += 120 }
      if (lower.includes("yulaf") || lower.includes("oat")) { carbs_g += 25; protein_g += 5; calories += 130 }
      if (lower.includes("muz") || lower.includes("banana")) { carbs_g += 20; calories += 90 }
    }

    // Clamp values to reasonable ranges
    calories = Math.max(50, Math.min(1500, calories))
    protein_g = Math.max(2, Math.min(100, protein_g))
    carbs_g = Math.max(2, Math.min(150, carbs_g))
    fat_g = Math.max(1, Math.min(80, fat_g))
    total_grams = Math.max(50, Math.min(800, total_grams))

    return NextResponse.json({
      meal_name,
      meal_type,
      portion_count,
      total_grams,
      calories,
      protein_g,
      carbs_g,
      fat_g,
    })
  } catch (error) {
    console.error("Meal analysis error:", error)
    return NextResponse.json({ error: "Analiz sırasında hata oluştu" }, { status: 500 })
  }
}