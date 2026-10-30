"use client"

import { motion, useReducedMotion } from "motion/react"
import { Flame, X } from "lucide-react"
import type { Meal } from "@/lib/types"

interface MealCardProps {
  meal: Meal
  index: number
  onDelete: (id: string) => void
}

export function MealCard({ meal, index, onDelete }: MealCardProps) {
  const reducedMotion = useReducedMotion()

  const colorStyles: Record<string, { bg: string; text: string; badgeBg: string }> = {
    "Kahvaltı": {
      bg: "bg-amber-500/20",
      text: "text-amber-400",
      badgeBg: "bg-amber-500/20",
    },
    "Öğle": {
      bg: "bg-orange-500/20",
      text: "text-orange-400",
      badgeBg: "bg-orange-500/20",
    },
    "Akşam": {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      badgeBg: "bg-emerald-500/20",
    },
    "Ara Öğün": {
      bg: "bg-violet-500/20",
      text: "text-violet-400",
      badgeBg: "bg-violet-500/20",
    },
  }

  const style = colorStyles[meal.meal_type || ""] || {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    badgeBg: "bg-emerald-500/20",
  }

  const anyMeal = meal as any
  let foodName = ""

  if (Array.isArray(anyMeal.foods) && anyMeal.foods.length > 0) {
    foodName = anyMeal.foods
      .map((f: any) => f.name || f.food_name || f.title || f.description)
      .filter(Boolean)
      .join(", ")
  } else if (Array.isArray(anyMeal.items) && anyMeal.items.length > 0) {
    foodName = anyMeal.items
      .map((i: any) => i.name || i.food_name || i.title || i.description)
      .filter(Boolean)
      .join(", ")
  } else {
    foodName =
      meal.meal_name ||
      anyMeal.description ||
      anyMeal.content ||
      anyMeal.notes ||
      anyMeal.name ||
      anyMeal.food_name ||
      anyMeal.title ||
      ""
  }

  const type = meal.meal_type || "Öğün"
  const cleanFood = foodName.trim()

  // "Öğle - Makarna" biçiminde başlık oluşturma
  const displayTitle = cleanFood && cleanFood.toLowerCase() !== type.toLowerCase()
    ? `${type} - ${cleanFood}`
    : type

  const calories = meal.calories ?? 0
  const protein = meal.protein_g ?? anyMeal.protein ?? 0
  const carbs = meal.carbs_g ?? anyMeal.carbs ?? 0
  const fat = meal.fat_g ?? anyMeal.fat ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#1B1D22] rounded-2xl p-5 shadow-sm border border-white/5 flex items-center gap-4"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.bg} ${style.text} shrink-0`}>
        <Flame className="h-6 w-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Öğle - Makarna şeklinde görüntüleme */}
          <h3 className="font-semibold text-white truncate">{displayTitle}</h3>
        </div>

        {/* Makrolar */}
        <p className="text-sm text-white/50 mt-1">
          {calories} kcal · {protein}g protein · {carbs}g karbonhidrat · {fat}g yağ
        </p>
      </div>

      <motion.button
        onClick={() => onDelete(meal.id)}
        whileHover={reducedMotion ? undefined : { scale: 1.1 }}
        whileTap={reducedMotion ? undefined : { scale: 0.9 }}
        className="p-2 rounded-lg text-white/40 hover:text-red-500 hover:bg-red-500/20 transition-colors shrink-0 cursor-pointer"
        aria-label="Sil"
      >
        <X className="h-5 w-5" />
      </motion.button>
    </motion.div>
  )
}