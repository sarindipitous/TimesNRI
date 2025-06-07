"use client"

import { useState, useEffect } from "react"

// Hook to detect low-end devices or poor performance
export function usePerformance() {
  const [isLowPerformance, setIsLowPerformance] = useState(false)

  useEffect(() => {
    // Check for low memory devices
    const memory = (navigator as any).deviceMemory
    const isLowMemory = memory !== undefined && memory <= 4

    // Check for slow CPU
    const hardwareConcurrency = navigator.hardwareConcurrency || 0
    const isSlowCPU = hardwareConcurrency <= 4

    // Check for battery saving mode if available
    const checkBatterySaving = async () => {
      try {
        if ("getBattery" in navigator) {
          const battery = await (navigator as any).getBattery()
          if (battery.charging === false && battery.level < 0.2) {
            setIsLowPerformance(true)
            return
          }
        }
      } catch (e) {
        // Battery API not available, continue with other checks
      }

      // Set low performance if either memory or CPU is constrained
      setIsLowPerformance(isLowMemory || isSlowCPU)
    }

    checkBatterySaving()

    // Also check for the Save-Data header
    const connection = (navigator as any).connection
    if (connection && connection.saveData) {
      setIsLowPerformance(true)
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      setIsLowPerformance(true)
    }
  }, [])

  return isLowPerformance
}
