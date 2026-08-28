import { NextRequest, NextResponse } from "next/server"
import { getWaterTrackingAPI, upsertWaterTrackingAPI, getWaterHistoryAPI } from "@/lib/supabase-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const date = searchParams.get("date") // YYYY-MM-DD format

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    if (date) {
      // Get specific date
      const water = await getWaterTrackingAPI(userId, new Date(date))
      return NextResponse.json({ water: water ? [water] : [] })
    } else {
      // Get history (last 30 days)
      const waterHistory = await getWaterHistoryAPI(userId, 30)
      return NextResponse.json({ water: waterHistory })
    }
  } catch (error: any) {
    console.error("Water GET error:", error)
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount_ml, amount, date } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // `amount` veya `amount_ml` değerlerinden hangisi geldiyse onu al
    const targetAmount = typeof amount_ml === "number" ? amount_ml : amount

    if (typeof targetAmount !== "number" || targetAmount < 0) {
      return NextResponse.json({ error: "Geçerli bir su miktarı gerekli" }, { status: 400 })
    }

    // Use provided date or today
    const targetDate = date ? new Date(date) : new Date()

    const waterRecord = await upsertWaterTrackingAPI(userId, targetDate, targetAmount)

    if (!waterRecord) {
      return NextResponse.json({ error: "Su kaydı oluşturulamadı" }, { status: 500 })
    }

    return NextResponse.json({ water: waterRecord })
  } catch (error: any) {
    console.error("Water POST error:", error)
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, date } = body

    if (!userId || !date) {
      return NextResponse.json({ error: "User ID and date required" }, { status: 400 })
    }

    // For DELETE, we'd need to add a delete function to supabase-service
    // For now, return not implemented
    return NextResponse.json({ error: "Not implemented" }, { status: 501 })
  } catch (error: any) {
    console.error("Water DELETE error:", error)
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
  }
}