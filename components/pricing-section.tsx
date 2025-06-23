"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Check, Star, Heart, Shield, Crown, X, Info, ArrowRight, Zap } from "lucide-react"
import { useState } from "react"
import { CarePlansComparison } from "./care-plans-comparison"
import Link from "next/link"

interface PlanDetails {
  name: string
  price: string
  originalPrice: string
  savings: string
  description: string
  emotion: string
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
  peace: {
    name: "Peace",
    price: "$50",
    originalPrice: "$100",
    savings: "Save 50%",
    description: "For when you need to know someone's always there",
    emotion: "Peace of mind, always within reach",
    icon: <Heart className="h-6 w-6 text-blue-600" />,
    color: "blue",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    features: [
      {
        category: "Emergency",
        items: [
          "24x7 Emergency Helpline",
          "24x7 Doctor on Call",
          "1 Complimentary Ambulance per year",
          "Emergency coordination with hospitals",
          "Ambulance tracking",
          "Hospital and healthcare provider mapping during onboarding",
        ],
      },
      {
        category: "Health & Wellness",
        items: ["Medication Management - Delivery + Reminders"],
      },
      {
        category: "Engagement",
        items: [
          "Access to Wellness and spiritual Content",
          "Limited access to Live Online Events (Yoga, Tambola, Antakshari)",
        ],
      },
      {
        category: "Convenience",
        items: ["Limited concierge (doctor appointments and medicine delivery)"],
      },
    ],
    perfectFor: "Families who want essential safety coverage and the comfort of knowing help is always available.",
  },
  presence: {
    name: "Presence",
    price: "$200",
    originalPrice: "$400",
    savings: "Save 50%",
    description: "For when you want to be felt - even if you're far",
    emotion: "Your caring presence, delivered daily",
    icon: <Shield className="h-6 w-6 text-accent" />,
    color: "accent",
    buttonColor: "bg-accent hover:bg-accent/90",
    features: [
      {
        category: "Emergency",
        items: [
          "Everything in Peace, plus:",
          "6 Complimentary Ambulances per year",
          "On-Ground Nurse during hospitalization (up to 3 days)",
          "Medical handover of health records and advocacy",
        ],
      },
      {
        category: "Health & Wellness",
        items: [
          "Creating and maintaining updated health profile",
          "Annual Health Test (72 markers)",
          "Quarterly Diabetes Panel (if diabetic)",
          "Home Medical Kit (BP, HR, Glucose, SpO2, Temperature monitors)",
          "Home Care Kit (first aid + emergency medication)",
          "6 Physiotherapy sessions at home per year",
          "Monthly Diet Plans by Nutritionist",
          "Home Safety Audit during onboarding",
        ],
      },
      {
        category: "Engagement",
        items: [
          "2 Care Companion Visits per month (3 hours each)",
          "Vitals monitoring during companion visits",
          "Trusted companionship for doctor visits, errands, walks",
          "Full access to Live Online Events",
          "Peer Community Access",
          "Volunteering Platform access",
          "Storytelling, Book Clubs, Cognitive Groups",
          "Gentle gamification for wellness motivation",
        ],
      },
      {
        category: "Convenience",
        items: ["Full Concierge service", "Access to Airport Lounges", "2 Assisted airport check-ins per year"],
      },
    ],
    perfectFor: "Families wanting comprehensive health management with regular companionship and engagement.",
  },
  honour: {
    name: "Honour",
    price: "$500",
    originalPrice: "$1000",
    savings: "Save 50%",
    description: "For when you believe that only the very best will do for them",
    emotion: "The dignity and care they gave you, returned in full",
    icon: <Crown className="h-6 w-6 text-purple-600" />,
    color: "purple",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    features: [
      {
        category: "Emergency",
        items: [
          "Everything in Presence, plus:",
          "Unlimited Complimentary Ambulances",
          "On-Ground Doctor availability for full hospitalization duration",
          "On-Ground Nurse for full hospitalization duration",
          "Partner Hospital Benefits - priority access, insurance management, credit line",
        ],
      },
      {
        category: "Health & Wellness",
        items: [
          "Comprehensive Annual Health Test + Microbiome analysis",
          "Ultrahuman Ring (fall detection + vitals tracking)",
          "2 At-home Doctor Visits per month",
          "12 Physiotherapy sessions at home per year",
        ],
      },
      {
        category: "Engagement",
        items: ["4 Care Companion Visits per month (3 hours each)", "All Presence engagement features included"],
      },
      {
        category: "Convenience",
        items: [
          "Full + Priority Concierge service",
          "Travel Booking, Visa, Biometrics at Home (included)",
          "Unlimited Assisted airport check-ins",
        ],
      },
    ],
    perfectFor:
      "Families who want their parents to age with the same dignity, protection and comfort they once gave us.",
  },
}

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  const openPlanDetails = (planKey: string) => {
    setSelectedPlan(planKey)
  }

  const closePlanDetails = () => {
    setSelectedPlan(null)
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
        <div className="inline-flex items-center justify-center rounded-full bg-primary-light px-4 py-2 text-sm font-medium text-primary mb-4">
          <Star className="h-4 w-4 mr-2" />
          Care Plans
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
          Three membership choices, one intention
        </h2>
        <p className="max-w-3xl text-gray-600 text-lg px-4 leading-relaxed">
          This isn't about guilt. It's about love.
          <br />
          And love, when you can't be there, looks like this.
        </p>

        <div className="bg-gradient-to-r from-accent/10 to-orange-100 rounded-2xl p-6 max-w-3xl mx-auto border border-accent/20">
          <p className="text-accent font-semibold text-lg">
            <span className="font-bold">Launch Special:</span> Because love shouldn't wait - 50% off for early members
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 md:px-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Peace</h3>
                <p className="text-sm text-gray-600 mt-1">For when you need to know someone's always there</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">$50</span>
                <span className="text-lg text-gray-500">/month</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm line-through text-gray-400">$100</span>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Save 50%
                </span>
              </div>
              <p className="text-sm text-blue-600 font-medium italic">Peace of mind, always within reach</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">24/7 Emergency Helpline & Doctor on Call</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Emergency ambulance & hospital coordination</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Medication management & delivery</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Wellness content & spiritual support</span>
              </div>
            </div>

            <button
              onClick={() => openPlanDetails("peace")}
              className="w-full mb-4 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2 py-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Info className="h-4 w-4" />
              View Full Details
            </button>

            <Link href="/waitlist?plan=peace">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-semibold text-lg">
                Choose Peace
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border-2 border-accent overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Presence</h3>
                <p className="text-sm text-gray-600 mt-1">For when you want to be felt - even if you're far</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">$200</span>
                <span className="text-lg text-gray-500">/month</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm line-through text-gray-400">$400</span>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Save 50%
                </span>
              </div>
              <p className="text-sm text-accent font-medium italic">Your caring presence, delivered daily</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-600 mb-2">Everything in Peace, plus:</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Care Companion visits (2/month)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Complete health monitoring & tests</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Community access & engagement programs</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Full concierge services</span>
              </div>
            </div>

            <button
              onClick={() => openPlanDetails("presence")}
              className="w-full mb-4 text-accent hover:text-accent/80 font-medium text-sm flex items-center justify-center gap-2 py-2 border border-accent/30 rounded-xl hover:bg-accent/5 transition-colors"
            >
              <Info className="h-4 w-4" />
              View Full Details
            </button>

            <Link href="/waitlist?plan=presence">
              <Button className="w-full bg-accent hover:bg-accent/90 text-white py-6 rounded-2xl font-semibold text-lg">
                Choose Presence
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-3 rounded-2xl">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Honour</h3>
                <p className="text-sm text-gray-600 mt-1">
                  For when you believe that only the very best will do for them
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">$500</span>
                <span className="text-lg text-gray-500">/month</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm line-through text-gray-400">$1000</span>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Save 50%
                </span>
              </div>
              <p className="text-sm text-purple-600 font-medium italic">
                The dignity and care they gave you, returned in full
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-600 mb-2">Everything in Presence, plus:</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Unlimited emergency support</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Priority hospital access & bedside doctors</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Advanced health monitoring (Ultrahuman Ring)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Premium travel & concierge services</span>
              </div>
            </div>

            <button
              onClick={() => openPlanDetails("honour")}
              className="w-full mb-4 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center justify-center gap-2 py-2 border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <Info className="h-4 w-4" />
              View Full Details
            </button>

            <Link href="/waitlist?plan=honour">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-2xl font-semibold text-lg">
                Choose Honour
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Enhanced Compare All Plans Section */}
      <div className="mt-16 mb-8 max-w-4xl mx-auto px-4 md:px-6">
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-purple-100/50 rounded-3xl blur-xl"></div>

          {/* Main content */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-8 sm:p-12 shadow-lg">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl mb-6 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Need to see every detail?</h3>

              <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                Get the complete side-by-side breakdown of all features, benefits, and services across our three care
                plans.
              </p>

              <Link href="/compare">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <span className="flex items-center gap-3">
                    Compare All Care Plans
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </Link>

              <p className="text-sm text-gray-500 mt-4">
                ✨ Interactive comparison • Mobile-friendly • Detailed breakdown
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">What makes us different?</h3>
          <div className="max-w-3xl mx-auto space-y-4 text-gray-600 text-lg leading-relaxed">
            <p>In an emergency, we don't just send an ambulance.</p>
            <p className="font-medium">We place a trained doctor by their bedside - and keep you updated every hour.</p>
            <p>We don't just do calls and check-ins.</p>
            <p className="font-medium">We accompany them to the hospital, the bank, the grocery store.</p>
            <p>We help them teach, volunteer, tell their stories, and feel alive - not managed.</p>
            <p className="text-primary font-semibold text-xl mt-6">
              This is not elderly care.
              <br />
              This is how you love, when you're far.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mt-16 bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl p-12 max-w-4xl mx-auto border border-primary/10">
        <h4 className="font-bold text-gray-900 mb-4 text-xl">Times NRI</h4>
        <p className="text-gray-700 text-lg leading-relaxed">
          This isn't a healthcare service.
          <br />
          <span className="font-semibold text-primary">This is what love looks like when you can't be there.</span>
        </p>
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    selectedPlan === "peace"
                      ? "bg-blue-100"
                      : selectedPlan === "presence"
                        ? "bg-accent/10"
                        : "bg-purple-100"
                  }`}
                >
                  {planDetails[selectedPlan].icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{planDetails[selectedPlan].name}</h3>
                  <p className="text-sm text-gray-600">{planDetails[selectedPlan].description}</p>
                  <p className="text-sm font-medium text-primary italic mt-1">{planDetails[selectedPlan].emotion}</p>
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

              <div className="grid md:grid-cols-2 gap-8">
                {planDetails[selectedPlan].features.map((category, index) => (
                  <div key={index} className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-lg border-b border-gray-200 pb-2">
                      {category.category}
                    </h4>
                    {category.description && <p className="text-sm text-gray-600 mb-3">{category.description}</p>}
                    <ul className="space-y-3">
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
                <p className="text-gray-700">
                  <span className="font-semibold">Perfect for:</span> {planDetails[selectedPlan].perfectFor}
                </p>
              </div>

              <div className="mt-8 flex gap-4">
                <Link href={`/waitlist?plan=${selectedPlan}`} className="flex-1">
                  <Button
                    className={`w-full ${planDetails[selectedPlan].buttonColor} text-white py-4 rounded-2xl font-semibold text-lg`}
                  >
                    Choose {planDetails[selectedPlan].name}
                  </Button>
                </Link>
                <button
                  onClick={closePlanDetails}
                  className="px-8 py-4 border border-gray-300 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showComparison && (
        <CarePlansComparison
          onClose={() => setShowComparison(false)}
          onSelectPlan={(plan) => {
            setShowComparison(false)
            window.location.href = `/waitlist?plan=${plan}`
          }}
        />
      )}
    </div>
  )
}
