"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight, Check, Target, Heart, Activity, Utensils, User, Zap, Loader2, Mail, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
        "relative w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden group cursor-pointer",
        selected
          ? "border-[#D94A1D] bg-[#D94A1D]/5 shadow-lg shadow-[#D94A1D]/10"
          : "border-slate-200 bg-white hover:border-[#D94A1D]/50 hover:shadow-md"
      )}
    >
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-[#D94A1D]/10 to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex items-start gap-4">
        <div
          className={cn(
            "shrink-0 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300",
            selected ? "bg-[#D94A1D] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-[#D94A1D]/10 group-hover:text-[#D94A1D]"
          )}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-0.5 text-slate-900">
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
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#D94A1D] text-white"
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
          initial={reducedMotion ? undefined : { scale: 1.2, color: "#D94A1D" }}
          animate={{ scale: 1, color: "#0f172a" }}
          className="text-lg font-bold text-slate-900 tabular-nums"
        >
          {value} {unit}
        </motion.span>
      </div>

      <div className="relative h-2 rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#D94A1D] to-[#B83E17]"
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
            className="h-5 w-5 rounded-full bg-white border-2 border-[#D94A1D] shadow-md"
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
        <p className="text-sm font-medium text-[#121212] mb-3">Cinsiyet</p>
        <div className="grid grid-cols-3 gap-3">
          {genders.map((g) => (
            <motion.button
              key={g.type}
              type="button"
              onClick={() => update("gender", g.type)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "py-3 rounded-xl border-2 font-medium transition-all duration-300 cursor-pointer",
                data.gender === g.type
                  ? "border-[#D94A1D] bg-[#D94A1D]/10 text-[#D94A1D]"
                  : "border-slate-200 text-slate-600 hover:border-[#D94A1D]/50"
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
        icon={<User className="h-4 w-4 text-[#D94A1D]" />}
      />

      <AnimatedSlider
        label="Boy"
        value={data.height}
        min={140}
        max={210}
        step={1}
        unit="cm"
        onChange={(v) => update("height", v)}
        icon={<User className="h-4 w-4 text-[#D94A1D]" />}
      />

      <AnimatedSlider
        label="Mevcut Kilo"
        value={data.currentWeight}
        min={40}
        max={150}
        step={1}
        unit="kg"
        onChange={(v) => update("currentWeight", v)}
        icon={<Activity className="h-4 w-4 text-[#D94A1D]" />}
      />

      <AnimatedSlider
        label="Hedef Kilo"
        value={data.targetWeight}
        min={40}
        max={150}
        step={1}
        unit="kg"
        onChange={(v) => update("targetWeight", v)}
        icon={<Target className="h-4 w-4 text-[#D94A1D]" />}
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
                backgroundColor: index <= current ? "#D94A1D" : "#e2e8f0",
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
                index <= current ? "text-[#D94A1D]" : "text-slate-400"
              )}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <div className="relative h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#D94A1D] to-[#B83E17]"
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
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Auth Form State'leri
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")

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
    }
  }

  const prev = () => {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      localStorage.setItem("fito_onboarding_data", JSON.stringify(formData))
      document.cookie = "fito_onboarding_completed=true; path=/;"
    } catch (error) {
      console.error("Error saving onboarding data:", error)
    } finally {
      setIsSubmitting(false)
      setIsComplete(true)
    }
  }

  // --- KAYIT & GİRİŞ İŞLEMİ ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError("")

    try {
      if (authMode === "signup") {
        // 1. Kayıt Ol (signup)
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "signup",
            email,
            password,
            onboardingData: {
              daily_calorie_target: 2396,
              target_protein_g: 180,
              target_carbs_g: 270,
              target_fat_g: 67,
              ...formData,
            },
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Kayıt sırasında bir hata oluştu.")
        }

        // Kayıt başarılı -> Otomatik Giriş ekranına geçir
        setAuthMode("signin")
        setAuthError("")
      } else {
        // 2. Giriş Yap (signin)
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "signin",
            email,
            password,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Giriş başarısız. Bilgilerinizi kontrol edin.")
        }

        // Giriş başarılı -> Kullanıcı verisini local storage'a kaydet ve Dashboard'a yönlendir
        if (data.user) {
          localStorage.setItem("custom_user", JSON.stringify(data.user))
        }
        
        setShowAuthModal(false)
        router.push("/dashboard")
      }
    } catch (err: any) {
      setAuthError(err.message || "Bir hata oluştu.")
    } finally {
      setAuthLoading(false)
    }
  }

  // --- EKRAN 2: PLAN ÖZETİ VE HESAP OLUŞTURMA ÇAĞRISI ---
  if (isComplete) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-6 text-center">
        {/* Üstte Hesap Oluştur Banner'ı */}
        <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-xl border border-slate-100 flex items-center justify-between">
          <div className="text-left">
            <h3 className="font-bold text-lg flex items-center gap-2">
              Planını Kaydet 💾
            </h3>
            <p className="text-sm text-slate-500">İlerlemeni takip etmek için hesap oluştur</p>
          </div>
          <button
            onClick={() => {
              setAuthMode("signup")
              setShowAuthModal(true)
            }}
            className="px-5 py-2.5 bg-[#D94A1D] text-white font-semibold rounded-xl hover:bg-[#B83E17] transition shadow-md cursor-pointer"
          >
            Hesap Oluştur
          </button>
        </div>

        {/* Makro & Kalori Özet Kartı */}
        <div className="rounded-3xl bg-white p-6 shadow-xl border border-slate-100 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Günlük Hedefiniz</h2>
          
          <div className="flex justify-center">
            <div className="w-40 h-40 rounded-full border-4 border-[#D94A1D]/30 flex flex-col items-center justify-center relative bg-[#D94A1D]/5">
              <span className="text-3xl font-extrabold text-slate-900">2.396</span>
              <span className="text-xs text-slate-500">kcal / gün</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block font-semibold">PROTEİN</span>
              <span className="text-sm font-bold text-[#D94A1D]">180g</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block font-semibold">KARB.</span>
              <span className="text-sm font-bold text-[#D94A1D]">270g</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block font-semibold">YAĞ</span>
              <span className="text-sm font-bold text-[#D94A1D]">67g</span>
            </div>
          </div>
        </div>

        {/* Kayıt Ol / Giriş Yap Modalı */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl border border-slate-100 space-y-4">
              <h3 className="text-xl font-bold text-slate-900">
                {authMode === "signup" ? "Hesap Oluştur" : "Giriş Yap"}
              </h3>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                  {authError}
                </div>
              )}

              {authMode === "signin" && !authError && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-medium">
                  Kayıt başarılı! Lütfen hesabınıza giriş yapın.
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="E-posta Adresiniz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 p-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-[#D94A1D] focus:ring-2 focus:ring-[#D94A1D]/20 transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Şifreniz"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 p-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-[#D94A1D] focus:ring-2 focus:ring-[#D94A1D]/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-[#D94A1D] font-semibold text-white rounded-xl hover:bg-[#B83E17] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : authMode === "signup" ? (
                    "Kayıt Ol ve İlerle"
                  ) : (
                    "Giriş Yap ve Başla"
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-900 text-center block cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- EKRAN 1: ADIM ADIM FORM ---
  return (
    <div className="w-full max-w-2xl mx-auto">
      <ProgressBar current={step} total={steps.length} />

      <motion.div
        key={`header-${step}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#D94A1D]/15 text-[#D94A1D] mb-4">
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
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer",
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
              ? "bg-[#D94A1D] text-white shadow-lg shadow-[#D94A1D]/30 hover:bg-[#B83E17] hover:shadow-xl hover:shadow-[#D94A1D]/40 cursor-pointer"
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