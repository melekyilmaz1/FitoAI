"use client"

import { memo, useMemo } from "react"
import { motion } from "motion/react"
import { Droplets, Sparkles, Flame, Plus } from "lucide-react"
import { CalculatedMetrics } from "@/lib/calculations"
import { FormData } from "@/components/onboarding/multi-step-form"
import { Meal } from "@/lib/types"

const MOTIVATION_QUOTES = [
  "Güne büyük bir bardak su ile başlayarak metabolizmanı uyandır!",
  "Kas gelişimi antrenman kadar kaliteli uyku ve protein alımıyla tamamlanır.",
  "Küçük ve tutarlı adımlar, uzun vadede büyük değişimler yaratır.",
  "Vücudunu dinle, ona ihtiyacı olan besini sağla.",
  "Başarılı bir gün, planlanmış bir öğünle başlar."
]

interface SummaryTabProps {
  metrics: CalculatedMetrics
  data: FormData
  meals: Meal[]
  waterMl?: number
  onAddWater?: (amount?: number) => void
  onAddMeal?: () => void
}

// Spesifik yemek ismini (örn: "yulaf") güvenli şekilde çıkartan fonksiyon
function getMealDisplayName(meal: any): string {
  if (!meal) return "Öğün"

  const type = (meal.meal_type || meal.type || "Öğün").trim()

  // Olası tüm metin ve kullanıcı input alanlarını derinlemesine tara
  let foodName =
    meal.meal_name ||
    meal.food_name ||
    meal.name ||
    meal.title ||
    meal.input ||
    meal.query ||
    meal.original_input ||
    meal.description ||
    meal.text ||
    meal.prompt ||
    meal.details ||
    ""

  // Nested (içe içe) obje kontrolü
  if (!foodName && meal.meal && typeof meal.meal === "object") {
    foodName =
      meal.meal.meal_name ||
      meal.meal.name ||
      meal.meal.food_name ||
      meal.meal.input ||
      ""
  }

  // Dizi (array) / Liste kontrolü
  if (!foodName && Array.isArray(meal.foods) && meal.foods.length > 0) {
    foodName = meal.foods
      .map((f: any) =>
        typeof f === "string"
          ? f
          : f.name || f.food_name || f.title || f.meal_name || f.input
      )
      .filter(Boolean)
      .join(", ")
  }

  const cleanFood = typeof foodName === "string" ? foodName.trim() : ""

  // Eğer yemek ismi yoksa veya sadece jenerik "Yemek"/"Öğün" metninden ibaretse öğün tipini dön
  if (
    !cleanFood ||
    cleanFood.toLowerCase() === "yemek" ||
    cleanFood.toLowerCase() === "öğün"
  ) {
    return type
  }

  // Doğrudan yemeğin kendi ismini dön (Örn: "yulaf")
  return cleanFood
}

