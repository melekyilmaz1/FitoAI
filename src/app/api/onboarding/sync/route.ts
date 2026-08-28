import { NextRequest, NextResponse } from "next/server"
import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import type { FormData } from "@/components/onboarding/multi-step-form"
import type { CalculatedMetrics } from "@/lib/calculations"

const DATA_DIR = join(process.cwd(), "data")
const USERS_FILE = join(DATA_DIR, "users.json")

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

interface SyncRequest {
  userId: string
  formData: FormData
  metrics: CalculatedMetrics
}

async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true })
  } catch {
    // Directory already exists
  }
}

async function readUsers(): Promise<User[]> {
  try {
    await ensureDataDir()
    const data = await readFile(USERS_FILE, "utf-8")
    return JSON.parse(data) as User[]
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return []
    }
    throw err
  }
}

async function writeUsers(users: User[]): Promise<void> {
  await ensureDataDir()
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SyncRequest
    const { userId, formData, metrics } = body

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID gerekli" }, { status: 400 })
    }

    if (!formData || !metrics) {
      return NextResponse.json({ error: "Form verileri ve metrikler gerekli" }, { status: 400 })
    }

    const users = await readUsers()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Update user profile with onboarding data
    const updatedUser: User = {
      ...users[userIndex],
      daily_calorie_target: metrics.targetCalories,
      target_protein_g: metrics.macros.protein.grams,
      target_carbs_g: metrics.macros.carbs.grams,
      target_fat_g: metrics.macros.fat.grams,
      updated_at: new Date().toISOString(),
    }

    users[userIndex] = updatedUser
    await writeUsers(users)

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: "Profil başarıyla güncellendi",
      user: userWithoutPassword,
    })
  } catch (err: any) {
    console.error("Onboarding sync error:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}