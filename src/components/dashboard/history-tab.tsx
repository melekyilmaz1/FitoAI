"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "motion/react"
import { ChevronLeft, ChevronRight, Calendar, Flame, Utensils, Droplet, Sunrise, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Meal } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

interface HistoryTabProps {
  meals: Meal[]
  waterMl?: number
}

export function HistoryTab({ meals, waterMl: currentWaterMl = 0 }: HistoryTabProps) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMonth, setViewMonth] = useState<Date>(new Date())
  const [waterMl, setWaterMl] = useState<number>(currentWaterMl)
  const [isLoadingWater, setIsLoadingWater] = useState(false)

  const isTodaySelected = useMemo(() => {
    return selectedDate.toDateString() === new Date().toDateString()
  }, [selectedDate])

  // Generate last 7 days for horizontal date selector
  const last7Days = useMemo(() => {
    const days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      days.push(date)
    }
    return days
  }, [])

  // Get meals for selected date from props
  const selectedDateMeals = useMemo(() => {
    const dateString = selectedDate.toDateString()
    return meals.filter(m => new Date(m.created_at).toDateString() === dateString)
  }, [meals, selectedDate])

  // Fetch water data for selected date (or use prop if today is selected)
  useEffect(() => {
    if (isTodaySelected) {
      setWaterMl(currentWaterMl)
      return
    }

    const fetchWater = async () => {
      if (!user) return

      setIsLoadingWater(true)
      try {
        const dateStr = selectedDate.toISOString().split("T")[0]
        const response = await fetch(`/api/user/water?userId=${user.id}&date=${dateStr}`)
        const data = await response.json()
        if (data.water && data.water.length > 0) {
          setWaterMl(data.water[0].amount_ml)
        } else {
          setWaterMl(0)
        }
      } catch (error) {
        console.error("Error fetching water for date:", error)
        setWaterMl(0)
      } finally {
        setIsLoadingWater(false)
      }
    }

    fetchWater()
  }, [user, selectedDate, isTodaySelected, currentWaterMl])

  // Group meals by meal type for selected date
  const mealsByType = useMemo(() => {
    const groups: Record<string, Meal[]> = {}
    const mealTypes = ["Kahvaltı", "Öğle", "Akşam", "Ara Öğün"]

    mealTypes.forEach(type => {
      groups[type] = selectedDateMeals.filter(m => m.meal_type === type)
    })
    return groups
  }, [selectedDateMeals])

  // Calculate totals for selected date
  const totals = useMemo(() => {
    return selectedDateMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein_g,
        carbs: acc.carbs + meal.carbs_g,
        fat: acc.fat + meal.fat_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [selectedDateMeals])

  const formatDayLabel = (date: Date) => {
    const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
    return `${dayNames[date.getDay()]} ${date.getDate()}`
  }

  const formatFullDate = (date: Date) => {
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ]
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const navigateMonth = (direction: number) => {
    setViewMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + direction)
      return newMonth
    })
  }

  const renderMealIcon = (type: string, className = "h-4 w-4") => {
    switch (type) {
      case "Kahvaltı":
        return <Sunrise className={className} />
      case "Öğle":
        return <Flame className={className} />
      case "Akşam":
        return <Utensils className={className} />
      case "Ara Öğün":
        return <Moon className={className} />
      default:
        return <Flame className={className} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Selector - Horizontal Scroll */}
      <div className="bg-[#1B1D22] rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Geçmiş</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-white font-medium text-sm">
              {viewMonth.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Date Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {last7Days.map((day, index) => (
            <motion.button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-3 rounded-2xl min-w-[64px] transition-all duration-200 flex-shrink-0 cursor-pointer",
                isSelected(day)
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                isToday(day) && !isSelected(day) && "ring-2 ring-amber-500/50"
              )}
            >
              <span className="text-xs font-medium uppercase tracking-wider">
                {formatDayLabel(day)}
              </span>
              <span className="text-lg font-bold">
                {day.getDate()}
              </span>
              {isToday(day) && !isSelected(day) && (
                <span className="text-xs text-amber-400">Bugün</span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Selected Date Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-white/50">Seçili Gün</p>
            <p className="font-semibold text-white">{formatFullDate(selectedDate)}</p>
          </div>
        </div>
        {totals.calories > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{totals.calories} kcal</p>
            <p className="text-xs text-white/40">Toplam</p>
          </div>
        )}
      </div>

      {/* Water Tracking Summary for Selected Date */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1B1D22] rounded-2xl p-4 border border-white/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Droplet className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Su Tüketimi</h4>
              <p className="text-xs text-white/40">
                {isLoadingWater ? "Yükleniyor..." : `${waterMl} ml`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-sky-400">
              {waterMl > 0 ? `${Math.round((waterMl / 2500) * 100)}%` : "0%"}
            </p>
            <p className="text-xs text-white/40">Hedef</p>
          </div>
        </div>
        <div className="w-full h-2 bg-[#121316] rounded-full overflow-hidden mt-3 border border-white/5">
          <div
            className="h-full bg-sky-400 transition-all duration-300"
            style={{ width: `${Math.min(100, (waterMl / 2500) * 100)}%` }}
          />
        </div>
      </motion.div>

      {/* Meals List or Empty State */}
      {selectedDateMeals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1B1D22] rounded-2xl p-12 border border-white/5 text-center"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/30 mb-4">
            <Flame className="h-8 w-8" />
          </div>
          <p className="text-white font-medium mb-2">Bu güne ait kayıt yok</p>
          <p className="text-sm text-white/40 mb-6">Henüz bu gün için bir yemek eklememişsin</p>
        </motion.div>
      ) : (
        <>
          {/* Daily Totals Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1B1D22] rounded-2xl p-4 border border-white/5"
          >
            <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              Günlük Toplamlar
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-white">{totals.calories}</p>
                <p className="text-xs text-white/40">kcal</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-emerald-400">{totals.protein.toFixed(1)}</p>
                <p className="text-xs text-white/40">g Protein</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-amber-400">{totals.carbs.toFixed(1)}</p>
                <p className="text-xs text-white/40">g Karbonhidrat</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <p className="text-2xl font-bold text-red-400">{totals.fat.toFixed(1)}</p>
                <p className="text-xs text-white/40">g Yağ</p>
              </div>
            </div>
          </motion.div>

          {/* Meals by Type */}
          <div className="space-y-4">
            {["Kahvaltı", "Öğle", "Akşam", "Ara Öğün"].map((type, typeIndex) => {
              const typeMeals = mealsByType[type]
              const typeColors = {
                "Kahvaltı": "amber",
                "Öğle": "orange",
                "Akşam": "emerald",
                "Ara Öğün": "violet",
              }
              const color = typeColors[type as keyof typeof typeColors] || "emerald"

              if (typeMeals.length === 0) return null

              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: typeIndex * 0.08 }}
                  className="bg-[#1B1D22] rounded-2xl border border-white/5 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${color}-500/20 text-${color}-400`}>
                      {renderMealIcon(type)}
                    </div>
                    <h4 className="font-semibold text-white">{type}</h4>
                    <span className="ml-auto text-sm text-white/40">
                      {typeMeals.reduce((sum, m) => sum + m.calories, 0)} kcal
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    {typeMeals.map((meal, mealIndex) => (
                      <motion.div
                        key={meal.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: typeIndex * 0.08 + mealIndex * 0.05 }}
                        className="bg-white/5 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-white truncate">{meal.meal_name}</h5>
                            <p className="text-sm text-white/50 mt-1">
                              {meal.protein_g}g P · {meal.carbs_g}g K · {meal.fat_g}g Y
                            </p>
                            {meal.total_grams > 0 && (
                              <p className="text-xs text-white/30 mt-1">
                                {meal.total_grams}g · {meal.portion_count} porsiyon
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-white">{meal.calories} kcal</p>
                            <p className="text-xs text-white/40">
                              {new Date(meal.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}