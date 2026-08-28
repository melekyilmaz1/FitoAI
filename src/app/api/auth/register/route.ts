import { NextRequest, NextResponse } from "next/server"
import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import bcrypt from "bcryptjs"

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

function generateId(): string {
  return crypto.randomUUID()
}

function getUserWithoutPassword(user: User) {
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, userId, onboardingData } = body

    if (action === "signup") {
      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 })
      }

      if (!email.includes("@")) {
        return NextResponse.json({ error: "Geçerli bir e-posta adresi girin" }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 })
      }

      const users = await readUsers()
      const normalizedEmail = email.toLowerCase().trim()

      // Check if user already exists
      const existingUser = users.find(u => u.email === normalizedEmail)
      if (existingUser) {
        return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 400 })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12)

      // Create new user with onboarding data mapping
      const newUser: User = {
        id: generateId(),
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: onboardingData?.full_name || onboardingData?.fullName || null,
        daily_calorie_target: Number(onboardingData?.daily_calorie_target || onboardingData?.targetCalories || 0),
        target_protein_g: Number(onboardingData?.target_protein_g || onboardingData?.targetProtein || 0),
        target_carbs_g: Number(onboardingData?.target_carbs_g || onboardingData?.targetCarbs || 0),
        target_fat_g: Number(onboardingData?.target_fat_g || onboardingData?.targetFat || 0),
        streak_days: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      users.push(newUser)
      await writeUsers(users)

      const safeUser = getUserWithoutPassword(newUser)

      return NextResponse.json({
        message: "Kayıt başarılı. Giriş yapabilirsiniz.",
        user: safeUser
      })
    }

    if (action === "signin") {
      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 })
      }

      const users = await readUsers()
      const normalizedEmail = email.toLowerCase().trim()

      // Find user by email
      const user = users.find(u => u.email === normalizedEmail)

      if (!user) {
        return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 })
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash)
      if (!isValid) {
        return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 })
      }

      // Return user without password hash
      return NextResponse.json({ user: getUserWithoutPassword(user) })
    }

    if (action === "verify") {
      if (!userId) {
        return NextResponse.json({ error: "Kullanıcı ID gerekli" }, { status: 400 })
      }

      const users = await readUsers()
      const user = users.find(u => u.id === userId)

      if (!user) {
        return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
      }

      return NextResponse.json({ user: getUserWithoutPassword(user) })
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
  } catch (err: any) {
    console.error("Auth API error:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}