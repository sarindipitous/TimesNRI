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
    tagline: "Safety and everyday assurance.",
    description:
      "The essential layer of protection for NRIs who want to ensure their parent has immediate access to trusted help.",
    features: {
      emergency: [
        "24×7 emergency helpline with SOS button",
        "Verified doctors, hospitals, and ambulance partners",
        "Unlimited complimentary ambulance (BLS)",
        "Coordination for hospital admissions",
      ],
      healthWellness: [],
      engagement: [],
      convenience: ["Concierge support for bills, repairs, and utilities"],
    },
    bestFor: "NRIs who want a trusted safety net with immediate emergency support.",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    textColor: "text-blue-600",
  },
  {
    id: "presence",
    name: "Presence",
    price: "$150",
    emoji: "🫱🏽‍🫲🏼",
    tagline: "Companionship and continuous care.",
    description: "Everything in Peace, plus regular companionship, health check-ins, and daily wellness support.",
    features: {
      emergency: [],
      healthWellness: [
        "Annual and quarterly health check-ins with a geriatrician",
        "Unlimited 24×7 teleconsults with doctors",
        "Daily wellness check-in calls",
      ],
      engagement: ["Dedicated care companion, two visits per month", "Celebration of birthdays and festivals"],
      convenience: [],
    },
    bestFor: "NRIs who want human connection, regular health monitoring, and companionship they can trust.",
    buttonColor: "bg-teal-600 hover:bg-teal-700",
    textColor: "text-teal-600",
  },
  {
    id: "honour",
    name: "Honour",
    price: "$500",
    emoji: "👑",
    tagline: "World-class, dignified care.",
    description: "Everything in Presence, plus concierge-level care with advanced health screenings and full support.",
    features: {
      emergency: ["On-ground doctor during emergencies", "Cashless hospitalisation handled end-to-end"],
      healthWellness: [
        "Weekly nurse visits and monthly doctor visits",
        "Genetic and biomarker health screenings",
        "Concierge doctor available 24×7",
      ],
      engagement: [],
      convenience: ["Legal, financial, and visa concierge"],
    },
    bestFor: "NRIs who want to deliver complete protection, presence, and dignity without compromise.",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    textColor: "text-purple-600",
    inviteOnly: true,
  },
]

const pillarIcons = {
  emergency: "🚨",
  healthWellness: "🏥",
  engagement: "🤝",
  convenience: "⭐",
}

const pillarNames = {
  emergency: "Emergency",
  healthWellness: "Health & Wellness",
  engagement: "Engagement",
  convenience: "Convenience",
}

export function PricingSection({ className }: PricingProps) {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("")
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)

  const renderFeatures = (features: any, planId: string) => {
    const pillars = ["emergency", "healthWellness", "engagement", "convenience"] as const

    return pillars.map((pillar) => {
      const pillarFeatures = features[pillar]
      if (!pillarFeatures || pillarFeatures.length === 0) return null

      return (
        <div key={pillar} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{pillarIcons[pillar]}</span>
            <h5 className="font-semibold text-gray-800 text-xs">{pillarNames[pillar]}</h5>
          </div>
          <ul className="space-y-1 ml-6">
            {pillarFeatures.map((feature: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1 text-xs">•</span>
                <span className="text-gray-700 text-xs leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    })
  }

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
                {renderFeatures(plan.features, plan.id)}
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

      {/* Add-Ons Section */}
      <div className="mt-16">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-primary mb-3">Specialist Care Modules</h3>
          <p className="text-gray-600">Each add-on can be added to any plan at any time.</p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-2 border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">🧠</span>
                Dementia Care Add-On
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Cognitive assessments via app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Monthly psychologist sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Counselling for caregivers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Physiotherapy and diet guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Fall-detection and safety wearables</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">🍎</span>
                Diabetes Management Add-On
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Daily monitoring calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Quarterly HbA1c tests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Monthly dietician sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Teleconsultations with diabetologist every 3 months</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Annual eye check-up</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">💓</span>
                Heart Health Add-On
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Daily monitoring calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Quarterly cardiologist visits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Annual cardiac check-up (ECG, 2D Echo)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Monthly dietician sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Yoga and lifestyle sessions</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-gray-500 mb-4">
          All plans include our core promise: Your parents are never alone in an emergency.
        </p>
        <Link href="/compare" className="inline-block">
          <Button variant="outline" size="lg">
            Compare All Care Plans
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
              presence: "Presence: $150/month",
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
