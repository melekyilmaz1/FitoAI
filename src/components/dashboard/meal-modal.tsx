"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { X, Camera, Type, Loader2, Check, Minus, Plus, Sparkles, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface MealModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (meal: any) => void
}

interface AnalysisResult {
  meal_name: string
  meal_type: "Kahvaltı" | "Öğle" | "Akşam" | "Ara Öğün"
  portion_count: number
  total_grams: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  base_protein_100g?: number
  base_carbs_100g?: number
  base_fat_100g?: number
}

export function MealModal({ isOpen, onClose, onSave }: MealModalProps) {
  const [mode, setMode] = useState<"text" | "photo">("text")
  const [textInput, setTextInput] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setMode("text")
    setTextInput("")
    setPhoto(null)
    setIsAnalyzing(false)
    setResult(null)
    setError("")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const analyze = async () => {
    setError("")
    if (mode === "text" && !textInput.trim()) {
      setError("Lütfen yediğin şeyi yaz.")
      return
    }
    if (mode === "photo" && !photo) {
      setError("Lütfen bir fotoğraf ekle.")
      return
    }

    setIsAnalyzing(true)
    try {
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, text: textInput, image: photo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Analiz başarısız")

      const grams = data.total_grams || 100
      const baseProtein = (data.protein_g / grams) * 100
      const baseCarbs = (data.carbs_g / grams) * 100
      const baseFat = (data.fat_g / grams) * 100

      // Dinamik isim belirleme: AI'dan geçerli isim dönmediyse yazılan girdiyi (örn. "yulaf") kullan
      const fallbackName = mode === "text" ? textInput.trim() : "Özel Öğün"
      const finalMealName = data.meal_name && data.meal_name.trim() !== "" && data.meal_name.toLowerCase() !== "yemek"
        ? data.meal_name 
        : fallbackName

      setResult({
        ...data,
        meal_name: finalMealName,
        base_protein_100g: baseProtein,
        base_carbs_100g: baseCarbs,
        base_fat_100g: baseFat,
      })
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const recalculateByGrams = (newGrams: number, currentResult: AnalysisResult) => {
    const safeGrams = Math.max(0, newGrams)
    const factor = safeGrams / 100

    const protein = Math.round((currentResult.base_protein_100g ?? (currentResult.protein_g / (currentResult.total_grams || 1) * 100)) * factor * 10) / 10
    const carbs = Math.round((currentResult.base_carbs_100g ?? (currentResult.carbs_g / (currentResult.total_grams || 1) * 100)) * factor * 10) / 10
    const fat = Math.round((currentResult.base_fat_100g ?? (currentResult.fat_g / (currentResult.total_grams || 1) * 100)) * factor * 10) / 10
    const calories = Math.round(protein * 4 + carbs * 4 + fat * 9)

    return {
      ...currentResult,
      total_grams: safeGrams,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      calories,
    }
  }

  const handleGramChange = (newGrams: number) => {
    if (!result) return
    setResult(recalculateByGrams(newGrams, result))
  }

  const handlePortionChange = (delta: number) => {
    if (!result) return
    const newPortion = Math.max(0.5, result.portion_count + delta)
    const ratio = newPortion / (result.portion_count || 1)
    const newGrams = Math.round(result.total_grams * ratio)
    
    const updated = recalculateByGrams(newGrams, result)
    setResult({ ...updated, portion_count: newPortion })
  }

  const saveMeal = async () => {
    if (!result) return

    let userId: string | null = null
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("custom_user")
      if (stored) {
        try {
          const user = JSON.parse(stored)
          userId = user.id
        } catch {
          // ignore parse error
        }
      }
    }

    if (!userId) {
      setError("Lütfen önce giriş yap.")
      return
    }

    const calculatedCalories = Math.round(result.protein_g * 4 + result.carbs_g * 4 + result.fat_g * 9)
    const today = new Date().toISOString().split("T")[0]
    
    // Yemeğin son adını kullanıcı girdisi veya analizden elde et
    const finalMealName = (result.meal_name && result.meal_name.trim() !== "" && result.meal_name.toLowerCase() !== "yemek")
      ? result.meal_name.trim()
      : (mode === "text" && textInput.trim() ? textInput.trim() : "Özel Öğün")

    const response = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name: finalMealName,          // Tüm olası alan adları ekleniyor
        meal_name: finalMealName,
        food_name: finalMealName,
        title: finalMealName,
        meal_type: result.meal_type,
        portion_count: result.portion_count,
        total_grams: result.total_grams,
        calories: calculatedCalories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
        image_url: photo,
        date: today,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || "Kaydetme başarısız")
      return
    }

    // Ekranın anında güncellenmesi için tüm isim Varyasyonlarını ekliyoruz
    if (onSave) {
      const rawMeal = data.meal || data || {}
      
      const savedMeal = {
        ...rawMeal,
        id: rawMeal.id || Date.now().toString(),
        user_id: userId,
        name: finalMealName,
        meal_name: finalMealName,
        food_name: finalMealName,
        title: finalMealName,
        meal_type: result.meal_type,
        calories: calculatedCalories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
        created_at: rawMeal.created_at || new Date().toISOString(),
      }

      onSave(savedMeal)
    }

    try {
      await fetch("/api/user/streak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
    } catch (err) {
      console.warn("Streak update failed:", err)
    }

    handleClose()
  }

  const mealTypeLabels = ["Kahvaltı", "Öğle", "Akşam", "Ara Öğün"] as const

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-3xl bg-[#1B1D22] border border-white/10 text-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121316]">
                {result ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 pr-4">
                      <input
                        type="text"
                        value={result.meal_name}
                        onChange={(e) => setResult({ ...result, meal_name: e.target.value })}
                        className="text-base font-bold text-white bg-transparent border-b border-dashed border-white/20 focus:border-amber-500 outline-none w-full"
                        placeholder="Yemek Adı"
                      />
                      <p className="text-xs text-slate-400 mt-0.5">{result.meal_type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-extrabold text-amber-500">
                        {Math.round(result.protein_g * 4 + result.carbs_g * 4 + result.fat_g * 9)} kcal
                      </p>
                      <p className="text-[10px] text-slate-400">Toplam</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <h2 className="text-base font-bold text-white">Yemek Ekle</h2>
                    <button onClick={handleClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {!result && (
                  <>
                    <div className="grid grid-cols-2 gap-2 bg-[#121316] p-1 rounded-2xl border border-white/5">
                      <button
                        onClick={() => setMode("text")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                          mode === "text" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                        )}
                      >
                        <Type className="h-4 w-4" />
                        Yazarak
                      </button>
                      <button
                        onClick={() => setMode("photo")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                          mode === "photo" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                        )}
                      >
                        <Camera className="h-4 w-4" />
                        Fotoğraf
                      </button>
                    </div>

                    {mode === "text" && (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Ne yedin?</label>
                        <textarea
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          rows={3}
                          placeholder="Örn: 1 porsiyon ızgara tavuk, 1 su bardağı pirinç pilavı"
                          className="w-full rounded-2xl bg-[#121316] border border-white/10 p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                        />
                      </div>
                    )}

                    {mode === "photo" && (
                      <div>
                        {photo ? (
                          <div className="relative rounded-2xl overflow-hidden border border-white/10">
                            <img src={photo} alt="Meal" className="w-full h-44 object-cover" />
                            <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => fileRef.current?.click()} className="w-full h-44 rounded-2xl border border-dashed border-white/20 bg-[#121316] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-amber-500 hover:text-amber-500 transition-colors cursor-pointer">
                            <Camera className="h-8 w-8" />
                            <span className="text-xs font-medium">Fotoğraf ekle</span>
                          </button>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
                      </div>
                    )}

                    {error && <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

                    <button
                      onClick={analyze}
                      disabled={isAnalyzing}
                      className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg"
                    >
                      {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> : <Sparkles className="h-4 w-4" />}
                      {isAnalyzing ? "Analiz ediliyor..." : "Analiz Et"}
                    </button>
                  </>
                )}

                {result && (
                  <motion.div className="space-y-4">
                    {/* Öğün Seçimi */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Öğün Seçimi</label>
                      <div className="flex gap-1.5 bg-[#121316] p-1 rounded-xl border border-white/5">
                        {mealTypeLabels.map((type) => (
                          <button
                            key={type}
                            onClick={() => setResult({ ...result, meal_type: type })}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                              result.meal_type === type ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Porsiyon & Gramaj */}
                    <div className="bg-[#121316] rounded-2xl p-4 border border-white/5 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        Porsiyon / Gramaj
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-medium">PORSİYON ADEDİ</label>
                          <div className="flex items-center justify-between bg-white/5 rounded-xl border border-white/10 p-1.5">
                            <button onClick={() => handlePortionChange(-0.5)} disabled={result.portion_count <= 0.5} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-sm font-bold text-white">{result.portion_count}</span>
                            <button onClick={() => handlePortionChange(0.5)} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-slate-300 hover:bg-white/10">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-medium">TOPLAM GRAMAJ (G)</label>
                          <div className="flex items-center justify-between bg-white/5 rounded-xl border border-white/10 p-1.5">
                            <button onClick={() => handleGramChange(result.total_grams - 25)} disabled={result.total_grams <= 10} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              value={result.total_grams}
                              onChange={(e) => handleGramChange(Number(e.target.value))}
                              className="w-12 text-center text-sm font-bold text-white bg-transparent focus:outline-none"
                            />
                            <button onClick={() => handleGramChange(result.total_grams + 25)} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-slate-300 hover:bg-white/10">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Makro Değerler */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        Makro Değerler
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        <MacroCard label="PROTEİN" value={result.protein_g} unit="g" color="emerald" onChange={(val) => setResult({ ...result, protein_g: val })} />
                        <MacroCard label="KARBONHİDRAT" value={result.carbs_g} unit="g" color="amber" onChange={(val) => setResult({ ...result, carbs_g: val })} />
                        <MacroCard label="YAĞ" value={result.fat_g} unit="g" color="red" onChange={(val) => setResult({ ...result, fat_g: val })} />
                      </div>
                    </div>

                    {/* Dinamik Kalori Kartı */}
                    <div className="bg-[#121316] rounded-2xl border border-white/5 p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                          <Flame className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold">TOPLAM KALORİ</p>
                          <p className="text-lg font-extrabold text-white">
                            {Math.round(result.protein_g * 4 + result.carbs_g * 4 + result.fat_g * 9)} kcal
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">(Makrolardan hesaplandı)</span>
                    </div>

                    <p className="text-[11px] text-slate-500 text-center bg-white/5 rounded-xl p-2.5">
                      Değerler yapay zeka tarafından verilmiş olup kontrol edilmesi önerilir.
                    </p>

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setResult(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/5 transition-colors">
                        Düzenle
                      </button>
                      <button onClick={saveMeal} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5 shadow-lg cursor-pointer">
                        <Check className="h-4 w-4" />
                        Onayla ve Kaydet
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function MacroCard({ label, value, unit, color, onChange }: { label: string; value: number; unit: string; color: "emerald" | "amber" | "red"; onChange: (val: number) => void }) {
  const colorMap = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
    red: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400" },
  }
  const c = colorMap[color]
  return (
    <div className={cn("rounded-2xl p-3 border text-center flex flex-col items-center justify-center", c.bg, c.border)}>
      <span className={cn("text-xs font-extrabold mb-1", c.text)}>⚖</span>
      <p className="text-[9px] font-bold text-slate-400 tracking-wider mb-1">{label}</p>
      <input
        type="number"
        step="0.1"
        min="0"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className={cn("w-full text-center text-base font-extrabold outline-none bg-transparent", c.text)}
      />
      <p className="text-[10px] text-slate-500 mt-0.5">{unit}</p>
    </div>
  )
}