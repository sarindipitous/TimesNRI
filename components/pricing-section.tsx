"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { WaitlistForm } from "./waitlist-form"
import { CarePlansComparison } from "./care-plans-comparison"
import { HealthTestTooltip } from "./health-test-tooltip"
import { Heart, Shield, Crown } from "lucide-react"
import Link from "next/link"

interface PricingProps {
  className?: string
}

const plans = [
  {
    id: "peace",
    name: "Peace",
    price: "$50",
    description: "Peace of mind, always within reach",
    icon: Heart,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-600",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    features: [
      "24×7 Emergency Helpline",
      "24×7 Doctor on Call",
      "Medication Management",
      "Emergency coordination with hospitals",
    ],
  },
  {
    id: "presence",
    name: "Presence",
    price: "$200",
    description: "Your caring presence, delivered daily",
    icon: Shield,
    color: "accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
    textColor: "text-accent",
    buttonColor: "bg-accent hover:bg-accent/90",
    features: [
      "Everything in Peace",
      "Care Companion Visits (2/month)",
      {
        text: "Annual Health Test (84 markers)",
        hasTooltip: true,
        tooltipPlan: "presence" as const,
      },
      "Home Medical Kit included",
    ],
  },
  {
    id: "honour",
    name: "Honour",
    price: "$500",
    description: "The dignity and care they gave you, returned in full",
    icon: Crown,
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-600",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    inviteOnly: true,
    features: [
      "Everything in Presence",
      "Care Companion Visits (4/month)",
      "At-home Doctor Visits (2/month)",
      {
        text: "Annual Health comprehensive Test (100 markers) + Microbiome Gut Test",
        hasTooltip: true,
        tooltipPlan: "honour" as const,
      },
    ],
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
        <Button variant="outline" onClick={() => setIsComparisonOpen(true)} className="mb-8">
          Compare All Care Plans
        </Button>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => {
          const IconComponent = plan.icon
          return (
            <Card
              key={plan.id}
              className={`relative ${plan.inviteOnly ? "ring-2 ring-purple-200 shadow-lg mt-3" : ""}`}
            >
              {plan.inviteOnly && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                    By Invitation Only
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <IconComponent className={`h-6 w-6 ${plan.textColor}`} />
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <div className={`text-4xl font-bold ${plan.textColor} mb-2`}>{plan.price}</div>
                <div className="text-sm text-gray-600 mb-3">per month</div>
                <CardDescription className={`text-sm ${plan.textColor} font-medium italic`}>
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-gray-700">{typeof feature === "string" ? feature : feature.text}</span>
                        {typeof feature === "object" && feature.hasTooltip && (
                          <HealthTestTooltip plan={feature.tooltipPlan} />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsComparisonOpen(true)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    See all features →
                  </Button>
                </div>
              </CardContent>

              <CardFooter>
                {plan.inviteOnly ? (
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
          )
        })}
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
