export interface MacroTargets {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  
  export interface MealItem {
    protein_g: number
    carbs_g: number
    fat_g: number
    calories?: number
    total_grams?: number
  }
  
  /**
   * Makro değerlerinden toplam kaloriyi hesaplar (4-4-9 kuralı)
   */
  export function calculateCaloriesFromMacros(protein: number, carbs: number, fat: number): number {
    return Math.round(protein * 4 + carbs * 4 + fat * 9)
  }
  
  /**
   * 100g baz katsayısına göre yeni gramaja uygun makroları hesaplar
   */
  export function recalculateMacrosByGrams(
    currentMeal: MealItem,
    newGrams: number,
    base100g?: { protein: number; carbs: number; fat: number }
  ) {
    const safeGrams = Math.max(0, newGrams)
    const currentGrams = currentMeal.total_grams || 100
    const factor = safeGrams / 100
  
    // Eğer 100g baz değeri verilmediyse eldekilerden oranla
    const baseP = base100g?.protein ?? (currentMeal.protein_g / currentGrams) * 100
    const baseC = base100g?.carbs ?? (currentMeal.carbs_g / currentGrams) * 100
    const baseF = base100g?.fat ?? (currentMeal.fat_g / currentGrams) * 100
  
    const protein = Math.round(baseP * factor * 10) / 10
    const carbs = Math.round(baseC * factor * 10) / 10
    const fat = Math.round(baseF * factor * 10) / 10
    const calories = calculateCaloriesFromMacros(protein, carbs, fat)
  
    return {
      total_grams: safeGrams,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      calories,
    }
  }
  
  /**
   * Harris-Benedict / Mifflin-St Jeor mantığıyla günlük bazal metabolizma ve hedef makroları hesaplar
   */
  export function calculateDailyTargets(
    weightKg: number,
    heightCm: number,
    age: number,
    gender: "male" | "female",
    goal: "lose" | "maintain" | "gain" = "maintain"
  ): MacroTargets {
    // Mifflin-St Jeor BMR
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age
    bmr = gender === "male" ? bmr + 5 : bmr - 161
  
    // Orta düzey aktivite çarpanı (1.375)
    let targetCalories = Math.round(bmr * 1.375)
  
    if (goal === "lose") targetCalories -= 400
    if (goal === "gain") targetCalories += 400
  
    // Protein: kg başı ~2g, Yağ: kalorinin %25'i, Kalan: Karbonhidrat
    const protein = Math.round(weightKg * 2)
    const fat = Math.round((targetCalories * 0.25) / 9)
    const carbs = Math.round((targetCalories - (protein * 4 + fat * 9)) / 4)
  
    return {
      calories: targetCalories,
      protein,
      carbs,
      fat,
    }
  }