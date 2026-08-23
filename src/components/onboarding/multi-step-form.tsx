"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight, Check, Target, Heart, Activity, Utensils, User, Zap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { createProfile } from "@/lib/supabase-service"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GoalType = "weight_loss" | "muscle_gain" | "maintenance"
type Gender = "male" | "female" | "other"
type ActivityLevel = "sedentary" | "light" | "active"
type DietType = "standard" | "vegetarian" | "vegan" | "keto"

export interface FormData {
  goal: GoalType | null
  gender: Gender | null
  age: number
  height: number
  currentWeight: number
  targetWeight: number
  activityLevel: ActivityLevel | null
  diet: DietType | null
}

// ---------------------------------------------------------------------------
// Step Config
// ---------------------------------------------------------------------------

interface StepConfig {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
}

const steps: StepConfig[] = [
  {
    id: "goal",
    title: "Hedefin",
    subtitle: "Neyi başarmak istiyorsun?",
    icon: <Target className="h-5 w-5" />,
  },
  {
    id: "profile",
    title: "Profilin",
    subtitle: "Sana özel plan için temel bilgiler",
    icon: <User className="h-5 w-5" />,
  },
  {
    id: "activity",
    title: "Aktivite",
    subtitle: "Günlük hareket seviyen",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    id: "diet",
    title: "Beslenme",
    subtitle: "Tercih ettiğin beslenme tarzı",
    icon: <Utensils className="h-5 w-5" />,
  },
]

// ---------------------------------------------------------------------------
// Option Card Component
// ---------------------------------------------------------------------------

interface OptionCardProps {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
  accent?: string
}

function OptionCard({ selected, onClick, icon, title, description }: OptionCardProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reducedMotion ? undefined : { scale: 1.02, y: -2 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      className={cn(
        "relative w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden group",
        selected
          ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md"
      )}
    >
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex items-start gap-4">
        <div
          className={cn(
            "shrink-0 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300",
            selected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
          )}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold mb-0.5", selected ? "text-emerald-900" : "text-slate-900")}>
            {title}
          </h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"
            >
              <Check className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Slider Component
// ---------------------------------------------------------------------------

interface AnimatedSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
  icon?: React.ReactNode
}

function AnimatedSlider({ label, value, min, max, step, unit, onChange, icon }: AnimatedSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const reducedMotion = useReducedMotion()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {icon}
          {label}
        </label>
        <motion.span
          key={value}
          initial={reducedMotion ? undefined : { scale: 1.2, color: "#10b981" }}
          animate={{ scale: 1, color: "#0f172a" }}
          className="text-lg font-bold text-slate-900 tabular-nums"
        >
          {value} {unit}
        </motion.span>
      </div>

      <div className="relative h-2 rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600"
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />

        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
          style={{ left: `${percentage}%` }}
          animate={reducedMotion ? undefined : { left: `${percentage}%` }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.div
            className="h-5 w-5 rounded-full bg-white border-2 border-emerald-500 shadow-md"
            whileHover={reducedMotion ? undefined : { scale: 1.15 }}
          />
        </motion.div>
      </div>

      <div className="flex justify-between text-xs text-slate-400">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step Components
// ---------------------------------------------------------------------------

function GoalStep({ data, update }: { data: FormData; update: (key: keyof FormData, value: any) => void }) {
  const goals = [
    {
      type: "weight_loss" as const,
      icon: <Zap className="h-6 w-6" />,
      title: "Kilo Verme",
      description: "Yağ yakımı ve formda kalma odaklı plan",
    },
    {
      type: "muscle_gain" as const,
      icon: <Activity className="h-6 w-6" />,
      title: "Kas Yapma",
      description: "Güç artışı ve hipertrofi hedefli",
    },
    {
      type: "maintenance" as const,
      icon: <Heart className="h-6 w-6" />,
      title: "Formu Koruma",
      description: "Mevcut kondisyonunu sürdürme",
    },
  ]

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <OptionCard
          key={goal.type}
          selected={data.goal === goal.type}
          onClick={() => update("goal", goal.type)}
          icon={goal.icon}
          title={goal.title}
          description={goal.description}
        />
      ))}
    </div>
  )
}

