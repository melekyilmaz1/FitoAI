import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Supabase değişkenleri varsa istemciyi oluştur, yoksa null bırak
const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

interface SignUpBody {
  action: "signup"
  email: string
  password: string
  fullName?: string
  dailyCalorieTarget?: number
  targetProteinG?: number
  targetCarbsG?: number
  targetFatG?: number
}

interface SignInBody {
  action: "signin"
  email: string
  password: string
}

type AuthBody = SignUpBody | SignInBody

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function sanitizePassword(password: string): string {
  return String(password)
}

export async function POST(request: NextRequest) {
  try {
    const body: AuthBody = await request.json()
    const { action } = body

    // 1. KAYIT OLMA (SignUp)
    if (action === "signup") {
      const { email, password, fullName, dailyCalorieTarget, targetProteinG, targetCarbsG, targetFatG } = body

      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 })
      }

      if (!email.includes("@")) {
        return NextResponse.json({ error: "Geçerli bir e-posta adresi girin" }, { status: 400 })
      }

      const normalizedEmail = normalizeEmail(email)
      const sanitizedPassword = sanitizePassword(password)

      if (sanitizedPassword.length < 6) {
        return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 })
      }

      // Supabase Bağlantısı Varsa (Supabase Mode)
      if (supabaseAdmin) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: sanitizedPassword,
          email_confirm: true,
          user_metadata: { full_name: fullName || null },
        })

        if (authError) {
          console.error("Supabase signup error:", authError)
          if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
            return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 400 })
          }
          return NextResponse.json({ error: "Kayıt sırasında bir hata oluştu." }, { status: 400 })
        }

        if (authData.user) {
          await supabaseAdmin.from("users").insert({
            id: authData.user.id,
            email: normalizedEmail,
            full_name: fullName || null,
            daily_calorie_target: dailyCalorieTarget || 0,
            target_protein_g: targetProteinG || 0,
            target_carbs_g: targetCarbsG || 0,
            target_fat_g: targetFatG || 0,
            streak_days: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }

        return NextResponse.json({
          message: "Kayıt başarılı.",
          user: authData.user ? {
            id: authData.user.id,
            email: authData.user.email,
            full_name: fullName || null,
            daily_calorie_target: dailyCalorieTarget || 0,
            target_protein_g: targetProteinG || 0,
            target_carbs_g: targetCarbsG || 0,
            target_fat_g: targetFatG || 0,
            streak_days: 0,
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at || authData.user.created_at,
          } : null,
        })
      }

      // Supabase Bağlantısı Yoksa (Yerel Fallback Modu)
      const mockUser = {
        id: "usr_" + Date.now(),
        email: normalizedEmail,
        full_name: fullName || null,
        daily_calorie_target: dailyCalorieTarget || 0,
        target_protein_g: targetProteinG || 0,
        target_carbs_g: targetCarbsG || 0,
        target_fat_g: targetFatG || 0,
        streak_days: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return NextResponse.json({
        message: "Kayıt başarılı.",
        user: mockUser,
      })
    }

    // 2. GİRİŞ YAPMA (SignIn)
    if (action === "signin") {
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json({ error: "E-posta ve şifre gerekli" }, { status: 400 })
      }

      const normalizedEmail = normalizeEmail(email)
      const sanitizedPassword = sanitizePassword(password)

      // Supabase Bağlantısı Varsa (Supabase Mode)
      if (supabaseAdmin) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
          email: normalizedEmail,
          password: sanitizedPassword,
        })

        if (authError || !authData.user) {
          return NextResponse.json({ error: "E-posta adresi veya şifre yanlış." }, { status: 401 })
        }

        const { data: profileData } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", authData.user.id)
          .single()

        const user = {
          id: authData.user.id,
          email: authData.user.email!,
          full_name: profileData?.full_name || authData.user.user_metadata?.full_name || null,
          daily_calorie_target: profileData?.daily_calorie_target || 0,
          target_protein_g: profileData?.target_protein_g || 0,
          target_carbs_g: profileData?.target_carbs_g || 0,
          target_fat_g: profileData?.target_fat_g || 0,
          streak_days: profileData?.streak_days || 0,
          created_at: authData.user.created_at,
          updated_at: profileData?.updated_at || authData.user.updated_at || authData.user.created_at,
          session: authData.session,
        }

        return NextResponse.json({ user })
      }

      // Supabase Bağlantısı Yoksa (Yerel Fallback Modu)
      const mockUser = {
        id: "usr_local",
        email: normalizedEmail,
        full_name: "Kullanıcı",
        daily_calorie_target: 2000,
        target_protein_g: 150,
        target_carbs_g: 200,
        target_fat_g: 65,
        streak_days: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return NextResponse.json({ user: mockUser })
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
  } catch (err: any) {
    console.error("Auth API error:", err)
    return NextResponse.json({ error: err?.message || "Sunucu hatası" }, { status: 500 })
  }
}