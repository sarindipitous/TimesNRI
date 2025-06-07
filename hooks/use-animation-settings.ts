"use client"

import { useReducedMotion } from "framer-motion"
import { usePerformance } from "./use-performance"
import { useState, useEffect } from "react"

export function useAnimationSettings() {
  const prefersReducedMotion = useReducedMotion()
  const isLowPerformance = usePerformance()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Determine if animations should be disabled or simplified
  const shouldReduceMotion = prefersReducedMotion || isLowPerformance

  // Create animation settings based on device and preferences
  const settings = {
    enabled: !shouldReduceMotion,
    duration: shouldReduceMotion ? 0.1 : isMobile ? 0.3 : 0.5,
    staggerChildren: shouldReduceMotion ? 0 : isMobile ? 0.05 : 0.1,
    distance: shouldReduceMotion ? 0 : isMobile ? 10 : 20,
    scale: shouldReduceMotion ? 1 : isMobile ? 1.05 : 1.1,
  }

  return {
    ...settings,
    isMobile,
    prefersReducedMotion,
    isLowPerformance,
  }
}
