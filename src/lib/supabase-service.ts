import { prisma } from "./db"
import type { Meal, AIChat, DailyNutritionSummary, WaterTracking } from "@/lib/types"

// Tarih parametresini güvenli bir şekilde string'e çeviren yardımcı fonksiyon
function parseDateString(date: any): string {
  if (!date) return new Date().toISOString().split("T")[0]
  if (typeof date === "string") return date.split("T")[0]
  if (date instanceof Date) return date.toISOString().split("T")[0]
  return new Date().toISOString().split("T")[0]
}

// ============================================
// MEALS SERVICE
// ============================================

export async function createMealAPI(
  meal: Omit<Meal, "id" | "user_id" | "created_at">,
  userId: string
): Promise<Meal | null> {
  try {
    const validUserId = userId || "usr_local"
    const createdMeal = await prisma.meal.create({
      data: {
        userId: validUserId,
        name: meal.meal_name || "",
        mealType: meal.meal_type || (meal as any).mealType || "Snack",
        calories: Number(meal.calories || 0),
        protein: Number(meal.protein_g || (meal as any).protein || 0),
        carbs: Number(meal.carbs_g || (meal as any).carbs || 0),
        fat: Number(meal.fat_g || (meal as any).fat || 0),
        portion: Number((meal as any).portion || 1),
        grammage: Number((meal as any).grammage || 100),
        date: parseDateString(meal.date),
      },
    })

    return {
      id: createdMeal.id,
      user_id: createdMeal.userId,
      meal_name: createdMeal.name,
      meal_type: createdMeal.mealType as any,
      calories: createdMeal.calories,
      protein_g: createdMeal.protein,
      carbs_g: createdMeal.carbs,
      fat_g: createdMeal.fat,
      date: createdMeal.date,
      created_at: createdMeal.createdAt.toISOString(),
    } as Meal
  } catch (error) {
    console.error("Error creating meal:", error)
    return null
  }
}

