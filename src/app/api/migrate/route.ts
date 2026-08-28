import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const legacyUsers = [
  {
    id: "a80accb6-3257-4f55-a56a-318f89c03ea5",
    email: "m@gmail.com",
    password_hash: "$2b$12$V9alMCsKX8nLze0GCKXufOInHT64KhA5faFLRFO39Sr4Kk7LkuGYW",
    full_name: null,
    daily_calorie_target: 0,
    target_protein_g: 0,
    target_carbs_g: 0,
    target_fat_g: 0,
    streak_days: 0,
    created_at: "2026-08-25T17:44:25.283Z",
    updated_at: "2026-08-26T20:06:00.801Z"
  },
  {
    id: "5a6e5ca9-8a65-4374-8697-de4ae73220d7",
    email: "mel@gmail.com",
    password_hash: "$2b$12$3PV2I1lCE0a/0eWPAOqXCO9YAB8QoSHLTXRRPue8./Ftx9nIDbWSS",
    full_name: null,
    daily_calorie_target: 2396,
    target_protein_g: 180,
    target_carbs_g: 270,
    target_fat_g: 67,
    streak_days: 0,
    created_at: "2026-08-27T08:19:09.719Z",
    updated_at: "2026-08-27T08:19:09.719Z"
  },
  {
    id: "71823b9d-568d-4950-92a5-442ee9cccfaa",
    email: "m1111@gmail.com",
    password_hash: "$2b$12$sO6YIFy1KglRnbnX32ugS.M37lLBiXi5RkQswAFWHBdoVFyMFeVLa",
    full_name: null,
    daily_calorie_target: 2396,
    target_protein_g: 180,
    target_carbs_g: 270,
    target_fat_g: 67,
    streak_days: 0,
    created_at: "2026-08-27T11:49:33.400Z",
    updated_at: "2026-08-27T11:49:33.400Z"
  },
  {
    id: "7bf2035d-b55a-4723-bc16-ead59a035965",
    email: "melek@gmail.com",
    password_hash: "$2b$12$zN6VeMZ8coxVikVyofK2Suaf9iviKE2iAUjGlraSaCXeLapSar3.u",
    full_name: null,
    daily_calorie_target: 2396,
    target_protein_g: 180,
    target_carbs_g: 270,
    target_fat_g: 67,
    streak_days: 0,
    created_at: "2026-08-27T11:59:15.043Z",
    updated_at: "2026-08-27T11:59:15.043Z"
  }
]

export async function GET() {
  try {
    for (const user of legacyUsers) {
      await (prisma as any).user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          password_hash: user.password_hash,
          full_name: user.full_name,
          daily_calorie_target: user.daily_calorie_target,
          target_protein_g: user.target_protein_g,
          target_carbs_g: user.target_carbs_g,
          target_fat_g: user.target_fat_g,
          streak_days: user.streak_days,
          created_at: new Date(user.created_at),
          updated_at: new Date(user.updated_at),
        },
      })
    }
    return NextResponse.json({ message: "Eski kullanıcılar veritabanına başarıyla aktarıldı!" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}