"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function MobileWaitlistButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href="/waitlist">
        <Button
          className="bg-accent hover:bg-accent/90 text-white shadow-warm transition-all duration-300 h-14 px-6 rounded-full"
          size="lg"
        >
          Join the Waitlist
        </Button>
      </Link>
    </div>
  )
}
