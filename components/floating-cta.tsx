"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Link from "next/link"

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isPulsing, setPulsing] = useState(false)
  const isMobile = useMobile()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsVisible(scrollPosition > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setPulsing(true)
        setTimeout(() => setPulsing(false), 1000)
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50, scale: prefersReducedMotion ? 1 : 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 50, scale: prefersReducedMotion ? 1 : 0.8 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
        >
          <motion.div animate={isPulsing ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.5 }}>
            <Link href="/waitlist">
              <Button
                className="bg-accent hover:bg-accent/90 text-white shadow-warm transition-all duration-300 h-14 px-6"
                size="lg"
              >
                Join the Waitlist
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
