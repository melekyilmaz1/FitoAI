"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { X, Mail, Lock, CheckCircle2, Loader2, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string) => Promise<{ error: Error | null }>
}

export function AuthModal({ isOpen, onClose, onSubmit }: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(true)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const emailRef = useRef<HTMLInputElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (isOpen) {
      setStatus("idle")
      setErrorMessage("")
      setEmail("")
      setPassword("")
      setTimeout(() => emailRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setErrorMessage("Geçerli bir e-posta adresi girin")
      return
    }

    if (isSignUp && password.length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalı")
      return
    }

    setStatus("loading")
    setErrorMessage("")

    try {
      const result = await onSubmit(email)
      if (result.error) {
        setStatus("error")
        setErrorMessage(result.error.message)
        return
      }
      setStatus("success")
      setTimeout(() => {
        onClose()
        setStatus("idle")
      }, 1500)
    } catch (err) {
      setStatus("error")
      setErrorMessage("Bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: reducedMotion ? 0 : 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : 0.1, duration: 0.3 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-100"
            >
              {/* Close button */}
              <motion.button
                onClick={onClose}
                whileHover={reducedMotion ? undefined : { scale: 1.1, rotate: 90 }}
                whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </motion.button>

              {/* Content */}
              <AnimatePresence mode="wait">
                {status === "idle" || status === "loading" || status === "error" ? (
                  <form onSubmit={handleSubmit} key="form">
                    <div className="text-center mb-8">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                        <Mail className="h-7 w-7" />
                      </div>
                      <h2 id="modal-title" className="text-2xl font-bold text-slate-900">
                        Planına Erişim
                      </h2>
                      <p className="mt-2 text-slate-600">
                        E-posta adresini gir, özel antrenman ve beslenme planına hemen ulaş.
                      </p>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="email" className="sr-only">
                        E-posta adresi
                      </label>
                      <div className="relative">
                        <Mail
                          className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5",
                            status === "error" ? "text-red-500" : "text-slate-400"
                          )}
                          aria-hidden="true"
                        />
                        <input
                          ref={emailRef}
                          id="email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={status === "loading"}
                          className={cn(
                            "w-full h-12 pl-12 pr-4 rounded-xl border text-slate-900 placeholder-slate-400 transition-all duration-300",
                            "focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                            status === "error"
                              ? "border-red-500 bg-red-50 focus:border-red-500"
                              : "border-slate-200 hover:border-slate-300 focus:border-emerald-500"
                          )}
                          placeholder="ornek@email.com"
                          aria-invalid={status === "error"}
                          aria-describedby={status === "error" ? "email-error" : undefined}
                        />
                      </div>
                      {status === "error" && (
                        <motion.p
                          id="email-error"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-500 flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          {errorMessage}
                        </motion.p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={status === "loading" || !email}
                      whileHover={reducedMotion || status === "loading" ? undefined : { scale: 1.02 }}
                      whileTap={reducedMotion || status === "loading" ? undefined : { scale: 0.98 }}
                      className={cn(
                        "w-full h-12 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2",
                        status === "loading"
                          ? "bg-emerald-400 cursor-wait"
                          : "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                      )}
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Hazırlanıyor...
                        </>
                      ) : (
                        "Planımı Başlat →"
                      )}
                    </motion.button>

                    <p className="mt-4 text-center text-xs text-slate-500">
                      Kayıt olarak{" "}
                      <a href="#" className="underline hover:text-emerald-600">
                        Kullanım Şartları
                      </a>{" "}
                      ve{" "}
                      <a href="#" className="underline hover:text-emerald-600">
                        Gizlilik Politikası
                      </a>{" "}
                      kabul etmiş olursunuz.
                    </p>
                  </form>
                ) : (
                  // Success state
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white mb-4"
                    >
                      <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Hazır! 🎉</h3>
                    <p className="text-slate-600">
                      Planın e-posta adresine gönderildi. Gelen kutunu kontrol et.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}