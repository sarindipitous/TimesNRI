"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { WaitlistForm } from "@/components/waitlist-form"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function WaitlistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  useEffect(() => {
    const plan = searchParams.get("plan")
    if (plan) {
      setSelectedPlan(plan)
    }
  }, [searchParams])

  const handleClose = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:text-accent mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            {/* Page header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-4">Join Our Waitlist</h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                Be among the first to access our Elderly Care Concierge service when we launch in your city.
              </p>
              {selectedPlan && (
                <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-accent font-medium">
                    You've selected the <span className="font-bold capitalize">{selectedPlan}</span> plan
                  </p>
                </div>
              )}
            </div>

            {/* Waitlist form card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <WaitlistForm
                buttonText="Join the Waitlist"
                source="waitlist-page"
                includeNameField={true}
                isDetailed={true}
                onClose={handleClose}
                isOpen={true}
                onOpenChange={(open) => {
                  if (!open) {
                    handleClose()
                  }
                }}
              />
            </div>

            {/* Additional info */}
            <div className="mt-8 text-center">
              <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Join the Waitlist</h3>
                  <p>Share your details and care needs with us</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-accent font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">We'll Reach Out</h3>
                  <p>Our team will contact you when we launch in your area</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Start Your Care</h3>
                  <p>Begin your personalized elderly care journey</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
