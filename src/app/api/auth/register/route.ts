import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

function getUserWithoutPassword(user: any) {
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, userId, onboardingData } = body

    const dbUser = prisma.user || (prisma as any).User || (prisma as any).users

    if (!dbUser) {
      return NextResponse.json({ error: "Veritabanı modeli (User) bulunamadı." }, { status: 500 })
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

      const existingUser = await dbUser.findUnique({
        where: { email: normalizedEmail },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)

      // Şemanızdaki mevcut alanlarla (email, password, name) uyumlu kayıt nesnesi
      const newUser = await dbUser.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: onboardingData?.full_name || onboardingData?.fullName || null,
        },
      })

      return NextResponse.json({
        message: "Kayıt başarılı. Giriş yapabilirsiniz.",
        user: getUserWithoutPassword(newUser),
      })
    }

    if (action === "signin") {
      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 })
      }

      const normalizedEmail = email.toLowerCase().trim()

      const user = await dbUser.findUnique({
        where: { email: normalizedEmail },
      })

      if (!user) {
        return NextResponse.json({ error: "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı." }, { status: 404 })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Hatalı şifre." }, { status: 400 })
      }

      return NextResponse.json({ user: getUserWithoutPassword(user) })
    }

    if (action === "verify") {
      if (!userId) {
        return NextResponse.json({ error: "Kullanıcı ID gerekli" }, { status: 400 })
      }

      const user = await dbUser.findUnique({
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
    return NextResponse.json({ error: "Sunucu hatası: " + (err.message || "Bilinmeyen hata") }, { status: 500 })
  }
}