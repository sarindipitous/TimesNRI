"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { HealthTestTooltip } from "@/components/health-test-tooltip"

interface Feature {
  name: string
  peace: string
  presence: string
  honour: string
  hasTooltip?: boolean
}

const features: Feature[] = [
  {
    name: "Monthly Subscription",
    peace: "₹2,999",
    presence: "₹4,999",
    honour: "₹7,999",
  },
  {
    name: "24/7 Emergency Support",
    peace: "✓",
    presence: "✓",
    honour: "✓",
  },
  {
    name: "Video Consultations",
    peace: "2 per month",
    presence: "4 per month",
    honour: "Unlimited",
  },
  {
    name: "Specialist Referrals",
    peace: "✓",
    presence: "✓",
    honour: "✓",
  },
  {
    name: "Health Records Management",
    peace: "✓",
    presence: "✓",
    honour: "✓",
  },
  {
    name: "Medication Reminders",
    peace: "✓",
    presence: "✓",
    honour: "✓",
  },
  {
    name: "Annual Health Test",
    peace: "82 parameters",
    presence: "84 markers",
    honour: "100 markers + Microbiome Gut Test",
    hasTooltip: true,
  },
  {
    name: "Health Coach Support",
    peace: "✗",
    presence: "✓",
    honour: "✓",
  },
  {
    name: "Nutrition Counseling",
    peace: "✗",
    presence: "Basic",
    honour: "Advanced",
  },
  {
    name: "Mental Health Support",
    peace: "✗",
    presence: "✓",
    honour: "✓",
  },
  {
    name: "Family Coverage",
    peace: "Self only",
    presence: "Up to 2 members",
    honour: "Up to 4 members",
  },
  {
    name: "Home Visits",
    peace: "✗",
    presence: "2 per year",
    honour: "4 per year",
  },
  {
    name: "Priority Booking",
    peace: "✗",
    presence: "✓",
    honour: "✓",
  },
  {
    name: "Chronic Disease Management",
    peace: "✗",
    presence: "✓",
    honour: "✓",
  },
  {
    name: "Preventive Care Alerts",
    peace: "✗",
    presence: "✓",
    honour: "✓",
  },
]

const plans = [
  {
    id: "peace",
    name: "Peace",
    price: "₹2,999",
    description: "Essential healthcare for individuals",
    popular: false,
    color: "bg-blue-50 border-blue-200",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "presence",
    name: "Presence",
    price: "₹4,999",
    description: "Comprehensive care for small families",
    popular: true,
    color: "bg-green-50 border-green-200",
    buttonColor: "bg-green-600 hover:bg-green-700",
  },
  {
    id: "honour",
    name: "Honour",
    price: "₹7,999",
    description: "Premium care for larger families",
    popular: false,
    color: "bg-purple-50 border-purple-200",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
  },
]

export function CarePlansComparison() {
  const [currentPlanIndex, setCurrentPlanIndex] = useState(1) // Start with Presence (popular)
  const currentPlan = plans[currentPlanIndex]

  const nextPlan = () => {
    setCurrentPlanIndex((prev) => (prev + 1) % plans.length)
  }

  const prevPlan = () => {
    setCurrentPlanIndex((prev) => (prev - 1 + plans.length) % plans.length)
  }

  const renderFeatureValue = (value: string, hasTooltip?: boolean, planId?: string) => {
    if (value === "✓") {
      return <Check className="h-5 w-5 text-green-600" />
    }
    if (value === "✗") {
      return <X className="h-5 w-5 text-red-500" />
    }

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{value}</span>
        {hasTooltip && planId !== "peace" && value !== "82 parameters" && (
          <HealthTestTooltip plan={planId || ""}>
            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </HealthTestTooltip>
        )}
      </div>
    )
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare All Care Plans</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose the perfect care plan for your family's needs. All plans include our core healthcare services with
            varying levels of support and benefits.
          </p>
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-0">
              {/* Header Row */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Features</h3>
              </div>
              {plans.map((plan) => (
                <div key={plan.id} className={`p-6 border-b border-gray-200 ${plan.color} relative`}>
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600">
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{plan.price}</div>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <Button className={`w-full ${plan.buttonColor} text-white`}>Choose {plan.name}</Button>
                  </div>
                </div>
              ))}

              {/* Feature Rows */}
              {features.map((feature, index) => (
                <div key={index} className="contents">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <span className="font-medium text-gray-900">{feature.name}</span>
                  </div>
                  <div className="p-4 border-b border-gray-200 text-center">
                    {renderFeatureValue(
                      feature.peace,
                      feature.hasTooltip && feature.peace !== "82 parameters",
                      "peace",
                    )}
                  </div>
                  <div className="p-4 border-b border-gray-200 text-center bg-green-50">
                    {renderFeatureValue(feature.presence, feature.hasTooltip, "presence")}
                  </div>
                  <div className="p-4 border-b border-gray-200 text-center">
                    {renderFeatureValue(feature.honour, feature.hasTooltip, "honour")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Comparison - Side by Side */}
        <div className="lg:hidden mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={`${plan.color} relative`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600 z-10">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">{plan.price}</div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                  <Button className={`w-full ${plan.buttonColor} text-white mt-4`}>Choose {plan.name}</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                    >
                      <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                      <div className="text-right">
                        {renderFeatureValue(
                          feature[plan.id as keyof typeof feature] as string,
                          feature.hasTooltip && feature[plan.id as keyof typeof feature] !== "82 parameters",
                          plan.id,
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mobile Single Plan View */}
        <div className="lg:hidden">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Plan View</h3>
            <p className="text-sm text-gray-600">Swipe or use arrows to compare plans</p>
          </div>

          <div className="relative">
            <Card className={`${currentPlan.color} relative`}>
              {currentPlan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600 z-10">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{currentPlan.name}</CardTitle>
                <div className="text-3xl font-bold">{currentPlan.price}</div>
                <p className="text-gray-600">{currentPlan.description}</p>
                <Button className={`w-full ${currentPlan.buttonColor} text-white mt-4`}>
                  Choose {currentPlan.name}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0"
                    >
                      <span className="font-medium text-gray-900">{feature.name}</span>
                      <div className="text-right">
                        {renderFeatureValue(
                          feature[currentPlan.id as keyof typeof feature] as string,
                          feature.hasTooltip &&
                            !(
                              currentPlan.id === "peace" &&
                              feature[currentPlan.id as keyof typeof feature] === "82 parameters"
                            ),
                          currentPlan.id,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Arrows */}
            <button
              onClick={prevPlan}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Previous plan"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            <button
              onClick={nextPlan}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Next plan"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Plan Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {plans.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPlanIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentPlanIndex ? "bg-blue-600" : "bg-gray-300"
                }`}
                aria-label={`Go to plan ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
