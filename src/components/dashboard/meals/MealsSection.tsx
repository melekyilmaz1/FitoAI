"use client"

import { motion, useReducedMotion } from "motion/react"
import { Dumbbell, Plus } from "lucide-react"
import type { Meal } from "@/lib/types"
import { MealCard } from "./MealCard"

interface MealsSectionProps {
  meals: Meal[]
  onDelete: (id: string) => void
  onAdd: () => void
}

export function MealsSection({ meals, onDelete, onAdd }: MealsSectionProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Yemek Günlüğü</h2>
            <p className="text-xs text-white/50">{meals.length} kayıt</p>
          </div>
        </div>
        <motion.button
          onClick={onAdd}
          whileHover={reducedMotion ? undefined : { scale: 1.05 }}
          whileTap={reducedMotion ? undefined : { scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Ekle
        </motion.button>
      </div>

      {meals.length === 0 ? (
        <div className="bg-[#1B1D22] rounded-3xl p-12 shadow-sm border border-white/5 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/30 mb-4">
            <Dumbbell className="h-8 w-8" />
          </div>
          <p className="text-white font-medium">Henüz yemek kaydı yok</p>
          <p className="text-sm text-white/40 mt-2">Günlük beslenmeni takip etmek için yemek ekle</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal, idx) => (
            <MealCard key={meal.id || idx} meal={meal} index={idx} onDelete={onDelete} />
          ))}
        </div>
      )}
    </motion.div>
  )
}