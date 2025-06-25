"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { WaitlistForm } from "./waitlist-form"
import { CarePlansComparison } from "./care-plans-comparison"
import Link from "next/link"

interface PricingProps {
  className?: string
}

const plans = [
  {
    id: "peace",
    name: "Peace",
    price: "$50",
    emoji: "💙",
    tagline: "When you want to be ready when it matters most.",
    description:
      "This is the essential layer of protection — built for NRIs who want to ensure their parent has immediate access to trusted medical help. No call centres. No delays. Just medically trained professionals, available 24×7.",
    features: [
      "24×7 Emergency Helpline — always answered by a medical professional",
      "On-Call Doctors for immediate guidance",
      "Medication Reminders & Refill Tracking",
      "Emergency Response & Hospital Coordination",
    ],
    bestFor: "NRIs who want a trusted medical safety net — help that answers when it matters most.",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    textColor: "text-blue-600",
  },
  {
    id: "presence",
    name: "Presence",
    price: "$200",
    emoji: "🫱🏽‍🫲🏼",
    tagline: "Beyond safety — this is presence, trust, and continuity.",
    description:
      "Every two weeks, a trained and verified Care Companion visits your parent in person. They don't just check vitals — they build trust, listen, observe, and connect. Hospital support included.",
    features: [
      "2 In-Person Care Companion Visits per month",
      "Annual Health Screening (84 biomarkers)",
      "At-Home Medical Kit & Vitals Monitoring",
      "Hospital Support: Nurse placed at hospital for up to 3 days",
    ],
    bestFor: "NRIs who want human connection, early detection, and hospital coordination they can trust.",
    buttonColor: "bg-teal-600 hover:bg-teal-700",
    textColor: "text-teal-600",
  },
  {
    id: "honour",
    name: "Honour",
    price: "$500",
    emoji: "👑",
    tagline: "The most complete care you can offer from anywhere in the world.",
    description:
      "This is not just an upgrade. It's a promise: to uphold your parent's dignity with proactive, concierge-level care. More visits. At-home doctors. Deep health insights. Full hospital advocacy.",
    features: [
      "4 Care Companion Visits per month",
      "2 At-Home Doctor Visits per month",
      "Advanced Diagnostics (100+ biomarkers + Gut Microbiome Panel)",
      "Dedicated Family Care Manager",
      "Full Hospital Advocacy: Nurse + doctor available throughout hospital stay",
    ],
    bestFor: "NRIs who want to deliver complete protection, presence, and dignity — without compromise.",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    textColor: "text-purple-600",
    inviteOnly: true,
  },
]

export function PricingSection({ className }: PricingProps) {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("")
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)

  return (
    <section id="pricing" className={cn("container py-24", className)}>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl mb-4">
          Senior Wellness & Care Membership
        </h2>
        <p className="text-lg text-gray-600 mb-8">Choose the right level of care for your loved ones</p>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative flex flex-col h-full ${plan.inviteOnly ? "ring-2 ring-purple-200 shadow-lg" : ""}`}
          >
            {plan.inviteOnly && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                  By Invitation Only
                </span>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-2xl">{plan.emoji}</span>
                <CardTitle className={`text-2xl ${plan.textColor}`}>{plan.name}</CardTitle>
              </div>
              <div className={`text-4xl font-bold ${plan.textColor} mb-2`}>{plan.price}</div>
              <div className="text-sm text-gray-600 mb-3">per month</div>
              <CardDescription className="text-sm font-medium text-gray-800 mb-3">{plan.tagline}</CardDescription>
              <p className="text-sm text-gray-600 leading-relaxed">{plan.description}</p>
            </CardHeader>

            <CardContent className="flex-1">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  {plan.id === "peace"
                    ? "What's included:"
                    : plan.id === "presence"
                      ? "Includes everything in Peace, plus:"
                      : "Includes everything in Presence, plus:"}
                </h4>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1 text-xs">•</span>
                      <span className="text-gray-700 text-xs leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Best for:</strong> {plan.bestFor}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100">
                <Link href="/compare">
                  <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700 w-full">
                    See all features →
                  </Button>
                </Link>
              </div>
            </CardContent>

            <CardFooter>
              {plan.inviteOnly ? (
                <Button
                  className={`w-full ${plan.buttonColor} text-white`}
                  onClick={() => {
                    setSelectedPlan("Honour: $500/month (By Invitation Only)")
                    setIsWaitlistOpen(true)
                  }}
                >
                  Request Invitation
                </Button>
              ) : (
                <Button
                  className={`w-full ${plan.buttonColor} text-white`}
                  onClick={() => {
                    setSelectedPlan(`${plan.name}: ${plan.price}/month`)
                    setIsWaitlistOpen(true)
                  }}
                >
                  Choose {plan.name}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-gray-500 mb-4">
          All plans include our core promise: Your parents are never alone in an emergency.
        </p>
        <Link href="/compare" className="inline-block">
          <Button variant="outline" size="lg">
            Compare All Care Plans in Detail
          </Button>
        </Link>
      </div>

      <WaitlistForm
        isOpen={isWaitlistOpen}
        onOpenChange={setIsWaitlistOpen}
        source="pricing-section"
        isDetailed={true}
        preSelectedPlan={selectedPlan}
      />

      {isComparisonOpen && (
        <CarePlansComparison
          onClose={() => setIsComparisonOpen(false)}
          onSelectPlan={(plan) => {
            setIsComparisonOpen(false)
            const planMap: Record<string, string> = {
              peace: "Peace: $50/month",
              presence: "Presence: $200/month",
              honour: "Honour: $500/month (By Invitation Only)",
            }
            setSelectedPlan(planMap[plan] || "")
            setIsWaitlistOpen(true)
          }}
        />
      )}
    </section>
  )
}
