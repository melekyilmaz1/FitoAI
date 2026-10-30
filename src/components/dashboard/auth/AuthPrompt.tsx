"use client"

import { motion } from "motion/react"
import { Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface AuthPromptProps {
  onOpenAuth: () => void
}

export function AuthPrompt({ onOpenAuth }: AuthPromptProps) {
  const { user } = useAuth()

  // Kullanıcı oturum açmışsa banner'ı tamamen gizle
  if (user) {
    return null
  }

  return (
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
          onClick={onOpenAuth}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          Hesap Oluştur
        </motion.button>
      </div>
    </motion.section>
  )
}