"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface MobileWaitlistButtonProps {
  referralParam?: string | null
}

export function MobileWaitlistButton({ referralParam }: MobileWaitlistButtonProps) {
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

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <Link href={getWaitlistUrl()}>
        <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-white shadow-lg" onClick={handleClick}>
          Join Our Waitlist
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
  )
}