function ProfileStep({ data, update }: { data: FormData; update: (key: keyof FormData, value: any) => void }) {
  const genders = [
    { type: "male" as const, label: "Erkek", icon: "♂" },
    { type: "female" as const, label: "Kadın", icon: "♀" },
    { type: "other" as const, label: "Diğer", icon: "⚥" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Cinsiyet</p>
        <div className="grid grid-cols-3 gap-3">
          {genders.map((g) => (
            <motion.button
              key={g.type}
              type="button"
              onClick={() => update("gender", g.type)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "py-3 rounded-xl border-2 font-medium transition-all duration-300",
                data.gender === g.type
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-emerald-300"
              )}
            >
              <span className="text-2xl mr-2">{g.icon}</span>
              {g.label}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatedSlider
        label="Yaş"
        value={data.age}
        min={16}
        max={80}
        step={1}
        unit="yaş"
        onChange={(v) => update("age", v)}
        icon={<User className="h-4 w-4 text-emerald-500" />}
      />

      <AnimatedSlider
        label="Boy"
        value={data.height}
        min={140}
        max={210}
        step={1}
        unit="cm"
        onChange={(v) => update("height", v)}
        icon={<User className="h-4 w-4 text-emerald-500" />}
      />

      <AnimatedSlider
        label="Mevcut Kilo"
        value={data.currentWeight}
        min={40}
        max={150}
        step={1}
        unit="kg"
        onChange={(v) => update("currentWeight", v)}
        icon={<Activity className="h-4 w-4 text-emerald-500" />}
      />

      <AnimatedSlider
        label="Hedef Kilo"
        value={data.targetWeight}
        min={40}
        max={150}
        step={1}
        unit="kg"
        onChange={(v) => update("targetWeight", v)}
        icon={<Target className="h-4 w-4 text-emerald-500" />}
      />
    </div>
  )
}

function ActivityStep({ data, update }: { data: FormData; update: (key: keyof FormData, value: any) => void }) {
  const levels = [
    {
      type: "sedentary" as const,
      icon: <User className="h-6 w-6" />,
      title: "Masa Başında",
      description: "Gün boyu oturuyorum, az hareket",
    },
    {
      type: "light" as const,
      icon: <Activity className="h-6 w-6" />,
      title: "Hafif Hareketli",
      description: "Günde 30 dk yürüyüş / günlük işler",
    },
    {
      type: "active" as const,
      icon: <Zap className="h-6 w-6" />,
      title: "Çok Hareketli",
      description: "Düzenli antrenman / fiziksel iş",
    },
  ]

  return (
    <div className="space-y-4">
      {levels.map((level) => (
        <OptionCard
          key={level.type}
          selected={data.activityLevel === level.type}
          onClick={() => update("activityLevel", level.type)}
          icon={level.icon}
          title={level.title}
          description={level.description}
        />
      ))}
    </div>
  )
}

function DietStep({ data, update }: { data: FormData; update: (key: keyof FormData, value: any) => void }) {
  const diets = [
    {
      type: "standard" as const,
      icon: <Utensils className="h-6 w-6" />,
      title: "Standart",
      description: "Dengeli ve çeşitli beslenme",
    },
    {
      type: "vegetarian" as const,
      icon: <Heart className="h-6 w-6" />,
      title: "Vejetaryen",
      description: "Et yok, süt & yumurta var",
    },
    {
      type: "vegan" as const,
      icon: <Zap className="h-6 w-6" />,
      title: "Vegan",
      description: "Tüm hayvansal ürünler hariç",
    },
    {
      type: "keto" as const,
      icon: <Activity className="h-6 w-6" />,
      title: "Keto",
      description: "Düşük karbonhidrat, yüksek yağ",
    },
  ]

  return (
    <div className="space-y-4">
      {diets.map((diet) => (
        <OptionCard
          key={diet.type}
          selected={data.diet === diet.type}
          onClick={() => update("diet", diet.type)}
          icon={diet.icon}
          title={diet.title}
          description={diet.description}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({ current, total }: { current: number; total: number }) {
  const reducedMotion = useReducedMotion()
  const percentage = (current / (total - 1)) * 100

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <motion.div
              initial={false}
              animate={{
                scale: index === current ? 1.1 : 1,
                backgroundColor: index <= current ? "#10b981" : "#e2e8f0",
              }}
              transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 25 }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm"
            >
              {index < current ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </motion.div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:block",
                index <= current ? "text-emerald-600" : "text-slate-400"
              )}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <div className="relative h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600"
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-slate-400">
        <span>Adım {current + 1} / {total}</span>
        <span>%{Math.round((percentage / 100) * 100)} tamamlandı</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Multi-Step Form
// ---------------------------------------------------------------------------

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
}

export function MultiStepForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    goal: null,
    gender: null,
    age: 28,
    height: 175,
    currentWeight: 75,
    targetWeight: 70,
    activityLevel: null,
    diet: null,
  })

  const reducedMotion = useReducedMotion()

  const update = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    switch (step) {
      case 0: return formData.goal !== null
      case 1: return formData.gender !== null
      case 2: return formData.activityLevel !== null
      case 3: return formData.diet !== null
      default: return false
    }
  }

  const next = () => {
    if (step < steps.length - 1) {
      setDirection(1)
      setStep((s) => s + 1)
    } else {
      setIsComplete(true)
    }
  }

  const prev = () => {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Completion redirection side-effect
  useEffect(() => {
    if (isComplete) {
      localStorage.setItem("fito_onboarding_data", JSON.stringify(formData))
      document.cookie = "fito_onboarding_completed=true; path=/;"

      const timer = setTimeout(() => {
        router.push("/dashboard")
      }, 600)

      return () => clearTimeout(timer)
    }
  }, [isComplete, formData, router])

  const handleComplete = async () => {
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // User is already logged in, create profile
        await createProfile(formData, session.user.id, session.user.email || "")
      }

      // If no session, the data is stored in localStorage and will be used on dashboard
      // The dashboard will prompt for auth
    } catch (error) {
      console.error("Error creating profile:", error)
    } finally {
      setIsSubmitting(false)
      setIsComplete(true)
    }
  }

  // Completion UI screen
  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white mb-6"
        >
          <Check className="h-12 w-12" strokeWidth={3} />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Planın Hazır! 🎉</h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Dashboard'a yönlendiriliyorsunuz...
        </p>
        <motion.div className="flex justify-center">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex h-3 w-3 rounded-full bg-emerald-500"
          />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ProgressBar current={step} total={steps.length} />

      <motion.div
        key={`header-${step}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mb-4">
          {steps[step].icon}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {steps[step].title}
        </h2>
        <p className="text-slate-600">{steps[step].subtitle}</p>
      </motion.div>

      <div className="relative bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 min-h-[400px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                  }
            }
          >
            {step === 0 && <GoalStep data={formData} update={update} />}
            {step === 1 && <ProfileStep data={formData} update={update} />}
            {step === 2 && <ActivityStep data={formData} update={update} />}
            {step === 3 && <DietStep data={formData} update={update} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-8 gap-4">
        <motion.button
          type="button"
          onClick={prev}
          disabled={step === 0}
          whileHover={reducedMotion || step === 0 ? undefined : { scale: 1.02 }}
          whileTap={reducedMotion || step === 0 ? undefined : { scale: 0.98 }}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
            step === 0
              ? "opacity-0 pointer-events-none"
              : "text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <ArrowLeft className="h-5 w-5" />
          Geri
        </motion.button>

        <motion.button
          type="button"
          onClick={step === steps.length - 1 ? handleComplete : next}
          disabled={!canProceed() || isSubmitting}
          whileHover={reducedMotion || !canProceed() || isSubmitting ? undefined : { scale: 1.02 }}
          whileTap={reducedMotion || !canProceed() || isSubmitting ? undefined : { scale: 0.98 }}
          className={cn(
            "flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300",
            canProceed()
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              Kaydediliyor...
              <Loader2 className="h-5 w-5 animate-spin" />
            </>
          ) : step === steps.length - 1 ? (
            <>
              Planımı Oluştur
              <Check className="h-5 w-5" />
            </>
          ) : (
            <>
              İleri
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </motion.button>
      </div>

      <div className="text-center mt-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-slate-400"
          >
            {step === 0 && "Bir hedef seçerek başla"}
            {step === 1 && "Bilgilerin planını kişiselleştirir"}
            {step === 2 && "Aktivite seviyen kalori ihtiyacını belirler"}
            {step === 3 && "Tercihine uygun tarifler hazırlanır"}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}