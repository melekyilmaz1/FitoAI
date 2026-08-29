"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { ArrowRight, LogIn } from "lucide-react"
import { ThreeDPhotoCarousel } from "@/components/ui/3d-carousel"
import { AuthModal } from "@/components/dashboard/auth-modal"

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = () => {
      try {
        const savedUser = localStorage.getItem("custom_user")
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser))
        } else {
          setCurrentUser(null)
        }
      } catch {
        setCurrentUser(null)
      }
    }

    checkUser()
    window.addEventListener("auth-change", checkUser)
    return () => window.removeEventListener("auth-change", checkUser)
  }, [])

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://unpkg.com/@splinetool/viewer@1.9.72/build/spline-viewer.js"
    script.type = "module"
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <main className="h-screen max-h-screen overflow-hidden bg-black text-white relative flex flex-col justify-between py-4 px-4 sm:px-6 font-sora antialiased selection:bg-[#D94A1D] selection:text-white">
      {/* Sağ Taraftaki Kiremit / Turuncu Sızıntı Efekti (Glow) */}
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[450px] h-[550px] rounded-full blur-[140px] pointer-events-none opacity-60 z-[1]"
        style={{
          background: "radial-gradient(circle, rgba(217, 74, 29, 0.85) 0%, rgba(217, 74, 29, 0) 70%)"
        }}
      />

      {/* 3D Spline Arka Planı */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* @ts-ignore - spline-viewer custom element */}
        <spline-viewer
          url="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
          style={{
            width: "100%",
            height: "100%",
            filter: "grayscale(100%) brightness(0.65) contrast(1.2)",
          }}
        />
      </div>

      {/* Şeffaf Siyah Overlay */}
      <div className="absolute inset-0 bg-black/30 z-[1] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 flex items-center justify-between max-w-7xl w-full mx-auto shrink-0 h-12 pointer-events-auto">
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-1">
          <span>FITO</span>
          <span className="h-2 w-2 rounded-full bg-[#D94A1D]" />
        </div>

        {/* Sadece Giriş Yap Butonu (Kullanıcı giriş yapmamışsa görünür) */}
        {!currentUser && (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/10 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>
        )}
      </header>

      {/* Main Content Wrapper */}
      <div className="relative z-10 pointer-events-none flex flex-1 flex-col items-center justify-center my-auto w-full max-w-5xl mx-auto text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full text-center shrink-0"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D94A1D]/15 text-[#D94A1D] text-xs font-medium border border-[#D94A1D]/30 mb-3"
          >
            <span className="relative flex h-2 w-2">
              <motion.span
                className="absolute inset-0 rounded-full bg-[#D94A1D]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative z-10 h-2 w-2 rounded-full bg-[#D94A1D]" />
            </span>
            AI Destekli Kişisel Koç
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-2 sm:mb-3 uppercase"
          >
            Hayalindeki Vücuda ve
            <br />
            <span className="text-[#D94A1D]">
              Sağlıklı Yaşama Adım At
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xs sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed"
          >
            Yapay zeka destekli, sana özel antrenman ve beslenme planlarıyla hedeflerine ulaş.
            Bilim temelli, sürdürülebilir ve keyifli bir dönüşüm deneyimi.
          </motion.p>
        </motion.div>

        {/* 3D Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-5xl py-2 shrink-0 pointer-events-auto"
        >
          <div className="max-h-[220px] sm:max-h-[280px] flex items-center justify-center overflow-hidden">
            <ThreeDPhotoCarousel />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="text-center text-[11px] sm:text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1.5"
          >
            <motion.span
              animate={{ x: [-3, 3, -3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-[#D94A1D]"
            >
              ←
            </motion.span>
            Büyütmek için resimlere tıkla
            <motion.span
              animate={{ x: [-3, 3, -3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-[#D94A1D]"
            >
              →
            </motion.span>
          </motion.p>
        </motion.div>

        {/* CTA Button & Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="w-full max-w-sm shrink-0 mt-1 pointer-events-auto"
        >
          <Link
            href="/onboarding"
            className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-[#D94A1D] hover:bg-[#B83E17] px-6 py-3.5 text-white text-sm sm:text-base font-bold shadow-lg shadow-[#D94A1D]/30 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Ücretsiz Planımı Oluştur
              <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </div>
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-3 flex items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs text-zinc-400"
          >
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D94A1D]" />
              Kredi kartı gerekmez
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D94A1D]" />
              2 dakikada hazır
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D94A1D]" />
              Bilim temelli
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false)
          window.location.href = "/dashboard"
        }}
      />
    </main>
  )
}