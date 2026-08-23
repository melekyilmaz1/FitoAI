import { createClient } from "@/lib/supabase"
import type { Profile, Meal, AIChat, DailyNutritionSummary } from "@/lib/types"
import type { FormData } from "@/components/onboarding/multi-step-form"
import { calculateMetrics } from "@/lib/calculations"

// ============================================
// PROFILES SERVICE
// ============================================

export async function createProfile(data: FormData, userId: string, email: string): Promise<Profile | null> {
  const supabase = createClient()
  const metrics = calculateMetrics(data)

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      email: email,
      full_name: null,
      daily_calorie_target: metrics.targetCalories,
      target_protein_g: metrics.macros.protein.grams,
      target_carbs_g: metrics.macros.carbs.grams,
      target_fat_g: metrics.macros.fat.grams,
      streak_days: 0,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating profile:", error)
    return null
  }

  return profile as Profile
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // No profile found
      return null
    }
    console.error("Error fetching profile:", error)
    return null
  }

  return data as Profile
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating profile:", error)
    return null
  }

  return data as Profile
}

// ============================================
// MEALS SERVICE
// ============================================

export async function createMeal(meal: Omit<Meal, "id" | "user_id" | "created_at">): Promise<Meal | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("meals")
    .insert({
      ...meal,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating meal:", error)
    return null
  }

  return data as Meal
}

export async function getMeals(userId: string, date?: Date): Promise<Meal[]> {
  const supabase = createClient()

  let query = supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    query = query.gte("created_at", startOfDay.toISOString()).lte("created_at", endOfDay.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching meals:", error)
    return []
  }

  return data as Meal[]
}

export async function updateMeal(mealId: string, updates: Partial<Meal>): Promise<Meal | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("meals")
    .update(updates)
    .eq("id", mealId)
    .select()
    .single()

  if (error) {
    console.error("Error updating meal:", error)
    return null
  }

  return data as Meal
}

export async function deleteMeal(mealId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", mealId)

  if (error) {
    console.error("Error deleting meal:", error)
    return false
  }

  return true
}

export async function getDailyNutritionSummary(userId: string, date: Date): Promise<DailyNutritionSummary | null> {
  const supabase = createClient()

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from("meals")
    .select("calories, protein_g, carbs_g, fat_g")
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())

  if (error) {
    console.error("Error fetching daily summary:", error)
    return null
  }

  const total = data.reduce(
    (acc, meal) => ({
      total_calories: acc.total_calories + meal.calories,
      total_protein_g: acc.total_protein_g + meal.protein_g,
      total_carbs_g: acc.total_carbs_g + meal.carbs_g,
      total_fat_g: acc.total_fat_g + meal.fat_g,
    }),
    { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0 }
  )

  return {
    user_id: userId,
    date: date.toISOString().split("T")[0],
    ...total,
    meal_count: data.length,
  }
}

// ============================================
// AI CHATS SERVICE
// ============================================

export async function createChatMessage(message: string, sender: "user" | "ai"): Promise<AIChat | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("ai_chats")
    .insert({
      user_id: user.id,
      message,
      sender,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating chat message:", error)
    return null
  }

  return data as AIChat
}

export async function getChatHistory(userId: string, limit = 50): Promise<AIChat[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("ai_chats")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching chat history:", error)
    return []
  }

  return (data as AIChat[]).reverse() // Return in chronological order
}

// ============================================
// STREAK SERVICE
// ============================================

export async function updateStreak(userId: string): Promise<number> {
  const supabase = createClient()

  // Get today's meals
  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())

  if (mealsError) {
    console.error("Error checking meals for streak:", mealsError)
    return 0
  }

  const hasLoggedToday = meals && meals.length > 0

  if (!hasLoggedToday) {
    return 0
  }

  // Get current streak
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("streak_days")
    .eq("user_id", userId)
    .single()

  if (profileError) {
    console.error("Error fetching profile for streak:", profileError)
    return 0
  }

  // Check if yesterday had meals to maintain streak
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const startOfYesterday = new Date(yesterday)
  startOfYesterday.setHours(0, 0, 0, 0)
  const endOfYesterday = new Date(yesterday)
  endOfYesterday.setHours(23, 59, 59, 999)

  const { data: yesterdayMeals, error: yesterdayError } = await supabase
    .from("meals")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", startOfYesterday.toISOString())
    .lte("created_at", endOfYesterday.toISOString())

  let newStreak = profile.streak_days
  if (yesterdayError || !yesterdayMeals || yesterdayMeals.length === 0) {
    // Streak broken or first day
    newStreak = 1
  } else {
    newStreak = profile.streak_days + 1
  }

  // Update streak
  await supabase
    .from("profiles")
    .update({ streak_days: newStreak })
    .eq("user_id", userId)

  return newStreak
}