function SummaryTabInner({
  metrics,
  meals,
  waterMl = 0,
  onAddWater,
  onAddMeal,
}: SummaryTabProps) {
  const motivationQuote = useMemo(() => {
    const index = new Date().getDate() % MOTIVATION_QUOTES.length
    return MOTIVATION_QUOTES[index]
  }, [])

  // Bugünün öğünlerini saat dilimi kaymalarından etkilenmeden filtrele
  const todayMeals = useMemo(() => {
    const todayStr = new Date().toDateString()

    return meals.filter((m) => {
      const rawDate = m.created_at || (m as any).date
      if (!rawDate) return true // Tarih eksikse varsayılan olarak göster
      return new Date(rawDate).toDateString() === todayStr
    })
  }, [meals])

  const consumed = useMemo(() => {
    return todayMeals.reduce(
      (acc, curr) => ({
        calories: acc.calories + (curr.calories || 0),
        protein: acc.protein + (curr.protein_g ?? (curr as any).protein ?? 0),
        carbs: acc.carbs + (curr.carbs_g ?? (curr as any).carbs ?? 0),
        fat: acc.fat + (curr.fat_g ?? (curr as any).fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [todayMeals])

  const targetCal = metrics.targetCalories || 1873
  const remainingCal = Math.max(0, targetCal - consumed.calories)
  const calPercent = Math.min(
    100,
    Math.round((consumed.calories / targetCal) * 100)
  )

  return (
    <div className="space-y-6 py-2">
      {/* 1. DAIRESEL KALORİ HALKASI */}
      <div className="flex flex-col items-center justify-center pt-2 pb-2">
        <div className="relative w-60 h-60 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-[#221c1a]"
              strokeWidth="5"
              fill="transparent"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-[#e5502c]"
              strokeWidth="5"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * calPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - (264 * calPercent) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {Math.round(consumed.calories)}
            </span>
            <span className="text-xs text-zinc-400 mt-1 font-medium">
              / {targetCal.toLocaleString()} kcal
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-2">
              <Flame className="w-3.5 h-3.5 fill-emerald-400" />
              <span>{remainingCal.toLocaleString()} kaldı</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAKRO HALKALARI */}
      <div className="grid grid-cols-3 gap-3">
        <MacroCard
          title="PROTEİN"
          current={consumed.protein}
          total={metrics.macros.protein.grams}
          color="stroke-[#e5502c]"
        />
        <MacroCard
          title="KARB."
          current={consumed.carbs}
          total={metrics.macros.carbs.grams}
          color="stroke-[#e5502c]"
        />
        <MacroCard
          title="YAĞ"
          current={consumed.fat}
          total={metrics.macros.fat.grams}
          color="stroke-[#e5502c]"
        />
      </div>

      {/* 3. BUGÜNKÜ ÖĞÜNLER */}
      <div className="bg-[#1B1D22] border border-white/5 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Bugünkü Öğünler</h3>
          <span className="text-xs text-[#e5502c] font-semibold cursor-pointer hover:underline">
            Tümü
          </span>
        </div>

        {todayMeals.length === 0 ? (
          <div className="bg-[#131418] border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#1c1d22] flex items-center justify-center mb-3 border border-white/10">
              <div className="w-12 h-12 rounded-full bg-[#2a2c33] border border-white/5" />
            </div>
            <h4 className="text-sm font-semibold text-white">
              Henüz öğün kaydetmedin
            </h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Ne yediğini yaz, yapay zeka kalorini hesaplasın.
            </p>
            {onAddMeal && (
              <button
                onClick={onAddMeal}
                className="mt-4 px-5 py-2.5 bg-[#e5502c] hover:bg-[#d44523] text-white font-medium text-xs rounded-xl transition-all shadow-lg shadow-[#e5502c]/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                İlk öğününü kaydet
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayMeals.map((meal) => {
              const anyMeal = meal as any
              const displayTitle = getMealDisplayName(meal)

              const protein = Math.round(
                meal.protein_g ?? anyMeal.protein ?? 0
              )
              const carbs = Math.round(meal.carbs_g ?? anyMeal.carbs ?? 0)
              const fat = Math.round(meal.fat_g ?? anyMeal.fat ?? 0)

              return (
                <div
                  key={meal.id || Math.random()}
                  className="bg-[#131418] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-white truncate capitalize">
                        {displayTitle}
                      </div>
                    </div>

                    <div className="text-xs text-zinc-400 mt-0.5">
                      P: {protein}g · K: {carbs}g · Y: {fat}g
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[#e5502c] shrink-0 text-right">
                    {Math.round(meal.calories)}{" "}
                    <span className="text-xs font-normal text-zinc-400">
                      kcal
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. GÜNÜN İPUCU */}
      <div className="bg-[#1B1D22] border border-white/5 rounded-3xl p-5 flex gap-4 items-center shadow-sm">
        <div className="bg-[#e5502c]/10 p-3 rounded-2xl shrink-0">
          <Sparkles className="h-5 w-5 text-[#e5502c]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white mb-0.5">Günün İpucu</h4>
          <p className="text-xs text-zinc-400 italic">"{motivationQuote}"</p>
        </div>
      </div>

      {/* 5. SU TAKİBİ */}
      <div className="bg-[#1B1D22] border border-white/5 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" /> Su Takibi
          </h4>
          <button
            onClick={() => onAddWater?.(250)}
            className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            +250ml
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-2xl font-extrabold text-blue-500">
            {waterMl}{" "}
            <span className="text-xs text-zinc-400 font-normal">ml</span>
          </div>
          <div className="flex-1 h-3 bg-[#131418] rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (waterMl / 2500) * 100)}%` }}
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const MacroCard = memo(function MacroCard({
  title,
  current,
  total,
  color,
}: {
  title: string
  current: number
  total: number
  color: string
}) {
  const safeCurrent = Math.round(current)
  const safeTotal = Math.round(total)

  const realPercent = Math.round((safeCurrent / (safeTotal || 1)) * 100)
  const strokePercent = Math.min(100, realPercent)

  return (
    <div className="bg-[#1B1D22] border border-white/5 rounded-3xl p-3.5 flex flex-col items-center justify-center text-center shadow-sm">
      <span className="text-[10px] font-bold tracking-wider text-zinc-400 mb-2">
        {title}
      </span>

      <div className="relative w-14 h-14 flex items-center justify-center mb-2">
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox="0 0 36 36"
        >
          <path
            className="stroke-[#131418]"
            strokeWidth="3.5"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={color}
            strokeWidth="3.5"
            strokeDasharray={`${strokePercent}, 100`}
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="absolute text-[11px] font-bold text-white">
          {realPercent}%
        </span>
      </div>

      <div className="text-xs font-bold text-white">
        {safeCurrent}g{" "}
        <span className="text-[10px] text-zinc-500 font-normal">
          / {safeTotal}g
        </span>
      </div>
    </div>
  )
})

export const SummaryTab = memo(SummaryTabInner)
SummaryTab.displayName = "SummaryTab"