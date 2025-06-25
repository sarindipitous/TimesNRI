"use client"

import { CarePlansComparison } from "@/components/care-plans-comparison"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ComparePage() {
  const router = useRouter()

  const handleClose = () => {
    router.push("/")
  }

  const handleSelectPlan = (plan: string) => {
    // Redirect to home page and trigger waitlist dialog
    router.push("/?plan=" + plan)
  }

  // Ensure page starts at the top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <CarePlansComparison onClose={handleClose} onSelectPlan={handleSelectPlan} />
    </div>
  )
}