export async function getMealsAPI(userId: string, date?: Date | string): Promise<Meal[]> {
  try {
    const validUserId = userId || "usr_local"
    const dateStr = date ? parseDateString(date) : undefined

    const meals = await prisma.meal.findMany({
      where: {
        userId: validUserId,
        ...(dateStr ? { date: dateStr } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return meals.map((meal) => ({
      id: meal.id,
      user_id: meal.userId,
      meal_name: meal.name,
      meal_type: meal.mealType as any,
      calories: meal.calories,
      protein_g: meal.protein,
      carbs_g: meal.carbs,
      fat_g: meal.fat,
      date: meal.date,
      created_at: meal.createdAt.toISOString(),
    })) as Meal[]
  } catch (error) {
    console.error("Error fetching meals:", error)
    return []
  }
}

export async function updateMealAPI(mealId: string, updates: Partial<Meal>): Promise<Meal | null> {
  try {
    const updated = await prisma.meal.update({
      where: { id: mealId },
      data: {
        ...(updates.meal_name ? { name: updates.meal_name } : {}),
        ...(updates.meal_type ? { mealType: updates.meal_type } : {}),
        ...(updates.calories !== undefined ? { calories: Number(updates.calories) } : {}),
        ...(updates.protein_g !== undefined ? { protein: Number(updates.protein_g) } : {}),
        ...(updates.carbs_g !== undefined ? { carbs: Number(updates.carbs_g) } : {}),
        ...(updates.fat_g !== undefined ? { fat: Number(updates.fat_g) } : {}),
        ...(updates.date ? { date: parseDateString(updates.date) } : {}),
      },
    })

    return {
      id: updated.id,
      user_id: updated.userId,
      meal_name: updated.name,
      meal_type: updated.mealType as any,
      calories: updated.calories,
      protein_g: updated.protein,
      carbs_g: updated.carbs,
      fat_g: updated.fat,
      date: updated.date,
      created_at: updated.createdAt.toISOString(),
    } as Meal
  } catch (error) {
    console.error("Error updating meal:", error)
    return null
  }
}

export async function deleteMealAPI(mealId: string): Promise<boolean> {
  try {
    await prisma.meal.delete({
      where: { id: mealId },
    })
    return true
  } catch (error) {
    console.error("Error deleting meal:", error)
    return false
  }
}

export async function getDailyNutritionSummaryAPI(
  userId: string,
  date: Date | string
): Promise<DailyNutritionSummary | null> {
  try {
    const validUserId = userId || "usr_local"
    const dateStr = parseDateString(date)

    const meals = await prisma.meal.findMany({
      where: {
        userId: validUserId,
        date: dateStr,
      },
      select: {
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
      },
    })

    const total = meals.reduce(
      (acc, meal) => ({
        total_calories: acc.total_calories + meal.calories,
        total_protein_g: acc.total_protein_g + meal.protein,
        total_carbs_g: acc.total_carbs_g + meal.carbs,
        total_fat_g: acc.total_fat_g + meal.fat,
      }),
      { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0 }
    )

    return {
      user_id: validUserId,
      date: dateStr,
      ...total,
      meal_count: meals.length,
    }
  } catch (error) {
    console.error("Error fetching daily summary:", error)
    return null
  }
}

// ============================================
// WATER TRACKING SERVICE
// ============================================

export async function getWaterTrackingAPI(userId: string, date: Date | string): Promise<WaterTracking | null> {
  try {
    const validUserId = userId || "usr_local"
    const dateStr = parseDateString(date)

    const log = await prisma.waterLog.findUnique({
      where: {
        userId_date: {
          userId: validUserId,
          date: dateStr,
        },
      },
    })

    if (!log) {
      return {
        id: "temp_" + Date.now(),
        user_id: validUserId,
        date: dateStr,
        amount_ml: 0,
        created_at: new Date().toISOString(),
      } as WaterTracking
    }

    return {
      id: log.id,
      user_id: log.userId,
      date: log.date,
      amount_ml: log.amountMl,
      created_at: log.updatedAt.toISOString(),
    } as WaterTracking
  } catch (error) {
    console.error("Error fetching water tracking:", error)
    return null
  }
}

export async function upsertWaterTrackingAPI(
  userId: string,
  date: Date | string,
  amount_ml: number
): Promise<WaterTracking | null> {
  try {
    const validUserId = userId || "usr_local"
    const dateStr = parseDateString(date)

    const log = await prisma.waterLog.upsert({
      where: {
        userId_date: {
          userId: validUserId,
          date: dateStr,
        },
      },
      update: { amountMl: Number(amount_ml) },
      create: {
        userId: validUserId,
        date: dateStr,
        amountMl: Number(amount_ml),
      },
    })

    return {
      id: log.id,
      user_id: log.userId,
      date: log.date,
      amount_ml: log.amountMl,
      created_at: log.updatedAt.toISOString(),
    } as WaterTracking
  } catch (error) {
    console.error("Error upserting water tracking:", error)
    return null
  }
}

export async function getWaterHistoryAPI(userId: string, limit = 30): Promise<WaterTracking[]> {
  try {
    const validUserId = userId || "usr_local"
    const logs = await prisma.waterLog.findMany({
      where: { userId: validUserId },
      orderBy: { date: "desc" },
      take: limit,
    })

    return logs.map((log) => ({
      id: log.id,
      user_id: log.userId,
      date: log.date,
      amount_ml: log.amountMl,
      created_at: log.updatedAt.toISOString(),
    })) as WaterTracking[]
  } catch (error) {
    console.error("Error fetching water history:", error)
    return []
  }
}

// ============================================
// AI CHATS SERVICE
// ============================================

export async function createChatMessageAPI(
  message: string,
  sender: "user" | "ai",
  userId: string
): Promise<AIChat | null> {
  return {
    id: "chat_" + Date.now(),
    user_id: userId || "usr_local",
    message,
    sender,
    created_at: new Date().toISOString(),
  } as AIChat
}

export async function getChatHistoryAPI(userId: string, limit = 50): Promise<AIChat[]> {
  return []
}