"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useReducedMotion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { ArrowLeft, User as UserIcon, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types"

interface DashboardHeaderProps {
  user: User | null
  profile: User | null
  streakCount?: number
  onSignOut: () => void
  onOpenAuth: () => void
}

export function DashboardHeader({ user, profile, streakCount, onSignOut, onOpenAuth }: DashboardHeaderProps) {
  const reducedMotion = useReducedMotion()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Dışarı tıklandığında dropdown'ı kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDropdownOpen])

  const handleSignOut = () => {
    setIsDropdownOpen(false)
    onSignOut()
  }

  const initials = user?.email?.charAt(0).toUpperCase() || "U"

  // Dinamik olarak hesaplanan streak verisi varsa onu al, yoksa profildeki değeri kullan
  const displayStreak = streakCount !== undefined ? streakCount : (profile?.streak_days || 0)

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="px-4 py-4"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between min-h-[40px]">
        {/* Sol Üst: Kullanıcı yoksa Ana Sayfa linkini göster, kullanıcı giriş yaptıysa GİZLE */}
        <div>
          {!user && (
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Ana Sayfa</span>
            </Link>
          )}
        </div>

        {/* Sağ Üst: Gün Sayacı ve Profil Yapısı */}
        <div className="flex items-center gap-3 relative">
          {user ? (
            <>
              {/* Dinamik Gün Sayacı (Streak) */}
              <span className="text-xs text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                {displayStreak} gün 🔥
              </span>

              {/* Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                  className="flex h-9 px-2.5 items-center justify-center gap-1 rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer"
                  aria-label="Kullanıcı menüsü"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="text-sm">{initials}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                </motion.button>

                {/* Dropdown Popover (Dark Mode Uyumlu) */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute right-0 mt-2 w-52 bg-[#1B1D22] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                      role="menu"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">Fitokal Kullanıcısı</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        role="menuitem"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <motion.button
              onClick={onOpenAuth}
              whileHover={reducedMotion ? undefined : { scale: 1.05 }}
              whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <UserIcon className="h-4 w-4" />
              Giriş Yap
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  )
}