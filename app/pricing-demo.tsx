"use client"

import { PricingSection } from "@/components/pricing-section"

export default function PricingDemo() {
  return (
    <div className="min-h-screen bg-secondary">
      <PricingSection />
      <div id="join" className="py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Join Waitlist Section</h2>
        <p className="text-gray-600">This is a placeholder for the join waitlist section</p>
      </div>
    </div>
  )
}
