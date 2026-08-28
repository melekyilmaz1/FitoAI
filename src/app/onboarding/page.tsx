"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MultiStepForm } from "@/components/onboarding/multi-step-form"

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[#D94A1D]/10 blur-[200px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-400/10 blur-[200px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-12">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-2xl mx-auto w-full mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
            Ana sayfaya dön
          </Link>
        </motion.div>

        {/* Multi-step form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex-1 max-w-2xl mx-auto w-full py-8"
        >
          <MultiStepForm />
        </motion.div>
      </div>
    </main>
  )
}