"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { WaitlistForm } from "./waitlist-form"
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
      "Essential protection with 24x7 emergency support and comprehensive concierge services for daily living.",
    features: [
      "24x7 Emergency Helpline with SOS button",
      "One-time mapping of Doctor, Hospital, and Ambulance Partner",
      "Unlimited Complimentary Ambulance (BLS)*",
      "Concierge support for home maintenance, repairs, and utilities",
      "Automated bill payment and tracking",
      "Banking and insurance support (motor, health, home, etc.)",
      "Grocery and food delivery coordination",
      "Arranging pujas, celebrations, and house events",
      "Help desk for IoT devices for security and fall prevention",
    ],
    bestFor: "NRIs who want trusted emergency support and comprehensive daily living assistance.",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    textColor: "text-blue-600",
  },
  {
    id: "presence",
    name: "Presence",
    price: "$150",
    emoji: "🫱🏽‍🫲🏼",
    tagline: "Companionship and continuous care.",
    description:
      "Everything in Peace, plus regular companionship, comprehensive health monitoring, and social engagement.",
    features: [
      "Everything in Peace",
      "Annual health assessment with Geriatrician",
      "Quarterly check-ins with Geriatrician",
      "Daily wellness check-in call",
      "Unlimited 24x7 Teleconsults with Physician",
      "Biannual counselling sessions with parents and NRIs",
      "EHR digitisation of old health records",
      "Post-hospitalisation care coordination",
      "Home safety and fall detection audits",
      "KYC and verification of existing househelp",
      "Air, EMR, and water quality audits for home",
      "Care Companion visits: 2 per month (2 hours each)",
      "Accompanied recreational or social visits (movies, shopping, temples, restaurants)",
      "Celebration of birthdays, anniversaries, and festivals",
      "Online activities for cognition",
      "Volunteering and social work opportunities",
      "Yoga, spirituality, and astrology sessions",
      "Concierge for home maintenance, repair, and utilities",
      "Prepaid wallet for cashless transactions",
      "Automated bill tracking and banking/insurance support",
    ],
    bestFor: "NRIs who want regular human connection, comprehensive health monitoring, and active social engagement.",
    buttonColor: "bg-teal-600 hover:bg-teal-700",
    textColor: "text-teal-600",
  },
  {
    id: "honour",
    name: "Honour",
    price: "$500",
    emoji: "👑",
    tagline: "World-class, dignified care.",
    description:
      "Everything in Presence, plus premium medical care, advanced diagnostics, and white-glove concierge services.",
    features: [
      "Everything in Presence",
      "Care Companion visits: 4 per month (2 hours each)",
      "Weekly nurse visits for vitals",
      "Monthly doctor visits at home or clinic",
      "24x7 Emergency Helpline with personalised SOS button",
      "Doctor on ground during emergencies with priority hospital access",
      "Unlimited ACLS Ambulance with live tracking and home Emergency Kit",
      "Active fall detection with automated dispatch and care escalation",
      "Cashless admission with walk-out settlement handled for you",
      "Dedicated doctor presence in hospital during admission",
      "International Second Opinion from USA, EU, UK medical boards",
      "Comprehensive annual medical with advanced cancer screening",
      "Concierge doctor (Geriatrician/Internal Medicine) available 24x7",
      "Genetic Screening + Annual Gut Microbiome test",
      "6-monthly Biomarker panels with predictive insights",
      "4 premium sessions per quarter at Vardan Clinics",
      "Personalised diet and lifestyle program with nutritionist and fitness coach",
      "Integrative therapies (AYUSH, Cryotherapy, HBOT, advanced wellness)",
      "HIPAA-compliant global EHR with IoT-enabled monitoring",
      "International medical concierge for travel, with curated medical kit",
      "Home safety and radiation audits (air, water, EMR)",
      "KYC and police verification of house staff",
      "IoT-enabled security and fall prevention systems",
      "Insurance concierge for health, motor, and property",
      "Spiritual Advisor on call",
      "Access to exclusive events, premieres, and performances",
      "Personalised elder-friendly travel concierge",
      "Social engagement, volunteering, and curated gatherings",
      "Celebrations managed end-to-end",
      "Yoga, mindfulness, and cognition programs",
      "Prepaid wallet for cashless transactions",
      "Automated bill management and tracking",
      "Banking and insurance desk",
      "Grocery, food delivery, and vetted professionals for home upkeep",
      "Legal, financial, and accounting advisory",
      "Visa and biometric services at home",
      "Airport meet-and-greet arrangements",
    ],
    bestFor: "NRIs who want complete, world-class care with no compromises on quality, access, or dignity.",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    textColor: "text-purple-600",
    inviteOnly: true,
  },
]

export function PricingSection({ className }: PricingProps) {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("")

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
                <ul className="space-y-2">
                  {plan.features.slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1 text-xs">•</span>
                      <span className="text-gray-700 text-xs leading-relaxed">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 6 && (
                    <li className="text-xs text-gray-500 italic">+ {plan.features.length - 6} more features</li>
                  )}
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

      {/* Add-Ons Section */}
      <div className="mt-16">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-primary mb-3">Specialist Care Modules</h3>
          <p className="text-gray-600">Each specialist add-on can be added to any plan at any time.</p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-2 border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">🧠</span>
                Dementia Care Add-On
              </CardTitle>
              <CardDescription className="font-semibold text-purple-600">$120/month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Proprietary dementia assessment via care app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Monthly psychologist sessions (virtual)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Expert guidance for caregivers through counselling and support groups</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Diet and nutrition sessions every 3 months</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>One complimentary physiotherapy session</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Two assisted doctor visits per month (2 hours each)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Priority access to homecare support (nurse or attendant)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Medication reminders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Exclusive content for dementia caregivers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Wearables with geofencing and fall detection</span>
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
              <CardDescription className="font-semibold text-green-600">$50/month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Daily monitoring calls and proactive management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Quarterly HbA1c tests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Teleconsultation with Diabetologist every 3 months</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>One caregiver visit per month (2 hours each)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Monthly dietician sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Annual eye check-up</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Access to diabetes support groups</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Lifestyle and yoga sessions with exercise video library</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Educational materials for long-term management</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">💓</span>
                Heart Disease Management Add-On
              </CardTitle>
              <CardDescription className="font-semibold text-red-600">$50/month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Daily monitoring calls and proactive appointment management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Quarterly Cardiologist appointments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>One accompanied appointment per month (2 hours each)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Monthly dietician teleconsultations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Annual cardiac check-up including ECG and 2D Echo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Access to heart health support groups</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Lifestyle sessions covering heart health, yoga, and meditation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Educational materials and exercise video library</span>
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
    </section>
  )
}
