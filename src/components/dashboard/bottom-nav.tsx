"use client"

import { memo } from "react"
import { motion } from "motion/react"
import { LayoutGrid, History, Plus, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type BottomTabId = "summary" | "history" | "ai" | "meals" | "profile"

interface BottomNavProps {
  activeTab: BottomTabId
  onTabChange: (tab: BottomTabId) => void
  onAddMeal: () => void
  onOpenAuth?: () => void
  user: any
}

function BottomNavInner({ activeTab, onTabChange, onAddMeal, onOpenAuth, user }: BottomNavProps) {
  const tabs = [
    { id: "summary" as const, label: "Özet", icon: LayoutGrid },
    { id: "history" as const, label: "Geçmiş", icon: History },
    { id: "ai" as const, label: "AI Koç", icon: Sparkles },
    { id: "meals" as const, label: "Ekle", icon: Plus },
    { id: "profile" as const, label: "Profil", icon: User },
  ]

  const handleTabClick = (tabId: BottomTabId) => {
    // 1. "Ekle" butonuna tıklandığında Modal/Form aç
    if (tabId === "meals") {
      onAddMeal()
      return
    }

    // 2. Giriş yapılmamışsa ve Profil tıklandıysa Auth Modalını aç
    if (tabId === "profile" && !user) {
      if (onOpenAuth) {
        onOpenAuth()
      } else {
        onTabChange("profile")
      }
      return
    }

    // 3. Giriş yapılmamışsa ve AI Koç tıklandıysa Auth Modalını aç
    if (tabId === "ai" && !user) {
      if (onOpenAuth) {
        onOpenAuth()
      } else {
        onTabChange("ai")
      }
      return
    }

    // 4. Normal sekme değişimi
    onTabChange(tabId)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40">
      <nav className="bg-[#1B1D22] backdrop-blur-xl border-t border-white/5 px-4 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around h-16">
          {tabs.map((tab) => (
            <NavItem
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={() => handleTabClick(tab.id)}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}

function NavItem({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200 cursor-pointer",
        active ? "text-amber-500" : "text-white/50 hover:text-white"
      )}
    >
      <motion.div
        initial={false}
        animate={{ scale: active ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="h-6 w-6 flex items-center justify-center"
      >
        <Icon className={cn("h-5 w-5", active && "text-amber-500")} />
      </motion.div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

export const BottomNav = memo(BottomNavInner)
BottomNav.displayName = "BottomNav"