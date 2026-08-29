"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import type { User } from "@/lib/types"
import { calculateMetrics } from "@/lib/calculations"
import type { FormData } from "@/components/onboarding/multi-step-form"

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "custom_user"
const ONBOARDING_STORAGE_KEY = "fito_onboarding_data"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync onboarding data to database after successful auth
  const syncOnboardingData = async (userId: string) => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!stored) return

    try {
      const formData = JSON.parse(stored) as FormData
      const metrics = calculateMetrics(formData)

      const response = await fetch("/api/onboarding/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, formData, metrics }),
      })

      if (response.ok) {
        console.log("Onboarding data synced successfully")
      } else {
        console.warn("Onboarding sync failed:", await response.text())
      }
    } catch (err) {
      console.error("Onboarding sync error:", err)
    }
  }

  // LocalStorage ve DB doğrulama fonksiyonu
  const verifyAndSetUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setUser(null)
        setLoading(false)
        return
      }

      const parsedUser = JSON.parse(stored)
      const response = await fetch(`/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", userId: parsedUser.id }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          // Güncel kullanıcı bilgisini localStorage'da da tazele
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
        } else {
          localStorage.removeItem(STORAGE_KEY)
          setUser(null)
        }
      } else {
        // API yanıt vermezse cache'deki kullanıcıyı kullan
        setUser(parsedUser)
      }
    } catch (err) {
      console.error("Auth verify error:", err)
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          setUser(JSON.parse(stored))
        } catch {
          setUser(null)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Event Listener'ları bağlayarak anlık UI senkronizasyonu sağlama
  useEffect(() => {
    verifyAndSetUser()

    const handleAuthChange = () => {
      verifyAndSetUser()
    }

    window.addEventListener("storage", handleAuthChange)
    window.addEventListener("auth-change", handleAuthChange)

    return () => {
      window.removeEventListener("storage", handleAuthChange)
      window.removeEventListener("auth-change", handleAuthChange)
    }
  }, [verifyAndSetUser])

  const signUp = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", email, password }),
      })

      const data = await response.json()

      if (data.error) {
        return { error: new Error(data.error) }
      }

      if (data.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
        setUser(data.user)
        window.dispatchEvent(new Event("auth-change"))
        await syncOnboardingData(data.user.id)
      }

      return { error: null }
    } catch (err: any) {
      return { error: new Error(err.message || "Kayıt olurken bir hata oluştu.") }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signin", email, password }),
      })

      const data = await response.json()

      if (data.error) {
        return { error: new Error(data.error) }
      }

      if (data.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
        setUser(data.user)
        window.dispatchEvent(new Event("auth-change"))
        await syncOnboardingData(data.user.id)
      }

      return { error: null }
    } catch (err: any) {
      return { error: new Error(err.message || "Giriş yapılırken bir hata oluştu.") }
    }
  }

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    window.dispatchEvent(new Event("auth-change"))
  }

  const refreshUser = async () => {
    await verifyAndSetUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}