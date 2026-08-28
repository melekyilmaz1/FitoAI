import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

function getUserModel() {
  if (!prisma) return null
  // Doğrudan tüm property'ler içinde findUnique metoduna sahip olan modeli bulur
  const modelKey = Object.keys(prisma).find((key) => {
    const val = (prisma as any)[key]
    return val && typeof val.findUnique === "function" && !key.startsWith("_")
  })
  return modelKey ? (prisma as any)[modelKey] : (prisma as any).user || (prisma as any).User || (prisma as any).users
}

function getUserWithoutPassword(user: any) {
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, userId, onboardingData } = body
    const userModel = getUserModel()

    if (!userModel) {
      return NextResponse.json({ error: "Veritabanı modeli bulunamadı" }, { status: 500 })
    }

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

      const normalizedEmail = email.toLowerCase().trim()

      const existingUser = await userModel.findUnique({
        where: { email: normalizedEmail },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 400 })
      }

      const passwordHash = await bcrypt.hash(password, 12)

      const newUser = await userModel.create({
        data: {
          email: normalizedEmail,
          password_hash: passwordHash,
          full_name: onboardingData?.full_name || onboardingData?.fullName || null,
          daily_calorie_target: Number(onboardingData?.daily_calorie_target || onboardingData?.targetCalories || 0),
          target_protein_g: Number(onboardingData?.target_protein_g || onboardingData?.targetProtein || 0),
          target_carbs_g: Number(onboardingData?.target_carbs_g || onboardingData?.targetCarbs || 0),
          target_fat_g: Number(onboardingData?.target_fat_g || onboardingData?.targetFat || 0),
          streak_days: 0,
        },
      })

      const safeUser = getUserWithoutPassword(newUser)

      return NextResponse.json({
        message: "Kayıt başarılı. Giriş yapabilirsiniz.",
        user: safeUser,
      })
    }

    if (action === "signin") {
      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 })
      }

      const normalizedEmail = email.toLowerCase().trim()

      const user = await userModel.findUnique({
        where: { email: normalizedEmail },
      })

      if (!user) {
        return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 })
      }

      const isValid = await bcrypt.compare(password, user.password_hash)
      if (!isValid) {
        return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 })
      }

      return NextResponse.json({ user: getUserWithoutPassword(user) })
    }

    if (action === "verify") {
      if (!userId) {
        return NextResponse.json({ error: "Kullanıcı ID gerekli" }, { status: 400 })
      }

      const user = await userModel.findUnique({
        where: { id: userId },
      })

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