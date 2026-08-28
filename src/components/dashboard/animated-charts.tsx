"use client"

import React from "react"
import { motion, useReducedMotion } from "motion/react"

interface MacroData {
  label: string
  value: number
  percentage: number
  color: string
  bgColor: string
}

interface AnimatedMacroBarsProps {
  macros?: {
    protein?: { grams: number; calories: number; percentage: number }
    carbs?: { grams: number; calories: number; percentage: number }
    fat?: { grams: number; calories: number; percentage: number }
  }
  targetCalories?: number
}

const macroDataDefaults: MacroData[] = [
  { label: "Protein", value: 0, percentage: 0, color: "#10b981", bgColor: "#064e3b" },
  { label: "Karbonhidrat", value: 0, percentage: 0, color: "#f59e0b", bgColor: "#78350f" },
  { label: "Yağ", value: 0, percentage: 0, color: "#ef4444", bgColor: "#7f1d1d" },
]

export function AnimatedMacroBars({ macros }: AnimatedMacroBarsProps) {
  const reducedMotion = useReducedMotion()

  const data = [
    { ...macroDataDefaults[0], value: macros?.protein?.grams || 0, percentage: macros?.protein?.percentage || 0 },
    { ...macroDataDefaults[1], value: macros?.carbs?.grams || 0, percentage: macros?.carbs?.percentage || 0 },
    { ...macroDataDefaults[2], value: macros?.fat?.grams || 0, percentage: macros?.fat?.percentage || 0 },
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
                transition={{
                  delay: reducedMotion ? 0 : index * 0.1 + 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: macro.color }}
              />
              <span className="text-sm font-medium text-white">{macro.label}</span>
            </div>
            <div className="flex items-center gap-3 text-right min-w-[100px] justify-end">
              <span className="text-sm font-semibold text-white tabular-nums">{macro.value}g</span>
              <span className="text-xs font-semibold text-white/50">{macro.percentage}%</span>
            </div>
          </div>
          <div className="relative h-2.5 rounded-full overflow-hidden bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, macro.percentage))}%` }}
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
      className="relative p-5 rounded-2xl bg-[#1B1D22] border border-white/10 shadow-lg overflow-hidden group hover:border-white/20 transition-all"
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none transition-opacity group-hover:opacity-15"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-center justify-between z-10">
        <div>
          <p className="text-xs font-semibold text-slate-400">{label}</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : delay + 0.2, duration: 0.4 }}
            className="mt-1 flex items-baseline gap-1"
          >
            <span className="text-2xl font-black text-white tabular-nums">{value}</span>
            {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
          </motion.div>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </motion.div>
  )
}

interface WeightTimelineProps {
  timeline: Array<{ week: number; weight: number; date?: Date }>
  currentWeight: number
  targetWeight: number
}

export function WeightTimeline({ timeline, currentWeight, targetWeight }: WeightTimelineProps) {
  const reducedMotion = useReducedMotion()

  if (!timeline || timeline.length === 0) {
    return null
  }

  const weights = [...timeline.map((t) => t.weight), targetWeight]
  const minWeight = Math.min(...weights) - 1
  const maxWeight = Math.max(...weights) + 1
  const weightRange = maxWeight - minWeight || 1

  const getY = (weight: number) => {
    return 100 - ((weight - minWeight) / weightRange) * 100
  }

  const getX = (index: number) => {
    return timeline.length > 1 ? (index / (timeline.length - 1)) * 100 : 50
  }

  // Path SVG koordinatları üretme
  const pathPoints = timeline
    .map((t, i) => `${(getX(i) / 100) * 300},${(getY(t.weight) / 100) * 200}`)
    .join(" L ")

  const svgPath = pathPoints ? `M ${pathPoints}` : ""

  return (
    <div className="relative h-64 w-full bg-[#121316] p-4 rounded-2xl border border-white/5 overflow-hidden">
      {/* Yatay Izgara Çizgileri */}
      <div className="absolute inset-x-4 inset-y-4" aria-hidden="true">
        {[0, 25, 50, 75, 100].map((p) => (
          <div
            key={p}
            className="absolute left-0 right-0 border-t border-white/5"
            style={{ top: `${p}%` }}
          />
        ))}
      </div>

      {/* SVG Grafik Çizgisi */}
      <svg
        className="absolute inset-x-4 inset-y-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] overflow-visible pointer-events-none"
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="weight-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>

        {svgPath && (
          <motion.path
            d={svgPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 1.5, ease: "easeInOut" }}
          />
        )}
      </svg>

      {/* Veri Noktaları */}
      {timeline.map((t, i) => (
        <motion.div
          key={t.week}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: reducedMotion ? 0 : 0.6 + i * 0.08,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="absolute group z-10"
          style={{
            left: `calc(${getX(i)}% - 6px)`,
            top: `calc(${getY(t.weight)}% - 6px)`,
          }}
        >
          <div className="relative flex h-3 w-3 items-center justify-center cursor-pointer">
            <div className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#121316] shadow-lg" />
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-3 w-3 rounded-full border-2 border-emerald-500"
            />
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 border border-white/10 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
            Hafta {t.week}: {t.weight} kg
          </div>
        </motion.div>
      ))}

      {/* Hedef Kilo Çizgisi */}
      {targetWeight !== currentWeight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : 1 }}
          className="absolute left-4 right-4 border-t-2 border-dashed border-emerald-400/50 z-0"
          style={{
            top: `${getY(targetWeight)}%`,
          }}
        >
          <div className="absolute right-0 top-[-10px] px-2 py-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 rounded">
            Hedef: {targetWeight} kg
          </div>
        </motion.div>
      )}
    </div>
  )
}

interface WeeklyProgressProps {
  weeksToGoal: number
}

export function WeeklyProgress({ weeksToGoal }: WeeklyProgressProps) {
  const reducedMotion = useReducedMotion()
  const displayWeeks = Math.max(1, Math.min(weeksToGoal || 1, 12))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-400">Bugün</span>
        <span className="text-emerald-400">Hafta {displayWeeks}</span>
      </div>
      <div className="relative h-6 rounded-full bg-[#121316] border border-white/5 overflow-hidden p-0.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{
            duration: reducedMotion ? 0 : 1.2,
            delay: reducedMotion ? 0 : 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
        />
      </div>
      <div className="flex justify-between text-[11px] font-medium text-slate-500">
        <span>Başlangıç</span>
        <span>{displayWeeks} hafta sonra hedef</span>
      </div>
    </div>
  )
}