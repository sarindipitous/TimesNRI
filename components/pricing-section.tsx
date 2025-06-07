"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Check, Star, Heart, Shield, X, Info } from "lucide-react"
import { useState } from "react"

interface PlanDetails {
  name: string
  price: string
  originalPrice: string
  savings: string
  description: string
  icon: React.ReactNode
  color: string
  buttonColor: string
  features: {
    category: string
    description?: string
    items: string[]
  }[]
  perfectFor: string
}

const planDetails: Record<string, PlanDetails> = {
  essential: {
    name: "Essential Wellbeing Plan",
    price: "₹2,500",
    originalPrice: "₹5,000",
    savings: "Save 50%",
    description: "For independent parents needing basic health support",
    icon: <Heart className="h-6 w-6 text-blue-600" />,
    color: "blue",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    features: [
      {
        category: "Health & Wellness",
        items: [
          "24/7 emergency support",
          "Medication reminders",
          "Organised, dose-wise packaging & delivery of medicines",
        ],
      },
    ],
    perfectFor: "Families seeking essential health coverage and regular peace of mind for ageing parents.",
  },
  comfort: {
    name: "Comfort & Care Plan",
    price: "₹16,000",
    originalPrice: "₹25,000",
    savings: "Save 36%",
    description: "For parents who need regular health checks and lifestyle assistance",
    icon: <Shield className="h-6 w-6 text-accent" />,
    color: "accent",
    buttonColor: "bg-accent hover:bg-accent/90",
    features: [
      {
        category: "Health & Wellness",
        items: [
          "Monthly check-in visits with vitals monitoring",
          "Maintaining electronic medical records",
          "Access to on-call geriatric physicians",
          "Appointment scheduling (doctor + diagnostics)",
        ],
      },
      {
        category: "Lifestyle Enablement",
        description: "Make everyday life easier and safer for your parents:",
        items: [
          "Bill payments",
          "Elder-proofing home consultancy",
          "Scheduling regular home repairs & maintenance",
          "Access to exclusive content on app: Play Tambola, Exclusive Yoga, Spiritual & Devotional content",
        ],
      },
    ],
    perfectFor: "Families wanting an ongoing blend of proactive health management and lifestyle support.",
  },
  total: {
    name: "Total Support Plan",
    price: "₹30,000",
    originalPrice: "₹45,000",
    savings: "Save 35%",
    description: "For parents needing full care, companionship, and lifestyle enablement",
    icon: <Star className="h-6 w-6 text-purple-600" />,
    color: "purple",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    features: [
      {
        category: "Health & Wellness",
        items: [
          "24/7 emergency support accompanied by our trained staff",
          "Weekly check-in visits with vitals monitoring",
          "Doctor visits accompanied by our trained staff",
        ],
      },
      {
        category: "Lifestyle Enablement",
        description: "Enable greater freedom and confidence for your parents:",
        items: ["Assisted visits (hospitals, banks, shopping)"],
      },
    ],
    perfectFor:
      "Families seeking comprehensive, compassionate, full-service care and companionship for elderly parents.",
  },
}

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const scrollToJoin = () => {
    const headerElement = document.querySelector("header")
    if (headerElement) {
      const event = new CustomEvent("openWaitlistDialog")
      headerElement.dispatchEvent(event)
    }
  }

  const openPlanDetails = (planKey: string) => {
    setSelectedPlan(planKey)
  }

  const closePlanDetails = () => {
    setSelectedPlan(null)
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
        <div className="inline-flex items-center justify-center rounded-full bg-primary-light px-4 py-2 text-sm font-medium text-primary mb-4">
          <Star className="h-4 w-4 mr-2" />
          Care Packages
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">Choose Your Care Level</h2>
        <p className="max-w-2xl text-gray-600 text-lg px-4">
          Simple, transparent pricing that grows with your family's needs
        </p>

        {/* Limited time offer banner */}
        <div className="bg-gradient-to-r from-accent/10 to-orange-100 rounded-2xl p-4 max-w-2xl mx-auto border border-accent/20">
          <p className="text-accent font-semibold text-lg">
            🎉 <span className="font-bold">Launch Special:</span> Save up to 50% for early adopters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 md:px-6">
        {/* Essential Plan */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Essential Care</h3>
                <p className="text-sm text-gray-500">Perfect for independent parents</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">₹2,500</span>
                <span className="text-lg text-gray-500">/month</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm line-through text-gray-400">₹5,000</span>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Save 50%
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">24/7 emergency support</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Medication management</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Medicine delivery</span>
              </div>
            </div>

            <button
              onClick={() => openPlanDetails("essential")}
              className="w-full mb-4 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2 py-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Info className="h-4 w-4" />
              View Full Details
            </button>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-semibold text-lg"
              onClick={scrollToJoin}
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Premium Plan - Most Popular */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-accent overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 relative lg:scale-105">
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-accent to-orange-500 text-white text-center py-3 font-semibold">
            ⭐ Most Popular Choice
          </div>

          <div className="p-8 pt-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Comfort & Care</h3>
                <p className="text-sm text-gray-500">Complete health & lifestyle support</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">₹16,000</span>
                <span className="text-lg text-gray-500">/month</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm line-through text-gray-400">₹25,000</span>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Save 36%
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-600 mb-2">Everything in Essential, plus:</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Monthly health check visits</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Doctor appointment scheduling</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Bill payments & home maintenance</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Exclusive wellness app content</span>
              </div>
            </div>

            <button
              onClick={() => openPlanDetails("comfort")}
              className="w-full mb-4 text-accent hover:text-accent/80 font-medium text-sm flex items-center justify-center gap-2 py-2 border border-accent/30 rounded-xl hover:bg-accent/5 transition-colors"
            >
              <Info className="h-4 w-4" />
              View Full Details
            </button>

            <Button
              className="w-full bg-accent hover:bg-accent/90 text-white py-6 rounded-2xl font-semibold text-lg"
              onClick={scrollToJoin}
            >
              Choose This Plan
            </Button>
          </div>
        </div>

        {/* Premium Plan */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-3 rounded-2xl">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Total Support</h3>
                <p className="text-sm text-gray-500">Comprehensive care & companionship</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">₹30,000</span>
                <span className="text-lg text-gray-500">/month</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm line-through text-gray-400">₹45,000</span>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Save 35%
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-600 mb-2">Everything in Comfort & Care, plus:</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Weekly health monitoring</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Accompanied doctor visits</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Assisted outings & errands</span>
              </div>
            </div>

            <button
              onClick={() => openPlanDetails("total")}
              className="w-full mb-4 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center justify-center gap-2 py-2 border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <Info className="h-4 w-4" />
              View Full Details
            </button>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-2xl font-semibold text-lg"
              onClick={scrollToJoin}
            >
              Get Premium Care
            </Button>
          </div>
        </div>
      </div>

      {/* Value-Added Services - Redesigned as cards */}
      <div className="mt-16 max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Add-On Services</h3>
          <p className="text-gray-600">Available with any plan for additional support</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "👩‍⚕️", title: "Home Nursing", desc: "12 or 24-hour care" },
            { icon: "🏃‍♂️", title: "Physiotherapy", desc: "In-home sessions" },
            { icon: "⚖️", title: "Legal Services", desc: "Wills & documentation" },
            {
              icon: "✈️",
              title: "Travel Support",
              desc: "Accompanied trips, booking packages, visa & health insurance",
            },
            { icon: "📱", title: "Smart Monitoring", desc: "Health devices & alerts" },
            { icon: "🏠", title: "Home Attendants", desc: "Daily living assistance" },
          ].map((service, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-3xl mb-3">{service.icon}</div>
              <h4 className="font-semibold text-gray-900 mb-2">{service.title}</h4>
              <p className="text-sm text-gray-600">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-12 bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
        <h4 className="font-semibold text-gray-900 mb-2">🔒 Lock in Launch Pricing</h4>
        <p className="text-gray-600">Join our waitlist today and secure these special rates for 12 months</p>
      </div>

      {/* Modal for Plan Details */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    selectedPlan === "essential"
                      ? "bg-blue-100"
                      : selectedPlan === "comfort"
                        ? "bg-accent/10"
                        : "bg-purple-100"
                  }`}
                >
                  {planDetails[selectedPlan].icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{planDetails[selectedPlan].name}</h3>
                  <p className="text-sm text-gray-500">{planDetails[selectedPlan].description}</p>
                </div>
              </div>
              <button onClick={closePlanDetails} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{planDetails[selectedPlan].price}</span>
                  <span className="text-lg text-gray-500">/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm line-through text-gray-400">{planDetails[selectedPlan].originalPrice}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                    {planDetails[selectedPlan].savings}
                  </span>
                </div>
              </div>

              {selectedPlan === "comfort" && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-medium text-gray-600">Includes everything in Essential Wellbeing, plus:</p>
                </div>
              )}

              {selectedPlan === "total" && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-medium text-gray-600">Includes everything in Comfort & Care, plus:</p>
                </div>
              )}

              <div className="space-y-6">
                {planDetails[selectedPlan].features.map((category, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
                    {category.description && <p className="text-sm text-gray-600 mb-3">{category.description}</p>}
                    <ul className="space-y-3">
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Perfect for:</span> {planDetails[selectedPlan].perfectFor}
                </p>
              </div>

              <div className="mt-8 flex gap-4">
                <Button
                  className={`flex-1 ${planDetails[selectedPlan].buttonColor} text-white py-4 rounded-2xl font-semibold`}
                  onClick={() => {
                    closePlanDetails()
                    scrollToJoin()
                  }}
                >
                  Choose This Plan
                </Button>
                <button
                  onClick={closePlanDetails}
                  className="px-6 py-4 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
