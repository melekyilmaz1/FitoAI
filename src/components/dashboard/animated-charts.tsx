"use client"

import React from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

interface MacroData {
  label: string
  value: number
  percentage: number
  color: string
  bgColor: string
}

interface AnimatedMacroBarsProps {
  macros: {
    protein: { grams: number; calories: number; percentage: number }
    carbs: { grams: number; calories: number; percentage: number }
    fat: { grams: number; calories: number; percentage: number }
  }
  targetCalories: number
}

const macroData: MacroData[] = [
  { label: "Protein", value: 0, percentage: 0, color: "#10b981", bgColor: "#d1fae5" },
  { label: "Karbonhidrat", value: 0, percentage: 0, color: "#f59e0b", bgColor: "#fef3c7" },
  { label: "Yağ", value: 0, percentage: 0, color: "#ef4444", bgColor: "#fee2e2" },
]

export function AnimatedMacroBars({ macros, targetCalories }: AnimatedMacroBarsProps) {
  const reducedMotion = useReducedMotion()

  const data = [
    { ...macroData[0], value: macros.protein.grams, percentage: macros.protein.percentage },
    { ...macroData[1], value: macros.carbs.grams, percentage: macros.carbs.percentage },
    { ...macroData[2], value: macros.fat.grams, percentage: macros.fat.percentage },
  ]

  return (
    <div className="space-y-4">
      {data.map((macro, index) => (
        <motion.div
          key={macro.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.5,
            delay: reducedMotion ? 0 : index * 0.1,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: reducedMotion ? 0 : index * 0.1 + 0.3, type: "spring", stiffness: 300, damping: 20 }}
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: macro.color }}
              />
              <span className="text-sm font-medium text-slate-700">{macro.label}</span>
            </div>
            <div className="flex items-center gap-3 text-right min-w-[100px]">
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {macro.value}g
              </span>
              <span className="text-sm text-slate-500">
                {macro.percentage}%
              </span>
            </div>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${macro.percentage}%` }}
              transition={{
                duration: reducedMotion ? 0 : 1.2,
                delay: reducedMotion ? 0 : index * 0.1 + 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="h-full rounded-full"
              style={{ backgroundColor: macro.color }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  color: string
  bgColor: string
  delay?: number
}

export function StatCard({ label, value, unit, icon, color, bgColor, delay = 0 }: StatCardProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.5,
        delay: reducedMotion ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="relative p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div 
        className="absolute inset-0 bg-gradient-to-br opacity-5 pointer-events-none" 
        style={{ backgroundColor: color }} 
      />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : delay + 0.2, duration: 0.4 }}
            className="mt-1 flex items-baseline gap-1"
          >
            <span className="text-3xl font-bold text-slate-900 tabular-nums">{value}</span>
            {unit && <span className="text-sm text-slate-500">{unit}</span>}
          </motion.div>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: bgColor }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </motion.div>
  )
}

interface WeightTimelineProps {
  timeline: Array<{ week: number; weight: number; date: Date }>
  currentWeight: number
  targetWeight: number
}

export function WeightTimeline({ timeline, currentWeight, targetWeight }: WeightTimelineProps) {
  const reducedMotion = useReducedMotion()

  if (!timeline || timeline.length === 0) {
    return null
  }

  const weights = timeline.map(t => t.weight)
  const minWeight = Math.min(...weights) - 1
  const maxWeight = Math.max(...weights) + 1
  const weightRange = maxWeight - minWeight || 1

  const getY = (weight: number) => {
    return 100 - ((weight - minWeight) / weightRange) * 100
  }

  const getX = (index: number) => {
    return timeline.length > 1 ? (index / (timeline.length - 1)) * 100 : 50
  }

  const pathPoints = timeline.map((t, i) => `${getX(i)}% ${getY(t.weight)}%`).join(" ")
  const areaPath = `${pathPoints} ${getX(timeline.length - 1)}% 100% ${getX(0)}% 100%`

  return (
    <div className="relative h-64">
      <div className="absolute inset-0" aria-hidden="true">
        {[0, 25, 50, 75, 100].map((p) => (
          <div
            key={p}
            className="absolute left-0 right-0 border-t border-slate-100"
            style={{ top: `${p}%` }}
          />
        ))}
      </div>

      {timeline.map((t, i) => (
        <motion.div
          key={t.week}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: reducedMotion ? 0 : 0.8 + i * 0.05,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="absolute group"
          style={{
            left: `calc(${getX(i)}% - 6px)`,
            top: `calc(${getY(t.weight)}% - 6px)`,
          }}
        >
          <div className="relative z-10 flex h-3 w-3 items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-lg" />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-3 w-3 rounded-full border-2 border-emerald-500" 
            />
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            Hafta {t.week}: {t.weight} kg
          </div>
        </motion.div>
      ))}

      {targetWeight !== currentWeight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 1.2 }}
          className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-300"
          style={{
            top: `${getY(targetWeight)}%`,
          }}
        >
          <div className="absolute right-0 top-[-10px] px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded">
            Hedef: {targetWeight} kg
          </div>
        </motion.div>
      )}

      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="weight-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

interface WeeklyProgressProps {
  weeksToGoal: number
}

export function WeeklyProgress({ weeksToGoal }: WeeklyProgressProps) {
  const reducedMotion = useReducedMotion()
  const displayWeeks = Math.max(1, Math.min(weeksToGoal, 12))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Bugün</span>
        <span className="text-slate-600">Hafta {displayWeeks}</span>
      </div>
      <div className="relative h-8 rounded-full bg-slate-100 overflow-hidden">
        {[...Array(displayWeeks)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${100 / displayWeeks}%` }}
            transition={{
              duration: reducedMotion ? 0 : 0.3,
              delay: reducedMotion ? 0 : 0.8 + i * 0.08,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="absolute inset-y-0 bg-gradient-to-r from-emerald-400 to-emerald-600"
            style={{ left: `${(i / displayWeeks) * 100}%` }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: reducedMotion ? 0 : 1.5, type: "spring", stiffness: 300, damping: 20 }}
          className="absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white border-2 border-emerald-500 shadow"
          style={{ left: "0%" }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>Başlangıç</span>
        <span>{displayWeeks} hafta sonra hedef</span>
      </div>
    </div>
  )
}