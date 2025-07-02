"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { WaitlistForm } from "@/components/waitlist-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function WaitlistPageContent() {
  const searchParams = useSearchParams()
  const [referralParam, setReferralParam] = useState<string | null>(null)
  const [planParam, setPlanParam] = useState<string | null>(null)

  useEffect(() => {
    const ref = searchParams.get("ref")
    const plan = searchParams.get("plan")

    console.log("🎯 Waitlist page loaded with params:", { ref, plan, url: window.location.href })

    // Handle referral parameter
    if (ref && ref.trim()) {
      const cleanRef = ref.trim()
      console.log("✅ Waitlist page setting referral:", cleanRef)
      setReferralParam(cleanRef)
      // Store in localStorage for persistence
      localStorage.setItem("timesnri_referral", cleanRef)
    } else {
      // Check localStorage for stored referral
      const storedRef = localStorage.getItem("timesnri_referral")
      if (storedRef) {
        console.log("📦 Waitlist page using stored referral:", storedRef)
        setReferralParam(storedRef)
      }
    }

    // Handle plan parameter
    if (plan) {
      const planMap: Record<string, string> = {
        peace: "Peace: $50/month",
        presence: "Presence: $200/month",
        honour: "Honour: $500/month (By Invitation Only)",
        general: "",
      }
      const selectedPlan = planMap[plan] || ""
      console.log("📋 Setting plan:", selectedPlan)
      setPlanParam(selectedPlan)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary mb-4">Join Our Waitlist</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Be among the first to access our Senior Care & Wellness Membership when we launch in your city.
            </p>
            {referralParam && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg inline-block">
                <p className="text-sm text-green-700">
                  🎉 You were referred by: <span className="font-mono font-medium">{referralParam}</span>
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <WaitlistForm
              standalone={true}
              isDetailed={true}
              source="waitlist-page"
              preSelectedPlan={planParam || undefined}
            />
          </div>

          {/* Additional info */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              By joining our waitlist, you'll receive updates about our launch and exclusive early access to our
              services.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WaitlistPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-secondary to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading waitlist form...</p>
          </div>
        </div>
      }
    >
      <WaitlistPageContent />
    </Suspense>
  )
}
