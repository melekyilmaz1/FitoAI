"use client"

import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"

interface ConfettiEffectProps {
  trigger: boolean
  onComplete?: () => void
}

export function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  const animationFrameRef = useRef<number | null>(null)
  const hasFiredRef = useRef(false)

  useEffect(() => {
    if (!trigger || hasFiredRef.current) return

    hasFiredRef.current = true

    const duration = 3 * 1000
    const end = Date.now() + duration
    const colors = ["#10b981", "#34d399", "#f59e0b", "#fbbf24", "#ffffff"]

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) {
      onComplete?.()
      return
    }

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
        scalar: 1.2,
      })

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
        scalar: 1.2,
      })

      // Center burst
      if (Date.now() < end) {
        confetti({
          particleCount: 2,
          angle: 90,
          spread: 45,
          origin: { x: 0.5, y: 0.5 },
          colors,
          scalar: 0.8,
        })
      }

      if (Date.now() < end) {
        animationFrameRef.current = requestAnimationFrame(frame)
      } else {
        // Final big burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.5, y: 0.4 },
          colors,
          scalar: 1.5,
          zIndex: 1000,
        })

        setTimeout(() => {
          onComplete?.()
        }, 500)
      }
    }

    frame()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [trigger, onComplete])

  // Reset when trigger goes false
  useEffect(() => {
    if (!trigger) {
      hasFiredRef.current = false
    }
  }, [trigger])

  return null
}

// Alternative: Simple one-shot confetti for button clicks
export function triggerConfetti() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches

  if (prefersReducedMotion) return

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.5, y: 0.4 },
    colors: ["#10b981", "#34d399", "#f59e0b", "#fbbf24", "#ffffff"],
    scalar: 1.2,
    zIndex: 1000,
  })
}