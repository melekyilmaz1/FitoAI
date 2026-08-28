"use client"

import { memo } from "react"
import { LayoutGrid, History, Sparkles, Dumbbell, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types"

type TabId = "summary" | "history" | "ai" | "meals" | "profile"

interface TabBarProps {
  activeTab: TabId
  onChange: (tab: TabId) => void
  user: User | null
  onOpenAuth: () => void
}

const tabsConfig = [
  { id: "summary" as const, label: "Özet", icon: LayoutGrid, requiresAuth: false },
  { id: "history" as const, label: "Geçmiş", icon: History, requiresAuth: true },
  { id: "ai" as const, label: "AI Koç", icon: Sparkles, requiresAuth: true },
  { id: "meals" as const, label: "Yemekler", icon: Dumbbell, requiresAuth: true },
  { id: "profile" as const, label: "Profil", icon: UserIcon, requiresAuth: true },
] as const

function TabBarInner({ activeTab, onChange, user, onOpenAuth }: TabBarProps) {
  return (
    <div className="flex gap-1 sm:gap-2 mb-6 bg-[#1B1D22] rounded-2xl p-1.5 border border-white/5">
      {tabsConfig.map((tab) => {
        const Icon = tab.icon
        const active = activeTab === tab.id
        const isRestricted = tab.requiresAuth && !user

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (isRestricted) {
                onOpenAuth()
              } else {
                onChange(tab.id)
              }
            }}
            className={cn(
              "flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none",
              active
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
              isRestricted && "opacity-75 hover:opacity-100"
            )}
            title={isRestricted ? "Bu sekmeye erişim için giriş yapmalısınız" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export const TabBar = memo(TabBarInner)
TabBar.displayName = "TabBar"