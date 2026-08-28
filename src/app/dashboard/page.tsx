"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import dynamic from "next/dynamic"

import { ConfettiEffect } from "@/components/dashboard/confetti-effect"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { SummaryTab } from "@/components/dashboard/summary-tab"
import { AIChatTab } from "@/components/dashboard/ai-chat-tab"
import { DashboardHeader } from "@/components/dashboard/header/DashboardHeader"
import { TabBar } from "@/components/dashboard/tabs/TabBar"
import { AuthPrompt } from "@/components/dashboard/auth/AuthPrompt"
import { MealsSection } from "@/components/dashboard/meals/MealsSection"
import { ProfileSection } from "@/components/dashboard/profile/ProfileSection"
import { HistoryTab } from "@/components/dashboard/history-tab"
import { calculateMetrics } from "@/lib/calculations"
import { FormData } from "@/components/onboarding/multi-step-form"
import { useAuth } from "@/lib/auth-context"
import type { Meal, AIChat, User } from "@/lib/types"

// Lazy load heavy modals - only loaded when needed
const MealModal = dynamic(
  () => import("@/components/dashboard/meal-modal").then(m => m.MealModal),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
)

const AuthModalLazy = dynamic(
  () => import("@/components/dashboard/auth-modal").then(m => m.AuthModal),
  { ssr: false, loading: () => null }
)

const STORAGE_KEY = "fito_onboarding_data"

type TabId = "summary" | "history" | "ai" | "meals" | "profile"

