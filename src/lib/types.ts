export interface User {
  id: string
  email: string
  full_name: string | null
  daily_calorie_target: number
  target_protein_g: number
  target_carbs_g: number
  target_fat_g: number
  streak_days: number
  created_at: string
  updated_at: string
}

export interface Meal {
  id: string
  user_id: string
  meal_name: string
  meal_type: "Kahvaltı" | "Öğle" | "Akşam" | "Ara Öğün"
  portion_count: number
  total_grams: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  image_url: string | null
  date: string // YYYY-MM-DD format
  created_at: string
}

export interface AIChat {
  id: string
  user_id: string
  message: string
  sender: "user" | "ai"
  created_at: string
}

export interface DailyNutritionSummary {
  user_id: string
  date: string
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  meal_count: number
}

export interface WaterTracking {
  id: string
  user_id: string
  date: string // YYYY-MM-DD format
  amount_ml: number
  created_at: string
  updated_at: string
}

export interface FormData {
  gender: "male" | "female" | null
  age: number | null
  height: number | null
  weight: number | null
  targetWeight: number | null
  activityLevel: number | null
  goal: "lose" | "maintain" | "gain" | null
}