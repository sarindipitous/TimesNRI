"use client"

import { CarePlansComparison } from "@/components/care-plans-comparison"
import { useRouter } from "next/navigation"

export default function ComparePage() {
  const router = useRouter()

  const handleClose = () => {
    router.push("/")
  }

  const handleSelectPlan = (plan: string) => {
    // Redirect to home page and trigger waitlist dialog
    router.push("/?plan=" + plan)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CarePlansComparison onClose={handleClose} onSelectPlan={handleSelectPlan} />
    </div>
  )
}
