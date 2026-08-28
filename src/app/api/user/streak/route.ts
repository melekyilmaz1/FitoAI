import { NextRequest, NextResponse } from "next/server"
import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"

const DATA_DIR = join(process.cwd(), "data")
const USERS_FILE = join(DATA_DIR, "users.json")
const MEALS_FILE = join(DATA_DIR, "meals.json")

interface User {
  id: string
  email: string
  password_hash: string
  full_name: string | null
  daily_calorie_target: number
  target_protein_g: number
  target_carbs_g: number
  target_fat_g: number
  streak_days: number
  created_at: string
  updated_at: string
}

interface Meal {
  id: string
  user_id: string
  meal_name: string
  meal_type: "Kahvaltı" | "Öğle" | "Akşam" | "Ara Öğün"
  portion_count: number
  total_grams: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  image_url: string | null
  created_at: string
}

async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true })
  } catch {
    // Klasör zaten mevcut
  }
}

async function readUsers(): Promise<User[]> {
  try {
    await ensureDataDir()
    const data = await readFile(USERS_FILE, "utf-8")
    return JSON.parse(data) as User[]
  } catch (err: any) {
    if (err.code === "ENOENT") return []
    throw err
  }
}

async function writeUsers(users: User[]): Promise<void> {
  await ensureDataDir()
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8")
}

async function readMeals(): Promise<Meal[]> {
  try {
    await ensureDataDir()
    const data = await readFile(MEALS_FILE, "utf-8")
    return JSON.parse(data) as Meal[]
  } catch (err: any) {
    if (err.code === "ENOENT") return []
    throw err
  }
}

/**
 * Kullanıcının yemek kaydettiği benzersiz günleri hesaplayarak ardışık seriyi (streak) bulur.
 */
function calculateStreak(meals: Meal[], userId: string, referenceDate: Date = new Date()): number {
  const userMeals = meals.filter((meal) => meal.user_id === userId)

  if (userMeals.length === 0) return 0

  // Yemek kayıt tarihlerinden sadece YYYY-MM-DD parçalarını al ve benzersiz küme (Set) oluştur
  const loggedDates = new Set(
    userMeals.map((m) => {
      const date = new Date(m.created_at)
      return date.toISOString().split("T")[0]
    })
  )

  const checkDate = new Date(referenceDate)
  const todayStr = checkDate.toISOString().split("T")[0]

  // Bugün henüz yemek girilmediyse, dün girilmiş mi kontrol et. Dün girilmediyse streak 0'dır.
  let currentDateStr = todayStr
  if (!loggedDates.has(currentDateStr)) {
    checkDate.setDate(checkDate.getDate() - 1)
    currentDateStr = checkDate.toISOString().split("T")[0]
    if (!loggedDates.has(currentDateStr)) {
      return 0
    }
  }

  // Geriye doğru ardışık gün sayımı yap
  let streak = 0
  while (loggedDates.has(currentDateStr)) {
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
    currentDateStr = checkDate.toISOString().split("T")[0]
  }

  return streak
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const users = await readUsers()
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const meals = await readMeals()
    const streak = calculateStreak(meals, userId)

    // Seri sayısı güncellendiyse veri dosyasında güncelle
    if (streak !== users[userIndex].streak_days) {
      users[userIndex] = {
        ...users[userIndex],
        streak_days: streak,
        updated_at: new Date().toISOString(),
      }
      await writeUsers(users)
    }

    return NextResponse.json({ streak_days: streak, streak })
  } catch (err: any) {
    console.error("Streak GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const users = await readUsers()
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const meals = await readMeals()
    const streak = calculateStreak(meals, userId)

    // Kullanıcının gün sayacını kaydet
    users[userIndex] = {
      ...users[userIndex],
      streak_days: streak,
      updated_at: new Date().toISOString(),
    }
    await writeUsers(users)

    return NextResponse.json({ streak_days: streak, streak })
  } catch (err: any) {
    console.error("Streak POST error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}