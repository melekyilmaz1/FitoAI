"use client"

import { useRef, useEffect, useCallback, useMemo } from "react"
import { motion, useReducedMotion, AnimatePresence } from "motion/react"
import { Send, Sparkles, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface AIChatTabProps {
  messages: Array<{ id: string; sender: "user" | "ai"; message: string }>
  onSend: (message: string) => Promise<void>
  isLoading: boolean
  inputValue: string
  onInputChange: (value: string) => void
}

const SUGGESTIONS = ["Bugün ne yemeliyim?", "Kalori hedefime nasıl ulaşırım?"] as const

export function AIChatTab({ messages, onSend, isLoading, inputValue, onInputChange }: AIChatTabProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  // Stable handler - doesn't depend on inputValue
  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = textToSend || inputValue
      if (!text.trim() || isLoading) return

      onInputChange("")
      await onSend(text.trim())
    },
    [inputValue, isLoading, onSend, onInputChange]
  )

  // Stable suggestion handlers
  const suggestionHandlers = useMemo(
    () =>
      SUGGESTIONS.map((s) => ({
        label: s,
        onClick: () => handleSend(s),
      })),
    [handleSend]
  )

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[550px] w-full">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">AI Beslenme Koçu</h2>
            <p className="text-xs text-slate-500">Sınırsız ve ücretsiz 💚</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 flex flex-col items-center justify-center h-full"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="text-slate-700 font-semibold text-base">Merhaba! Ben senin AI beslenme koçun 🤖</p>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">Sana özel beslenme ve fitness sorularını yanıtlayabilirim.</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn("flex w-full", msg.sender === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-hidden break-words",
                  msg.sender === "user"
                    ? "bg-emerald-500 text-white rounded-br-none"
                    : "bg-slate-100 text-slate-800 rounded-bl-none shadow-sm"
                )}
              >
                {msg.sender === "user" ? (
                  <span className="whitespace-pre-wrap">{msg.message}</span>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start w-full"
          >
            <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span className="text-sm text-slate-600 font-medium">Koç yanıt hazırlıyor...</span>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-slate-100 flex-shrink-0 bg-white">
        {/* Öneri Butonları */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {suggestionHandlers.map(({ label, onClick }) => (
            <button
              key={label}
              type="button"
              disabled={isLoading}
              onClick={onClick}
              className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full hover:bg-emerald-100 active:scale-95 disabled:opacity-50 transition-all border border-emerald-100"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input Alanı */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Beslenme sorunuzu yazın..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 text-sm"
          />
          <motion.button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            whileHover={reducedMotion || !inputValue.trim() || isLoading ? undefined : { scale: 1.03 }}
            whileTap={reducedMotion || !inputValue.trim() || isLoading ? undefined : { scale: 0.97 }}
            className={cn(
              "flex items-center justify-center h-11 w-11 rounded-xl transition-all flex-shrink-0 shadow-sm",
              inputValue.trim() && !isLoading
                ? "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}