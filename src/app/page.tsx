"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ThreeDPhotoCarousel } from "@/components/ui/3d-carousel"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-400/10 blur-[200px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-400/10 blur-[200px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-400/5 blur-[200px] animate-pulse delay-2000" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-emerald-400/30 rounded-full animate-bounce delay-0" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-amber-400/40 rounded-full animate-bounce delay-500" />
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-emerald-400/30 rounded-full animate-bounce delay-1000" />
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-amber-400/30 rounded-full animate-bounce delay-1500" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20">
        {/* Header / Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-5xl text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 text-sm font-medium border border-emerald-500/20 mb-6"
          >
            <span className="relative flex h-2 w-2">
              <motion.span
                className="absolute inset-0 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative z-10 h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            AI Destekli Kişisel Koç
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 leading-tight mb-6"
          >
            Hayalindeki Vücuda ve
            <br />
            <span className="relative">
              Sağlıklı Yaşama Adım At
              <span className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-amber-400 opacity-30 -z-10" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            Yapay zeka destekli, sana özel antrenman ve beslenme planlarıyla hedeflerine ulaş.
            Bilim temelli, sürdürülebilir ve keyifli bir dönüşüm deneyimi.
          </motion.p>
        </motion.div>

        {/* 3D Carousel Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-6xl mb-16"
        >
          <ThreeDPhotoCarousel />

          {/* Carousel hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-center text-sm text-slate-500 mt-6 flex items-center justify-center gap-2"
          >
            <motion.span
              animate={{ x: [-4, 4, -4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-emerald-500"
            >
              ←
            </motion.span>
            Sürükle veya tıkla keşfetmek için
            <motion.span
              animate={{ x: [-4, 4, -4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-emerald-500"
            >
              →
            </motion.span>
          </motion.p>
        </motion.div>

        {/* CTA Button Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <Link
            href="/onboarding"
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-8 py-5 text-white text-lg font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 overflow-hidden"
          >
            {/* Glowing background effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
            />

            <span className="relative z-10 flex items-center gap-2">
              Ücretsiz Planımı Oluştur
              <motion.div
                className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-colors"
              >
                <motion.span
                  initial={{ x: 0 }}
                  animate={{ x: 4 }}
                  transition={{ delay: 0.3, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </motion.div>
            </span>

            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-emerald-400/50 pointer-events-none"
              animate={{ scale: [1, 1.05], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-emerald-300/30 pointer-events-none"
              animate={{ scale: [1, 1.08], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
            />
          </Link>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Kredi kartı gerekmez
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              2 dakikada hazır
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Bilim temelli
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400"
      >
        <span className="text-xs uppercase tracking-wider">Daha fazlası için</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-6 w-6 rounded-full border-2 border-slate-300 flex items-center justify-center"
        >
          <motion.span
            className="h-1.5 w-1.5 border-r-2 border-b-2 border-slate-400 rotate-45"
          />
        </motion.div>
      </motion.div>
    </main>
  )
}