"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Share2, Send, Plus, BarChart3, History, User, Sparkles, Flame, Dumbbell, Camera, X, LogOut, Loader2 } from "lucide-react"
import { ConfettiEffect, triggerConfetti } from "@/components/dashboard/confetti-effect"
import { AuthModal } from "@/components/dashboard/auth-modal"
import { AnimatedMacroBars, StatCard, WeightTimeline, WeeklyProgress } from "@/components/dashboard/animated-charts"
import { calculateMetrics, generateTimeline, getGoalLabel, getActivityLabel, getDietLabel } from "@/lib/calculations"
import { FormData } from "@/components/onboarding/multi-step-form"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import type { Profile, Meal, AIChat } from "@/lib/types"

const STORAGE_KEY = "fito_onboarding_data"

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [data, setData] = useState<FormData | null>(null)
  const [metrics, setMetrics] = useState<ReturnType<typeof calculateMetrics> | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [activeTab, setActiveTab] = useState<"summary" | "ai" | "meals" | "profile">("summary")
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: "user" | "ai"; message: string }>>([])
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [meals, setMeals] = useState<Meal[]>([])
  const [showMealModal, setShowMealModal] = useState(false)
  const [newMeal, setNewMeal] = useState({
    meal_name: "",
    meal_type: "Kahvaltı" as const,
    portion_count: 1,
    total_grams: 0,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    image_url: ""
  })
  const [isLoggingMeal, setIsLoggingMeal] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setData(parsed)
        setMetrics(calculateMetrics(parsed))
      } catch {
        window.location.href = "/onboarding"
      }
    } else {
      window.location.href = "/onboarding"
    }
  }, [])

  // If user is authenticated but no profile, create one from onboarding data
  useEffect(() => {
    if (user && data && !profile && !authLoading) {
      const supabase = createClient()
      const initProfile = async () => {
        const metrics = calculateMetrics(data)
        const { error } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || null,
            daily_calorie_target: metrics.targetCalories,
            target_protein_g: metrics.macros.protein.grams,
            target_carbs_g: metrics.macros.carbs.grams,
            target_fat_g: metrics.macros.fat.grams,
            streak_days: 0,
          })
        if (!error) {
          // Profile will be loaded by auth context
        }
      }
      initProfile()
    }
  }, [user, data, profile, authLoading])

  // Trigger confetti once when metrics are loaded
  useEffect(() => {
    if (metrics && !hasAnimated) {
      setHasAnimated(true)
      setShowConfetti(true)
    }
  }, [metrics, hasAnimated])

  // Load meals from database
  useEffect(() => {
    if (user) {
      const supabase = createClient()
      const loadMeals = async () => {
        const { data: mealData } = await supabase
          .from("meals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)
        if (mealData) {
          setMeals(mealData as Meal[])
        }
      }
      loadMeals()
    }
  }, [user])

  // Load chat history from database
  useEffect(() => {
    if (user) {
      const supabase = createClient()
      const loadChats = async () => {
        const { data: chatData } = await supabase
          .from("ai_chats")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(50)
        if (chatData) {
          setChatMessages(chatData.map(c => ({ id: c.id, sender: c.sender as "user" | "ai", message: c.message })))
        }
      }
      loadChats()
    }
  }, [user])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  if (!data || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const timeline = generateTimeline(metrics.weeksToGoal, data.goal || "", data.currentWeight, data.targetWeight)

  const handleAuthSubmit = async (email: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password: "temp_password_123" })
    if (error) {
      // If email already exists, try sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: "temp_password_123" })
      if (signInError) {
        return { error: new Error(error.message) }
      }
    }
    return { error: null }
  }

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY)
    window.location.href = "/onboarding"
  }

  const handleShare = async () => {
    const text = `Fito ile ${getGoalLabel(data.goal || "")} hedefime ulaşıyorum! 💪\n${metrics.targetCalories} kalori / ${metrics.macros.protein.grams}g Protein / ${metrics.macros.carbs.grams}g Karbonhidrat / ${metrics.macros.fat.grams}g Yağ\n\n#Fito #Fitness #SağlıklıYaşam`

    if (navigator.share) {
      try {
        await navigator.share({ title: "Fito Planım", text })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      triggerConfetti()
    }
  }

  const handleSendChat = async () => {
    if (!chatInput.trim() || !user) return

    const userMessage = chatInput.trim()
    setChatInput("")
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: "user", message: userMessage }])
    setIsLoadingChat(true)

    // Save user message to database
    const supabase = createClient()
    const { error: userError } = await supabase.from("ai_chats").insert({
      user_id: user.id,
      message: userMessage,
      sender: "user"
    })

    if (userError) console.error("Error saving user message:", userError)

    // Simulate AI response
    setTimeout(async () => {
      const aiResponse = `Harika bir soru! 💪 ${getGoalLabel(data.goal || "")} hedefin için şu öneriyi veriyorum:\n\nGünlük ${metrics.targetCalories} kalori hedefini tut. Makroların: ${metrics.macros.protein.grams}g Protein, ${metrics.macros.carbs.grams}g Karbonhidrat, ${metrics.macros.fat.grams}g Yağ.\n\nSu içmeyi unutma (2-3L/gün) ve düzenli uyku önemli! 💧😴`

      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: "ai", message: aiResponse }])

      const { error: aiError } = await supabase.from("ai_chats").insert({
        user_id: user.id,
        message: aiResponse,
        sender: "ai"
      })

      if (aiError) console.error("Error saving AI message:", aiError)

      setIsLoadingChat(false)
    }, 1200)
  }

  const handleLogMeal = async () => {
    if (!user || !newMeal.meal_name.trim()) return

    setIsLoggingMeal(true)

    const supabase = createClient()
    const { data: mealData, error } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        meal_name: newMeal.meal_name,
        meal_type: newMeal.meal_type,
        portion_count: newMeal.portion_count,
        total_grams: newMeal.total_grams,
        calories: newMeal.calories,
        protein_g: newMeal.protein_g,
        carbs_g: newMeal.carbs_g,
        fat_g: newMeal.fat_g,
        image_url: newMeal.image_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error logging meal:", error)
    } else if (mealData) {
      setMeals(prev => [mealData as Meal, ...prev])
      setShowMealModal(false)
      setNewMeal({
        meal_name: "",
        meal_type: "Kahvaltı" as const,
        portion_count: 1,
        total_grams: 0,
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        image_url: ""
      })
      triggerConfetti()
    }

    setIsLoggingMeal(false)
  }

  const handleDeleteMeal = async (mealId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("id", mealId)

    if (!error) {
      setMeals(prev => prev.filter(m => m.id !== mealId))
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Confetti Effect */}
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-400/10 blur-[200px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-400/10 blur-[200px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="px-4 py-6"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">Ana Sayfa</span>
            </Link>

            <div className="flex items-center gap-2">
              {user && (
                <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">
                  {profile?.streak_days || 0} gün 🔥
                </span>
              )}
              {!user && (
                <motion.button
                  onClick={() => setShowAuthModal(true)}
                  whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Giriş Yap
                </motion.button>
              )}
              {user && (
                <motion.button
                  onClick={signOut}
                  whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  aria-label="Çıkış Yap"
                >
                  <LogOut className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 pb-24">
          {/* Auth prompt if not logged in */}
          {!user && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-8"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">Planını Kaydet 💾</h2>
                  <p className="text-sm text-slate-500">İlerlemeni takip etmek için hesap oluştur</p>
                </div>
                <motion.button
                  onClick={() => setShowAuthModal(true)}
                  whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                  className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                >
                  Hesap Oluştur
                </motion.button>
              </div>
            </motion.section>
          )}

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "summary" && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hero Section */}
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  className="text-center mb-12"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 300, damping: 20 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6"
                  >
                    <span className="relative flex h-2 w-2">
                      <motion.span
                        className="absolute inset-0 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <span className="relative z-10 h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Planın Hazır! 🎉
                  </motion.div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-4">
                    {getGoalLabel(data.goal || "")} Planı
                    <br />
                    <span className="text-emerald-600">Oluşturuldu</span>
                  </h1>

                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Bilgilerine göre hazırlanan, bilim temelli ve sürdürülebilir planın özeti aşağıdadır.
                  </p>
                </motion.section>

                {/* Key Metrics Grid */}
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mb-10"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Bazal Metabolizma"
                      value={metrics.bmr.toLocaleString()}
                      unit="kcal"
                      icon="🔥"
                      color="#ef4444"
                      bgColor="#fee2e2"
                      delay={0.1}
                    />
                    <StatCard
                      label="Günlük İhtiyaç (TDEE)"
                      value={metrics.tdee.toLocaleString()}
                      unit="kcal"
                      icon="⚡"
                      color="#f59e0b"
                      bgColor="#fef3c7"
                      delay={0.15}
                    />
                    <StatCard
                      label="Hedef Kalori"
                      value={metrics.targetCalories.toLocaleString()}
                      unit="kcal"
                      icon="🎯"
                      color="#10b981"
                      bgColor="#d1fae5"
                      delay={0.2}
                    />
                    <StatCard
                      label="Hedefe Kalan"
                      value={metrics.weeksToGoal}
                      unit="hafta"
                      icon="📅"
                      color="#3b82f6"
                      bgColor="#dbeafe"
                      delay={0.25}
                    />
                  </div>
                </motion.section>

                {/* Macro Distribution & Weight Timeline */}
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="grid lg:grid-cols-2 gap-6 mb-10"
                >
                  {/* Macro Bars */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Günlük Makro Dağılımı</h2>
                        <p className="text-sm text-slate-500 mt-1">Toplam {metrics.targetCalories} kcal</p>
                      </div>
                    </div>
                    <AnimatedMacroBars macros={metrics.macros} targetCalories={metrics.targetCalories} />
                  </div>

                  {/* Weight Timeline */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900">Kilo Takip Çizelgesi</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {metrics.weeklyWeightChange > 0 ? "+" : ""}{metrics.weeklyWeightChange} kg/hafta ·
                        {metrics.weeksToGoal} haftada hedef
                      </p>
                    </div>
                    <WeightTimeline
                      timeline={timeline}
                      currentWeight={data.currentWeight}
                      targetWeight={data.targetWeight}
                    />
                  </div>
                </motion.section>

                {/* Weekly Progress */}
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mb-10"
                >
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900">Haftalık İlerleme</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Her hafta hedefine biraz daha yaklaşıyorsun. Tutarlılık anahtar! 🔑
                      </p>
                    </div>
                    <WeeklyProgress weeksToGoal={metrics.weeksToGoal} />
                  </div>
                </motion.section>

                {/* Summary Card */}
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mb-10"
                >
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" aria-hidden="true">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,0 L100,0 L100,100 Q50,50 0,100 Z" fill="white" />
                      </svg>
                    </div>
                    <div className="relative grid sm:grid-cols-4 gap-6">
                      <div className="text-center">
                        <p className="text-emerald-100 text-sm uppercase tracking-wider">Hedef</p>
                        <p className="text-2xl font-bold mt-1">{getGoalLabel(data.goal || "")}</p>
                      </div>
                      <div className="text-center border-l border-emerald-400/30">
                        <p className="text-emerald-100 text-sm uppercase tracking-wider">Aktivite</p>
                        <p className="text-2xl font-bold mt-1">{getActivityLabel(data.activityLevel || "")}</p>
                      </div>
                      <div className="text-center border-l border-emerald-400/30">
                        <p className="text-emerald-100 text-sm uppercase tracking-wider">Beslenme</p>
                        <p className="text-2xl font-bold mt-1">{getDietLabel(data.diet || "")}</p>
                      </div>
                      <div className="text-center border-l border-emerald-400/30">
                        <p className="text-emerald-100 text-sm uppercase tracking-wider">Haftalık</p>
                        <p className="text-2xl font-bold mt-1">
                          {metrics.weeklyWeightChange > 0 ? "+" : ""}{metrics.weeklyWeightChange} kg
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* CTA Buttons */}
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <motion.button
                    onClick={handleShare}
                    whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                    Paylaş
                  </motion.button>
                  <motion.button
                    onClick={handleRestart}
                    whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Yeniden Başla
                  </motion.button>
                </motion.section>
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
              >
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">AI Beslenme Koçu</h2>
                      <p className="text-xs text-slate-500">Sınırsız ve ücretsiz 💚</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                        <Sparkles className="h-8 w-8" />
                      </div>
                      <p className="text-slate-600 font-medium">Merhaba! Ben senin AI beslenme koçun 🤖</p>
                      <p className="text-sm text-slate-500 mt-2">Sana özel beslenme sorularını yanıtlayabilirim.</p>
                    </div>
                  )}

                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                          msg.sender === "user"
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-800"
                        )}
                      >
                        {msg.message}
                      </div>
                    </motion.div>
                  ))}

                  {isLoadingChat && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        <span className="text-sm text-slate-600">Düşünüyor...</span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                      placeholder="Beslenme sorunuzu yazın..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                      disabled={!user}
                    />
                    <motion.button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || !user || isLoadingChat}
                      whileHover={reducedMotion || !chatInput.trim() || !user || isLoadingChat ? undefined : { scale: 1.05 }}
                      whileTap={reducedMotion || !chatInput.trim() || !user || isLoadingChat ? undefined : { scale: 0.95 }}
                      className={cn(
                        "flex items-center justify-center h-12 w-12 rounded-xl transition-colors",
                        chatInput.trim() && user && !isLoadingChat
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      <Send className="h-5 w-5" />
                    </motion.button>
                  </div>
                  {!user && (
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Sohbet etmek için önce giriş yapmalısın
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "meals" && (
              <motion.div
                key="meals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Meals Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Yemek Günlüğü</h2>
                      <p className="text-xs text-slate-500">{meals.length} kayıt</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setShowMealModal(true)}
                    whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Ekle
                  </motion.button>
                </div>

                {/* Meals List */}
                {meals.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                      <Dumbbell className="h-8 w-8" />
                    </div>
                    <p className="text-slate-600 font-medium">Henüz yemek kaydı yok</p>
                    <p className="text-sm text-slate-500 mt-2">Günlük beslenmeni takip etmek için yemek ekle</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meals.map((meal, idx) => (
                      <motion.div
                        key={meal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                          <Flame className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 truncate">{meal.meal_name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                              {meal.meal_type}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {meal.calories} kcal · {meal.protein_g}g protein · {meal.carbs_g}g karbonhidrat · {meal.fat_g}g yağ
                          </p>
                        </div>
                        <motion.button
                          onClick={() => handleDeleteMeal(meal.id)}
                          whileHover={reducedMotion ? undefined : { scale: 1.1 }}
                          whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          aria-label="Sil"
                        >
                          <X className="h-5 w-5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {user ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">{user.email}</h2>
                        <p className="text-sm text-slate-500 mt-1">Üyelik: {new Date(user.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{profile?.daily_calorie_target || metrics.targetCalories}</p>
                        <p className="text-xs text-slate-500 mt-1">Günlük Kalori</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{profile?.target_protein_g || metrics.macros.protein.grams}</p>
                        <p className="text-xs text-slate-500 mt-1">Protein (g)</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{profile?.target_carbs_g || metrics.macros.carbs.grams}</p>
                        <p className="text-xs text-slate-500 mt-1">Karbonhidrat (g)</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{profile?.target_fat_g || metrics.macros.fat.grams}</p>
                        <p className="text-xs text-slate-500 mt-1">Yağ (g)</p>
                      </div>
                    </div>

                    <div className="bg-emerald-50 rounded-2xl p-6 text-center">
                      <p className="text-emerald-600 text-sm font-medium">Mevcut Seri 🔥</p>
                      <p className="text-4xl font-bold text-emerald-700 mt-2">{profile?.streak_days || 0} gün</p>
                      <p className="text-emerald-600/70 text-xs mt-2">Bugün yemek kaydet, serini koru!</p>
                    </div>

                    <div className="mt-8 flex gap-4">
                      <motion.button
                        onClick={signOut}
                        whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                        className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                      >
                        Çıkış Yap
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                      <User className="h-8 w-8" />
                    </div>
                    <p className="text-slate-600 font-medium mb-4">Profilini görüntülemek için giriş yap</p>
                    <motion.button
                      onClick={() => setShowAuthModal(true)}
                      whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                      className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      Giriş Yap
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-around px-2 py-2">
            <NavButton
              icon={<BarChart3 className="h-5 w-5" />}
              label="Özet"
              active={activeTab === "summary"}
              onClick={() => setActiveTab("summary")}
            />
            <NavButton
              icon={<History className="h-5 w-5" />}
              label="Geçmiş"
              active={activeTab === "meals"}
              onClick={() => setActiveTab("meals")}
            />
            {/* Center Add Button */}
            <button
              onClick={() => user ? setShowMealModal(true) : setShowAuthModal(true)}
              className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300"
              aria-label="Yemek Ekle"
            >
              <Plus className="h-7 w-7" />
            </button>
            <NavButton
              icon={<Sparkles className="h-5 w-5" />}
              label="AI Koç"
              active={activeTab === "ai"}
              onClick={() => setActiveTab("ai")}
            />
            <NavButton
              icon={<User className="h-5 w-5" />}
              label="Profil"
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            />
          </div>
        </motion.nav>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSubmit={handleAuthSubmit}
      />

      {/* Meal Modal */}
      <AnimatePresence>
        {showMealModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowMealModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md p-4"
            >
              <div className="bg-white rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Yemek Ekle</h2>
                  <button
                    onClick={() => setShowMealModal(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Yemek Adı</label>
                    <input
                      type="text"
                      value={newMeal.meal_name}
                      onChange={(e) => setNewMeal({ ...newMeal, meal_name: e.target.value })}
                      placeholder="Örn: Tavuk Salata"
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Öğün Tipi</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {(["Kahvaltı", "Öğle", "Akşam", "Ara Öğün"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewMeal({ ...newMeal, meal_type: type })}
                          className={cn(
                            "py-2 rounded-xl text-sm font-medium transition-colors",
                            newMeal.meal_type === type
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Porsiyon</label>
                      <input
                        type="number"
                        min="1"
                        value={newMeal.portion_count}
                        onChange={(e) => setNewMeal({ ...newMeal, portion_count: Number(e.target.value) })}
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Gram (g)</label>
                      <input
                        type="number"
                        min="0"
                        value={newMeal.total_grams}
                        onChange={(e) => setNewMeal({ ...newMeal, total_grams: Number(e.target.value) })}
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Kalori (kcal)</label>
                      <input
                        type="number"
                        min="0"
                        value={newMeal.calories}
                        onChange={(e) => setNewMeal({ ...newMeal, calories: Number(e.target.value) })}
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Protein (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={newMeal.protein_g}
                        onChange={(e) => setNewMeal({ ...newMeal, protein_g: Number(e.target.value) })}
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Karbonhidrat (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={newMeal.carbs_g}
                        onChange={(e) => setNewMeal({ ...newMeal, carbs_g: Number(e.target.value) })}
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Yağ (g)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={newMeal.fat_g}
                        onChange={(e) => setNewMeal({ ...newMeal, fat_g: Number(e.target.value) })}
                        className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <motion.button
                    onClick={handleLogMeal}
                    disabled={!newMeal.meal_name.trim() || isLoggingMeal}
                    whileHover={reducedMotion || !newMeal.meal_name.trim() || isLoggingMeal ? undefined : { scale: 1.02 }}
                    whileTap={reducedMotion || !newMeal.meal_name.trim() || isLoggingMeal ? undefined : { scale: 0.98 }}
                    className={cn(
                      "w-full py-3 rounded-xl font-semibold text-white transition-colors",
                      newMeal.meal_name.trim() && !isLoggingMeal
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {isLoggingMeal ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                        Kaydediliyor...
                      </>
                    ) : (
                      "Kaydet"
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}

// ============================================
// NAV BUTTON COMPONENT
// ============================================

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  const reducedMotion = useReducedMotion()
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[64px]",
        active ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <motion.div
        animate={active && !reducedMotion ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {icon}
      </motion.div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}