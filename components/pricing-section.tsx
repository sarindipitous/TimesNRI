"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Star, Crown } from "lucide-react"
import Link from "next/link"

interface PricingSectionProps {
  referralParam?: string | null
}

export function PricingSection({ referralParam }: PricingSectionProps) {
  const buildWaitlistUrl = (plan: string) => {
    const baseUrl = "/waitlist"
    const params = new URLSearchParams()

    params.set("plan", plan)
    if (referralParam) {
      params.set("ref", referralParam)
    }

    return `${baseUrl}?${params.toString()}`
  }

  const handlePlanClick = (planName: string) => {
    console.log(`💳 ${planName} plan clicked with referral:`, referralParam)
  }

  const plans = [
    {
      name: "Peace",
      price: "$50",
      period: "month",
      description: "Essential care and peace of mind",
      features: [
        "24/7 emergency helpline",
        "Monthly wellness check-ins",
        "Medication reminders",
        "Family updates via WhatsApp",
        "Basic health monitoring",
      ],
      cta: "Start with Peace",
      popular: false,
      planKey: "peace",
    },
    {
      name: "Presence",
      price: "$200",
      period: "month",
      description: "Comprehensive care with regular visits",
      features: [
        "Everything in Peace",
        "Weekly in-person visits",
        "Doctor appointment coordination",
        "Grocery & medicine delivery",
        "Social engagement activities",
        "Health report summaries",
      ],
      cta: "Choose Presence",
      popular: true,
      planKey: "presence",
    },
    {
      name: "Honour",
      price: "$500",
      period: "month",
      description: "Premium care with dedicated support",
      features: [
        "Everything in Presence",
        "Dedicated care coordinator",
        "Daily check-ins available",
        "Priority medical appointments",
        "Family liaison services",
        "Customized care plans",
      ],
      cta: "Request Honour",
      popular: false,
      planKey: "honour",
      invitation: true,
    },
  ]

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary">Choose Your Care Plan</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Each plan is designed to give you peace of mind while ensuring your parents receive the care they deserve.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card
            key={plan.name}
            className={`relative ${
              plan.popular ? "border-accent shadow-lg scale-105" : "border-gray-200"
            } ${plan.invitation ? "border-yellow-400" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-accent text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Most Popular
                </div>
              </div>
            )}

            {plan.invitation && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  By Invitation
                </div>
              </div>
            )}

            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-primary">{plan.name}</CardTitle>
              <CardDescription className="text-gray-600">{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">{plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={buildWaitlistUrl(plan.planKey)}>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-accent hover:bg-accent/90"
                      : plan.invitation
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-primary hover:bg-primary/90"
                  } text-white`}
                  size="lg"
                  onClick={() => handlePlanClick(plan.name)}
                >
                  {plan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-4">
        <p className="text-gray-600">
          All plans include our core promise: Your parents will never be alone in an emergency.
        </p>
        <Link href={buildWaitlistUrl("general")}>
          <Button variant="outline" size="lg" onClick={() => handlePlanClick("General")}>
            Not sure? Join our waitlist to learn more
          </Button>
        </Link>
      </div>
    </div>
  )
}
