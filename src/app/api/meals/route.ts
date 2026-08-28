import { NextRequest, NextResponse } from "next/server"
import { getMealsAPI, createMealAPI, deleteMealAPI } from "@/lib/supabase-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const dateStr = searchParams.get("date") // Örn: YYYY-MM-DD

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    let meals = await getMealsAPI(userId, dateStr ? new Date(dateStr) : undefined)

    if (!meals) {
      return NextResponse.json({ meals: [] })
    }

    return NextResponse.json({ meals: meals.slice(0, 50) })
  } catch (error: any) {
    console.error("Meals GET error:", error)
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...mealData } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // meal_name alanını garanti altına alıyoruz (farklı adlarla gelmiş olma ihtimaline karşı)
    const rawMealName = mealData.meal_name || mealData.food_name || mealData.name || mealData.text || "Özel Öğün"
    const cleanedMealName = typeof rawMealName === "string" ? rawMealName.trim() : "Özel Öğün"

    const payloadToSave = {
      ...mealData,
      meal_name: cleanedMealName,
    }

    // 1. Yemeği veritabanına kaydet
    const meal = await createMealAPI(payloadToSave, userId)

    if (!meal) {
      return NextResponse.json({ error: "Yemek kaydedilemedi" }, { status: 500 })
    }

    // Veritabanı yanıtında meal_name boş dönse bile istekle gelen ismi basıyoruz
    const responseMeal = {
      ...meal,
      meal_name: meal.meal_name || cleanedMealName,
    }

    // 2. Seri (Streak) Mantığını Tetikle
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      await fetch(`${baseUrl}/api/user/streak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
    } catch (streakError) {
      console.error("Streak güncelleme hatası:", streakError)
    }

    return NextResponse.json({ meal: responseMeal })
  } catch (error: any) {
    console.error("Meals POST error:", error)
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { mealId, userId } = body

    if (!mealId || !userId) {
      return NextResponse.json({ error: "Meal ID and User ID required" }, { status: 400 })
    }

    const success = await deleteMealAPI(mealId)

    if (!success) {
      return NextResponse.json({ error: "Yemek bulunamadı veya silinemedi" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Meals DELETE error:", error)
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
  }
}