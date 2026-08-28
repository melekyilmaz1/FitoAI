"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import {
  X,
  Mail,
  Lock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: () => void
  initialMode?: "signin" | "signup"
  showTabs?: boolean
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "signin",
  showTabs = false,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "signup-success">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const emailRef = useRef<HTMLInputElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === "signup")
      setStatus("idle")
      setErrorMessage("")
      setEmail("")
      setPassword("")
      setShowPassword(false)
      setTimeout(() => emailRef.current?.focus(), 100)
    }
  }, [isOpen, initialMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Geçerli bir e-posta adresi girin.")
      setStatus("error")
      return
    }

    if (password.length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalı.")
      setStatus("error")
      return
    }

    setStatus("loading")
    setErrorMessage("")

    try {
      // Doğrudan backend API'ye (Neon veritabanına) istek atıyoruz
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isSignUp ? "signup" : "signin",
          email: cleanEmail,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setErrorMessage(data.error || "İşlem sırasında bir hata oluştu.")
        setStatus("error")
        return
      }

      // Başarılı kayıt veya giriş durumunda kullanıcıyı localStorage'a kaydet ve oturumu tetikle
      const loggedUser = data.user || { id: "user_" + Date.now(), email: cleanEmail }
      localStorage.setItem("custom_user", JSON.stringify(loggedUser))
      
      // Tüm uygulamaya oturumun değiştiğini duyur
      window.dispatchEvent(new Event("auth-change"))

      setStatus("success")
      setTimeout(() => {
        onClose()
        onAuthSuccess()
        setStatus("idle")
      }, 500)

    } catch (err: any) {
      setErrorMessage(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.")
      setStatus("error")
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div className="relative w-full max-w-md rounded-3xl bg-[#1B1D22] p-8 shadow-2xl border border-white/10 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <div key="success" className="text-center py-8">
                    <CheckCircle2 className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">
                      {isSignUp ? "Kayıt Başarılı!" : "Giriş Başarılı!"}
                    </h3>
                  </div>
                ) : (
                  <form key="form" onSubmit={handleSubmit}>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white">
                        {isSignUp ? "Hesap Oluştur" : "Giriş Yap"}
                      </h2>
                    </div>

                    {showTabs && (
                      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(false)
                            setStatus("idle")
                            setErrorMessage("")
                          }}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                            !isSignUp ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Giriş Yap
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(true)
                            setStatus("idle")
                            setErrorMessage("")
                          }}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                            isSignUp ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Kayıt Ol
                        </button>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          ref={emailRef}
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 text-white placeholder:text-slate-500 bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="E-posta"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-12 pl-12 pr-12 rounded-xl border border-white/10 text-white placeholder:text-slate-500 bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Şifre"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {status === "error" && (
                      <div className="flex items-center gap-2 text-sm text-red-400 mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full h-12 rounded-xl bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {status === "loading" ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-950" />
                      ) : isSignUp ? (
                        "Kayıt Ol"
                      ) : (
                        "Giriş Yap"
                      )}
                    </button>
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}