// Güvenli JSON Parse Yardımcısı
async function safeParseJson(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch (e) {
    console.warn("JSON parse bypass:", e)
    return {}
  }
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [data, setData] = useState<FormData | null>(null)
  const [metrics, setMetrics] = useState<ReturnType<typeof calculateMetrics> | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("summary")
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; sender: "user" | "ai"; message: string }>
  >([])
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [meals, setMeals] = useState<Meal[]>([])
  const [waterMl, setWaterMl] = useState(0)
  const [showMealModal, setShowMealModal] = useState(false)
  const [userProfile, setUserProfile] = useState<User | null>(null)

  // Arka plandaki silik UI çakışmasını engellemek için yükleme durumu
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Yemek kaydedilen benzersiz günlerin sayısını hesaplar
  const streakCount = useMemo(() => {
    if (!meals || meals.length === 0) return 0

    const uniqueDays = new Set(
      meals.map((meal) => {
        const dateObj = meal.created_at ? new Date(meal.created_at) : new Date()
        return dateObj.toISOString().split("T")[0]
      })
    )

    return uniqueDays.size
  }, [meals])

  // Çıkış yapıp anasayfaya yönlendiren fonksiyon
  const handleSignOut = useCallback(async () => {
    await signOut()
    window.location.href = "/"
  }, [signOut])

  // Stable refs for callbacks - NEVER recreated
  const setShowAuthModalRef = useRef(setShowAuthModal)
  setShowAuthModalRef.current = setShowAuthModal

  const setShowMealModalRef = useRef(setShowMealModal)
  setShowMealModalRef.current = setShowMealModal

  const setMealsRef = useRef(setMeals)
  setMealsRef.current = setMeals

  const setUserProfileRef = useRef(setUserProfile)
  setUserProfileRef.current = setUserProfile

  const userRef = useRef(user)
  userRef.current = user

  // Stable callbacks - empty deps, never recreated
  const handleOpenAuth = useCallback(() => setShowAuthModalRef.current(true), [])
  const handleCloseAuth = useCallback(() => setShowAuthModalRef.current(false), [])
  const handleAuthSuccess = useCallback(() => setShowAuthModalRef.current(false), [])

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab)
  }, [])

  const handleAddMeal = useCallback(() => {
    if (!userRef.current) {
      setShowAuthModalRef.current(true)
      return
    }
    setShowMealModalRef.current(true)
  }, [])

  // Yemek kaydetme ve streak artırma - stable
  const handleSaveMeal = useCallback((newMeal: Meal) => {
    setMealsRef.current((prev: Meal[]) => [newMeal, ...prev])

    const currentUser = userRef.current
    if (currentUser) {
      fetch(`/api/user/streak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      })
        .then(safeParseJson)
        .then((parsedData) => {
          const updatedStreak = typeof parsedData.streak_days === "number"
            ? parsedData.streak_days
            : parsedData.streak || 0

          setUserProfileRef.current((prev: User | null) => (prev ? { ...prev, streak_days: updatedStreak } : null))
        })
        .catch((err) => console.error("Streak update error:", err))
    }
  }, [])

  const handleMealDelete = useCallback(async (mealId: string) => {
    const currentUser = userRef.current
    if (!currentUser) return
    try {
      const response = await fetch("/api/meals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealId, userId: currentUser.id }),
      })
      if (response.ok) {
        setMealsRef.current((prev: Meal[]) => prev.filter((m) => m.id !== mealId))
      }
    } catch (err) {
      console.error("Meal delete error:", err)
    }
  }, [])

  // Onboarding verisini yükleme
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      window.location.href = "/onboarding"
      return
    }
    try {
      const parsed = JSON.parse(stored) as FormData
      setData(parsed)
      setMetrics(calculateMetrics(parsed))
    } catch {
      window.location.href = "/onboarding"
    } finally {
      // Temel hesaplama verileri hazır olduğunda yüklemeyi tamamla
      setIsLoadingData(false)
    }
  }, [])

  // Kutlama animasyonu
  useEffect(() => {
    if (metrics && !hasAnimated) {
      setHasAnimated(true)
      setShowConfetti(true)
    }
  }, [metrics, hasAnimated])

  // Veritabanından yemekleri yükleme
  useEffect(() => {
    if (!user) {
      setMeals([])
      return
    }
    fetch(`/api/meals?userId=${user.id}`)
      .then(safeParseJson)
      .then((parsedData) => {
        if (parsedData.meals) setMeals(parsedData.meals)
      })
      .catch((err) => console.error("Meals loading error:", err))
  }, [user])

  // Veritabanından su verisini yükleme
  const loadWaterData = useCallback(async () => {
    const activeUserId = user?.id || "usr_local"
    const today = new Date().toISOString().split("T")[0]
    try {
      const response = await fetch(`/api/user/water?userId=${activeUserId}&date=${today}`)
      const parsedData = await safeParseJson(response)
      if (parsedData.water && parsedData.water.length > 0) {
        setWaterMl(parsedData.water[0].amount_ml)
      } else if (typeof parsedData.amount_ml === "number") {
        setWaterMl(parsedData.amount_ml)
      } else {
        setWaterMl(0)
      }
    } catch (err) {
      console.error("Water loading error:", err)
    }
  }, [user])

  useEffect(() => {
    loadWaterData()
  }, [loadWaterData])

  // Su artırma ve veritabanına kaydetme - stable refs
  const waterMlRef = useRef(waterMl)
  waterMlRef.current = waterMl

  const setWaterMlRef = useRef(setWaterMl)
  setWaterMlRef.current = setWaterMl

  const handleAddWater = useCallback(async (addedMl: number = 250) => {
    const newAmount = waterMlRef.current + addedMl
    setWaterMlRef.current(newAmount)

    const activeUserId = userRef.current?.id || "usr_local"
    const today = new Date().toISOString().split("T")[0]

    try {
      await fetch("/api/user/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          date: today,
          amount_ml: newAmount,
        }),
      })
    } catch (err) {
      console.error("Water save error:", err)
    }
  }, [])

  // Kullanıcı profil verisini çekme - PARALLEL fetching for streak + chat
  useEffect(() => {
    if (!user) {
      setUserProfile(null)
      setChatMessages([])
      return
    }

    // Parallel API calls to reduce loading time

    const streakPromise = fetch(`/api/user/streak?userId=${user.id}`).then(safeParseJson)
    const chatPromise = fetch(`/api/ai-chats?userId=${user.id}`).then(safeParseJson)

    Promise.all([streakPromise, chatPromise])
      .then(([streakData, chatData]) => {
        const streakDays = typeof streakData.streak_days === "number"
          ? streakData.streak_days
          : streakData.streak || 0

        setUserProfile({
          ...(user as User),
          streak_days: streakDays,
        })

        if (chatData.chats) {
          setChatMessages(
            chatData.chats.map((c: AIChat) => ({
              id: c.id,
              sender: c.sender as "user" | "ai",
              message: c.message,
            }))
          )
        }
      })
      .catch((err) => {
        console.error("Profile/Chat loading error:", err)
        setUserProfile(user as User)
      })
  }, [user])

  // AI Mesaj Gönderimi
  const handleSendChatMessage = useCallback(async (message: string) => {
    const userMessage = message.trim()
    if (!userMessage) return

    const activeUserId = user?.id || "guest"
    const userMsgObj = { id: Date.now().toString(), sender: "user" as const, message: userMessage }
    const updatedMessages = [...chatMessages, userMsgObj]

    setChatMessages(updatedMessages)
    setChatInput("")
    setIsLoadingChat(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          message: userMessage,
          messages: updatedMessages,
          context: {
            goal: data?.goal,
            dailyCalories: metrics?.targetCalories,
            macros: metrics ? {
              protein: metrics.macros.protein.grams,
              carbs: metrics.macros.carbs.grams,
              fat: metrics.macros.fat.grams,
            } : undefined
          }
        }),
      })

      const resData = await safeParseJson(res)
      const aiReplyText = resData.reply || resData.message || resData.error || "Sunucudan geçerli bir yanıt alınamadı."

      setChatMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", message: aiReplyText },
      ])
    } catch (error: any) {
      console.error("Chat fetch error:", error)
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          message: `Bağlantı Hatası: ${error?.message || "Sunucuya ulaşılamadı"}`
        },
      ])
    } finally {
      setIsLoadingChat(false)
    }
  }, [user, chatMessages, data, metrics])

  // Veriler yüklenirken gösterilecek temiz yükleme ekranı (Arka plan çakışmasını tamamen engeller)
  if (isLoadingData || !data || !metrics) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#121316]">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-10 w-10 border-4 border-[#e5502c] border-t-transparent rounded-full"
          />
          <span className="text-xs text-zinc-400 font-medium">Yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#121316] text-white relative overflow-hidden flex flex-col items-center">
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Arka plan ışık efekti */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[150px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col w-full max-w-2xl px-4 py-6 pb-28">
        {/* Üst Header */}
        <DashboardHeader
          user={user as User | null}
          profile={userProfile}
          streakCount={streakCount}
          onSignOut={handleSignOut}
          onOpenAuth={handleOpenAuth}
        />

        <div className="flex-1 w-full mt-2">
          {!user && <AuthPrompt onOpenAuth={handleOpenAuth} />}

          <TabBar activeTab={activeTab} onChange={handleTabChange} user={user} onOpenAuth={handleOpenAuth} />

          <AnimatePresence mode="wait">
            {activeTab === "summary" && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <SummaryTab
                  metrics={metrics}
                  data={data}
                  meals={meals}
                  waterMl={waterMl}
                  onAddWater={handleAddWater}
                  onAddMeal={handleAddMeal}
                />
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <HistoryTab meals={meals} waterMl={waterMl} />
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <AIChatTab
                  messages={chatMessages}
                  onSend={handleSendChatMessage}
                  isLoading={isLoadingChat}
                  inputValue={chatInput}
                  onInputChange={setChatInput}
                />
              </motion.div>
            )}

            {activeTab === "meals" && (
              <MealsSection
                key="meals"
                meals={meals}
                onDelete={handleMealDelete}
                onAdd={handleAddMeal}
              />
            )}

            {activeTab === "profile" && (
              <ProfileSection
                key="profile"
                user={user as User | null}
                profile={userProfile}
                metrics={metrics}
                onSignOut={handleSignOut}
                onOpenAuth={handleOpenAuth}
              />
            )}
          </AnimatePresence>
        </div>

        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAddMeal={handleAddMeal}
          user={user}
        />

        <AuthModalLazy
          isOpen={showAuthModal}
          onClose={handleCloseAuth}
          onAuthSuccess={handleAuthSuccess}
        />

        <MealModal
          isOpen={showMealModal}
          onClose={() => setShowMealModal(false)}
          onSave={handleSaveMeal}
        />
      </div>
    </main>
  )
}