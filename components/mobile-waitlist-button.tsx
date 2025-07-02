"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface MobileWaitlistButtonProps {
  referralParam?: string | null
}

export function MobileWaitlistButton({ referralParam }: MobileWaitlistButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when user scrolls down 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const getWaitlistUrl = () => {
    const baseUrl = "/waitlist"
    if (referralParam) {
      return `${baseUrl}?ref=${encodeURIComponent(referralParam)}`
    }
    return baseUrl
  }

  const handleClick = () => {
    console.log("📱 Mobile CTA clicked with referral:", referralParam)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <Link href={getWaitlistUrl()}>
        <Button
          size="lg"
          className="w-full bg-accent hover:bg-accent/90 text-white shadow-lg py-4 text-base font-semibold"
          onClick={handleClick}
        >
          Join Our Waitlist
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
  )
}
