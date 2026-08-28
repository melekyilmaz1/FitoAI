"use client"

import { motion, useReducedMotion } from "motion/react"
import { User as UserIcon, Target, Flame, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalculatedMetrics } from "@/lib/calculations"
import type { User } from "@/lib/types"

interface ProfileSectionProps {
  user: User | null
  profile: User | null
  metrics: CalculatedMetrics
  onSignOut: () => void
  onOpenAuth: () => void
}

export function ProfileSection({ user, profile, metrics, onSignOut, onOpenAuth }: ProfileSectionProps) {
  const reducedMotion = useReducedMotion()

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center"
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
          <UserIcon className="h-8 w-8" />
        </div>
        <p className="text-slate-600 font-medium mb-4">Profilini görüntülemek için giriş yap</p>
        <motion.button
          onClick={onOpenAuth}
          whileHover={reducedMotion ? undefined : { scale: 1.02 }}
          whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          Giriş Yap
        </motion.button>
      </motion.div>
    )
  }

  // Use profile data (from database) if available, otherwise fall back to calculated metrics
  const dailyCalories = profile?.daily_calorie_target || metrics.targetCalories
  const targetProtein = profile?.target_protein_g || metrics.macros.protein.grams
  const targetCarbs = profile?.target_carbs_g || metrics.macros.carbs.grams
  const targetFat = profile?.target_fat_g || metrics.macros.fat.grams
  const streakDays = profile?.streak_days || 0

  const stats = [
    {
      label: "Günlük Kalori",
      value: dailyCalories,
      unit: "kcal",
      icon: Flame,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      label: "Protein",
      value: targetProtein,
      unit: "g",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Karbonhidrat",
      value: targetCarbs,
      unit: "g",
      icon: Target,
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    {
      label: "Yağ",
      value: targetFat,
      unit: "g",
      icon: Target,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
  ]

  // Determine goal label
  const getGoalLabel = (goal: string | null | undefined) => {
    switch (goal) {
      case "lose": return "Kilo Verme"
      case "maintain": return "Formu Koruma"
      case "gain": return "Kilo Alma"
      default: return "Belirtilmemiş"
    }
  }

  // Get goal from localStorage
  const goal = typeof window !== "undefined" ?
    (() => {
      try {
        const stored = localStorage.getItem("fito_onboarding_data")
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed.goal
        }
      } catch {}
      return null
    })() : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8"
    >
      {/* User Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{user.email}</h2>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Üyelik: {new Date(user.created_at).toLocaleDateString("tr-TR")}
            </span>
            {goal && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                <Target className="h-3.5 w-3.5" />
                {getGoalLabel(goal)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Macro Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              whileHover={reducedMotion ? undefined : { scale: 1.02 }}
              className={cn("rounded-2xl p-4 text-center transition-all", stat.bgColor)}
            >
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              <p className="text-xs text-slate-400">{stat.unit}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Streak Section */}
      <div className="bg-emerald-50 rounded-2xl p-6 text-center mb-8">
        <p className="text-emerald-600 text-sm font-medium flex items-center justify-center gap-2">
          <Flame className="h-4 w-4" />
          Mevcut Seri
        </p>
        <p className="text-4xl font-bold text-emerald-700 mt-2">{streakDays} gün</p>
        <p className="text-emerald-600/70 text-xs mt-2">Bugün yemek kaydet, serini koru!</p>
      </div>

      {/* Additional Info Section */}
      <div className="bg-slate-50 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          Hedefleriniz
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Günlük Kalori Hedefi</span>
            <span className="font-bold text-emerald-600">{dailyCalories} kcal</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Protein Hedefi</span>
            <span className="font-bold text-blue-600">{targetProtein}g</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Karbonhidrat Hedefi</span>
            <span className="font-bold text-amber-600">{targetCarbs}g</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Yağ Hedefi</span>
            <span className="font-bold text-red-600">{targetFat}g</span>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="mt-8 flex gap-4">
        <motion.button
          onClick={onSignOut}
          whileHover={reducedMotion ? undefined : { scale: 1.02 }}
          whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
        >
          Çıkış Yap
        </motion.button>
      </div>
    </motion.div>
  )
}