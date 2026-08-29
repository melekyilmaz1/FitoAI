import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

function getUserWithoutPassword(user: any) {
  if (!user) return null
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

// Güvenli kullanıcı bulma (Model veya Raw SQL)
async function findUserByEmail(email: string) {
  try {
    const userModel = prisma.user || (prisma as any).User || (prisma as any).users
    if (userModel?.findUnique) {
      const u = await userModel.findUnique({ where: { email } })
      if (u) return u
    }
  } catch (e) {
    console.warn("Prisma model search fallback to raw sql:", e)
  }

  // Raw SQL ile doğrudan Neon PostgreSQL sorgusu
  try {
    const rawUsers: any[] = await prisma.$queryRaw`
      SELECT * FROM "User" WHERE LOWER(email) = LOWER(${email}) LIMIT 1
    `
    if (rawUsers && rawUsers.length > 0) {
      return rawUsers[0]
    }
  } catch (e) {
    console.error("Raw SQL error:", e)
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, userId, onboardingData } = body

    if (action === "signup") {
      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 })
      }

      const normalizedEmail = email.toLowerCase().trim()
      const existingUser = await findUserByEmail(normalizedEmail)

      if (existingUser) {
        return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const userModel = prisma.user || (prisma as any).User || (prisma as any).users

      let newUser
      if (userModel?.create) {
        newUser = await userModel.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            name: onboardingData?.full_name || onboardingData?.fullName || null,
          },
        })
      } else {
        const id = crypto.randomUUID()
        await prisma.$executeRaw`
          INSERT INTO "User" ("id", "email", "password", "name", "createdAt")
          VALUES (${id}, ${normalizedEmail}, ${hashedPassword}, ${onboardingData?.fullName || null}, NOW())
        `
        newUser = { id, email: normalizedEmail, name: onboardingData?.fullName || null }
      }

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
      const user = await findUserByEmail(normalizedEmail)

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

      let user: any = null
      try {
        const userModel = prisma.user || (prisma as any).User || (prisma as any).users
        if (userModel?.findUnique) {
          user = await userModel.findUnique({ where: { id: userId } })
        }
      } catch {}

      if (!user) {
        const rawUsers: any[] = await prisma.$queryRaw`
          SELECT * FROM "User" WHERE id = ${userId} LIMIT 1
        `
        if (rawUsers && rawUsers.length > 0) user = rawUsers[0]
      }

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