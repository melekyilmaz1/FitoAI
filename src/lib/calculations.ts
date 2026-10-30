import { FormData } from "@/components/onboarding/multi-step-form"

export interface CalculatedMetrics {
  bmr: number
  tdee: number
  targetCalories: number
  macros: {
    protein: { grams: number; calories: number; percentage: number }
    carbs: { grams: number; calories: number; percentage: number }
    fat: { grams: number; calories: number; percentage: number }
  }
  weeksToGoal: number
  weeklyWeightChange: number
}

export function calculateMetrics(data: FormData): CalculatedMetrics {
  // BMR - Mifflin-St Jeor Equation
  let bmr: number
  if (data.gender === "male") {
    bmr = 10 * data.currentWeight + 6.25 * data.height - 5 * data.age + 5
  } else if (data.gender === "female") {
    bmr = 10 * data.currentWeight + 6.25 * data.height - 5 * data.age - 161
  } else {
    // Average of male/female
    const male = 10 * data.currentWeight + 6.25 * data.height - 5 * data.age + 5
    const female = 10 * data.currentWeight + 6.25 * data.height - 5 * data.age - 161
    bmr = (male + female) / 2
  }

  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    active: 1.55,
  }

  const multiplier = activityMultipliers[data.activityLevel || "sedentary"]
  const tdee = Math.round(bmr * multiplier)

  // Target calories based on goal
  let targetCalories = tdee
  const weightDiff = data.targetWeight - data.currentWeight

  // ~7700 kcal per kg of fat
  const caloriesPerKg = 7700

  if (data.goal === "weight_loss") {
    // Moderate deficit: 500 kcal/day = ~0.5 kg/week
    targetCalories = tdee - 500
  } else if (data.goal === "muscle_gain") {
    // Moderate surplus: 300 kcal/day
    targetCalories = tdee + 300
  } else {
    // Maintenance
    targetCalories = tdee
  }

  // Macro distribution based on goal
  let proteinPct = 0.3, carbsPct = 0.4, fatPct = 0.3

  if (data.goal === "weight_loss") {
    proteinPct = 0.35; carbsPct = 0.35; fatPct = 0.30
  } else if (data.goal === "muscle_gain") {
    proteinPct = 0.30; carbsPct = 0.45; fatPct = 0.25
  } else if (data.goal === "maintenance") {
    proteinPct = 0.30; carbsPct = 0.40; fatPct = 0.30
  }

  // Adjust for keto
  if (data.diet === "keto") {
    proteinPct = 0.25; carbsPct = 0.05; fatPct = 0.70
  }

  const proteinGrams = Math.round((targetCalories * proteinPct) / 4)
  const carbsGrams = Math.round((targetCalories * carbsPct) / 4)
  const fatGrams = Math.round((targetCalories * fatPct) / 9)

  // Weeks to goal
  const weeklyChange = targetCalories - tdee // negative for loss, positive for gain
  const weeklyWeightChange = weeklyChange * 7 / caloriesPerKg
  const weeksToGoal = weightDiff !== 0 ? Math.ceil(Math.abs(weightDiff) / Math.abs(weeklyWeightChange)) : 0

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    macros: {
      protein: { grams: proteinGrams, calories: proteinGrams * 4, percentage: Math.round(proteinPct * 100) },
      carbs: { grams: carbsGrams, calories: carbsGrams * 4, percentage: Math.round(carbsPct * 100) },
      fat: { grams: fatGrams, calories: fatGrams * 9, percentage: Math.round(fatPct * 100) },
    },
    weeksToGoal: Math.max(weeksToGoal, 1),
    weeklyWeightChange: Math.round(weeklyWeightChange * 100) / 100,
  }
}

export function getGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    weight_loss: "Kilo Verme",
    muscle_gain: "Kas Yapma",
    maintenance: "Formu Koruma",
  }
  return labels[goal] || goal
}

export function getActivityLabel(level: string): string {
  const labels: Record<string, string> = {
    sedentary: "Masa Başında",
    light: "Hafif Hareketli",
    active: "Çok Hareketli",
  }
  return labels[level] || level
}

export function getDietLabel(diet: string): string {
  const labels: Record<string, string> = {
    standard: "Standart",
    vegetarian: "Vejetaryen",
    vegan: "Vegan",
    keto: "Keto",
  }
  return labels[diet] || diet
}

export function generateTimeline(weeks: number, goal: string, currentWeight: number, targetWeight: number) {
  const timeline = []
  const weightDiff = targetWeight - currentWeight
  const weeklyChange = weightDiff / weeks

  for (let i = 0; i <= weeks; i++) {
    const weekWeight = currentWeight + weeklyChange * i
    timeline.push({
      week: i,
      weight: Math.round(weekWeight * 10) / 10,
      date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
    })
  }
  return timeline
}