"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Droplet } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function WaterTracker() {
  const { user } = useAuth()
  const [waterMl, setWaterMl] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const targetMl = 2500

  // Load water data from API on mount and when user changes
  useEffect(() => {
    const loadWater = async () => {
      if (!user) {
        setWaterMl(0)
        setIsLoading(false)
        return
      }

      try {
        const today = new Date().toISOString().split("T")[0]
        const response = await fetch(`/api/user/water?userId=${user.id}&date=${today}`)
        const data = await response.json()
        if (data.water && data.water.length > 0) {
          setWaterMl(data.water[0].amount_ml)
        } else {
          setWaterMl(0)
        }
      } catch (error) {
        console.error("Error loading water data:", error)
        setWaterMl(0)
      } finally {
        setIsLoading(false)
      }
    }

    loadWater()
  }, [user])

  const addWater = useCallback(async (amount: number) => {
    if (!user) return

    const updated = waterMl + amount
    setWaterMl(updated)

    try {
      await fetch("/api/user/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: updated, userId: user.id }),
      })
    } catch (error) {
      console.error("Error saving water data:", error)
      // Revert on error
      setWaterMl(waterMl)
    }
  }, [waterMl, user])

  if (isLoading) {
    return (
      <div className="bg-[#1B1D22] border border-white/10 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-sky-400 fill-sky-400" />
            <h3 className="font-bold text-sm">Su Takibi</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Yükleniyor...</span>
        </div>
        <div className="w-full h-2.5 bg-[#121316] rounded-full overflow-hidden mb-4 border border-white/5">
          <div className="h-full bg-sky-400 animate-pulse" style={{ width: "50%" }} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1B1D22] border border-white/10 rounded-3xl p-5 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-sky-400 fill-sky-400" />
          <h3 className="font-bold text-sm">Su Takibi</h3>
        </div>
        <span className="text-xs text-slate-400 font-semibold">{waterMl} / {targetMl} ml</span>
      </div>

      {/* İlerleme Çubuğu */}
      <div className="w-full h-2.5 bg-[#121316] rounded-full overflow-hidden mb-4 border border-white/5">
        <div
          className="h-full bg-sky-400 transition-all duration-300"
          style={{ width: `${Math.min(100, (waterMl / targetMl) * 100)}%` }}
        />
      </div>

      {/* Hızlı Ekleme Butonları */}
      <div className="flex gap-2">
        {[200, 330, 500].map((amount) => (
          <button
            key={amount}
            onClick={() => addWater(amount)}
            className="flex-1 py-2 bg-white/5 hover:bg-sky-500/20 hover:text-sky-400 border border-white/5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> +{amount} ml
          </button>
        ))}
      </div>
    </div>
  )
}