import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

interface SignUpBody {
  action: "signup"
  email: string
  password: string
  fullName?: string
}

interface SignInBody {
  action: "signin"
  email: string
  password: string
}

interface VerifyBody {
  action: "verify"
  userId: string
}

type AuthBody = SignUpBody | SignInBody | VerifyBody

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body: AuthBody = await request.json()
    const { action } = body

    // 1. KAYIT OLMA (SignUp)
    if (action === "signup") {
      const { email, password, fullName } = body as SignUpBody

      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 })
      }

      if (!email.includes("@")) {
        return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 })
      }

      const normalizedEmail = normalizeEmail(email)

      if (password.length < 6) {
        return NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 })
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)

      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: fullName || null,
        },
      })

      return NextResponse.json({
        message: "Kayıt başarılı.",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          createdAt: newUser.createdAt,
        },
      })
    }

    // 2. GİRİŞ YAPMA (SignIn)
    if (action === "signin") {
      const { email, password } = body as SignInBody

      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gerekli." }, { status: 400 })
      }

      const normalizedEmail = normalizeEmail(email)

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })

      if (!user) {
        return NextResponse.json({ error: "E-posta adresi veya şifre yanlış." }, { status: 401 })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return NextResponse.json({ error: "E-posta adresi veya şifre yanlış." }, { status: 401 })
      }

      return NextResponse.json({
        message: "Giriş başarılı.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      })
    }

    // 3. DOĞRULAMA (Verify - Sayfa yenilendiğinde ve auth değişiminde tetiklenir)
    if (action === "verify") {
      const { userId } = body as VerifyBody

      if (!userId) {
        return NextResponse.json({ error: "User ID gerekli." }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return NextResponse.json({ error: "Kullanıcı bulunamadı.", user: null }, { status: 404 })
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      })
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 })
  } catch (err: any) {
    console.error("Auth API error:", err)
    return NextResponse.json({ error: err?.message || "Sunucu hatası oluştu." }, { status: 500 })
  }
}