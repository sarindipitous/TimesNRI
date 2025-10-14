"use client"
import { Check, X, Crown, Heart, Shield, ChevronLeft, ChevronRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"

interface ComparisonFeature {
  category: string
  features: {
    name: string
    peace: boolean | string
    presence: boolean | string
    honour: boolean | string
  }[]
}

const comparisonData: ComparisonFeature[] = [
  {
    category: "Emergency & Safety",
    features: [
      {
        name: "24x7 Emergency Helpline with SOS button",
        peace: true,
        presence: true,
        honour: "Personalised SOS button",
      },
      {
        name: "One-time mapping of Doctor, Hospital, and Ambulance Partner",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Unlimited Complimentary Ambulance (BLS)",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Unlimited ACLS Ambulance with live tracking",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Home Emergency Kit",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Doctor on ground during emergencies with priority hospital access",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Active fall detection with automated dispatch and care escalation",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Cashless admission with walk-out settlement handled for you",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Dedicated doctor presence in hospital during admission",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Daily wellness check-in call",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Post-hospitalisation care coordination",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "International Second Opinion from USA, EU, UK medical doctors",
        peace: false,
        presence: false,
        honour: true,
      },
    ],
  },
  {
    category: "Healthcare & Longevity",
    features: [
      {
        name: "Doctor on call",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Health liaison",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Annual health assessment with Geriatrician",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Quarterly check-ins with Geriatrician",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Unlimited 24x7 Teleconsults with Physician",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Biannual counselling sessions with parents and NRIs",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "EHR digitisation of old health records",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Home safety and fall detection audits",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Air, EMR, and water quality audits for home",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Weekly nurse visits for vitals",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Monthly doctor visits at home or clinic",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Comprehensive annual medical with advanced cancer screening",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Concierge doctor (Geriatrician/Internal Medicine) available 24x7",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Genetic Screening + Annual Gut Microbiome test",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "6-monthly Biomarker panels with predictive insights",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "4 premium sessions per quarter at Vardan Clinics",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Personalised diet and lifestyle program with nutritionist and fitness coach",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Integrative therapies (AYUSH, Cryotherapy, HBOT, advanced wellness)",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "HIPAA-compliant global EHR with IoT-enabled monitoring",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "International medical concierge for travel, with curated medical kit",
        peace: false,
        presence: false,
        honour: true,
      },
    ],
  },
  {
    category: "Engagement & Companionship",
    features: [
      {
        name: "Basic check-ins and support",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Care Companion visits per month (2 hours each)",
        peace: false,
        presence: "2 visits",
        honour: "4 visits",
      },
      {
        name: "Accompanied recreational or social visits (movies, shopping, temples, restaurants)",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Celebration of birthdays, anniversaries, and festivals",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Online activities for cognition",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Volunteering and social work opportunities",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Yoga, spirituality, and astrology sessions",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Spiritual Advisor on call",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Access to exclusive events, premieres, and performances",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Personalised elder-friendly travel concierge",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Social engagement, volunteering, and curated gatherings",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Celebrations managed end-to-end",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Yoga, mindfulness, and cognition programs",
        peace: false,
        presence: false,
        honour: true,
      },
    ],
  },
  {
    category: "Lifestyle & Convenience",
    features: [
      {
        name: "Concierge support for home maintenance, repairs, and utilities",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Automated bill payment and tracking",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Banking and insurance support (motor, health, home, etc.)",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Grocery and food delivery coordination",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Arranging pujas, celebrations, and house events",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Help desk for IoT devices for security and fall prevention",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Prepaid wallet for cashless transactions",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Insurance concierge for health, motor, and property",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Legal, financial, and accounting advisory",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Visa and biometric services at home",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Airport meet-and-greet arrangements",
        peace: false,
        presence: false,
        honour: true,
      },
    ],
  },
  {
    category: "Documentation & Admin",
    features: [
      {
        name: "Basic support",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "KYC and verification of existing househelp",
        peace: false,
        presence: true,
        honour: true,
      },
      {
        name: "Passport renewals",
        peace: false,
        presence: false,
        honour: true,
      },
      {
        name: "Life certificate and ID management",
        peace: false,
        presence: false,
        honour: true,
      },
    ],
  },
]

const plans = [
  {
    id: "peace",
    name: "Peace",
    price: "$50",
    description: "Safety and everyday assurance",
    icon: Heart,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-600",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "presence",
    name: "Presence",
    price: "$150",
    description: "Companionship and continuous care",
    icon: Shield,
    color: "accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
    textColor: "text-accent",
    buttonColor: "bg-accent hover:bg-accent/90",
  },
  {
    id: "honour",
    name: "Honour",
    price: "$500",
    description: "World-class, dignified care",
    icon: Crown,
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-600",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    badge: "By Invitation Only",
  },
]

interface CarePlansComparisonProps {
  onClose: () => void
  onSelectPlan?: (plan: string) => void
}

export function CarePlansComparison({ onClose, onSelectPlan }: CarePlansComparisonProps) {
  const [mobileView, setMobileView] = useState<"compare" | "single">("compare")
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const renderFeatureValue = (value: boolean | string, planType: "peace" | "presence" | "honour", compact = false) => {
    if (value === true) {
      return (
        <div className="flex items-center justify-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          {!compact && <span className="text-sm text-green-700 font-medium">Included</span>}
        </div>
      )
    }
    if (value === false) {
      return (
        <div className="flex items-center justify-center gap-2">
          <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
          {!compact && <span className="text-sm text-gray-500">Not included</span>}
        </div>
      )
    }
    if (typeof value === "string") {
      return (
        <div className="flex items-center justify-center gap-2">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span
            className={`text-sm font-medium text-center ${
              planType === "peace" ? "text-blue-700" : planType === "presence" ? "text-accent" : "text-purple-700"
            }`}
          >
            {value}
          </span>
        </div>
      )
    }
    return null
  }

  const currentPlan = plans[selectedPlanIndex]
  const IconComponent = currentPlan.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compare Care Plans</h1>
              <p className="text-sm text-gray-500 mt-1">Choose the right level of care for your loved ones</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Mobile View Toggle */}
          <div className="lg:hidden mb-4 flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMobileView("compare")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mobileView === "compare" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setMobileView("single")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mobileView === "single" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Individual Plan
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Plan Selector - Only show in single view */}
      {mobileView === "single" && (
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPlanIndex(Math.max(0, selectedPlanIndex - 1))}
              disabled={selectedPlanIndex === 0}
              className="p-2 rounded-full bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex-1 mx-4">
              <div
                className={`${currentPlan.bgColor} rounded-xl p-4 border-2 ${currentPlan.borderColor} shadow-sm relative`}
              >
                {currentPlan.id === "honour" && (
                  <span className="absolute -top-2 right-2 bg-purple-600 text-[10px] font-semibold text-white px-2 py-0.5 rounded-full shadow">
                    By Invitation Only
                  </span>
                )}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <IconComponent className={`h-5 w-5 ${currentPlan.textColor}`} />
                  <h4 className="font-bold text-gray-900">{currentPlan.name}</h4>
                </div>
                <div className={`text-2xl font-bold ${currentPlan.textColor} mb-1 text-center`}>
                  {currentPlan.price}/month
                </div>
                <Link href={`/waitlist?plan=${currentPlan.id}`}>
                  <Button size="sm" className={`w-full ${currentPlan.buttonColor} text-white font-semibold py-2`}>
                    Choose {currentPlan.name}
                  </Button>
                </Link>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlanIndex(Math.min(plans.length - 1, selectedPlanIndex + 1))}
              disabled={selectedPlanIndex === plans.length - 1}
              className="p-2 rounded-full bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex justify-center mt-3 gap-2">
            {plans.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedPlanIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedPlanIndex ? "bg-primary" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Desktop Plan Headers */}
        <div className="hidden lg:block sticky top-20 bg-white border border-gray-200 rounded-lg z-40 shadow-sm mb-6">
          <div className="grid grid-cols-4 gap-4 p-4">
            <div className="font-bold text-gray-900 text-lg flex items-center">Features</div>

            {plans.map((plan) => {
              const IconComponent = plan.icon
              return (
                <div key={plan.id} className="text-center">
                  <div className={`${plan.bgColor} rounded-lg p-3 border ${plan.borderColor} shadow-sm relative`}>
                    {plan.id === "honour" && (
                      <span className="absolute -top-2 right-2 bg-purple-600 text-[10px] font-semibold text-white px-2 py-0.5 rounded-full shadow">
                        By Invitation Only
                      </span>
                    )}
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <IconComponent className={`h-4 w-4 ${plan.textColor}`} />
                      <h4 className="font-bold text-gray-900 text-sm">{plan.name}</h4>
                    </div>
                    <div className={`text-xl font-bold ${plan.textColor} mb-1`}>{plan.price}/month</div>
                    <Link href={`/waitlist?plan=${plan.id}`}>
                      <Button size="sm" className={`w-full ${plan.buttonColor} text-white font-semibold py-1 text-xs`}>
                        Choose {plan.name}
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile Plan Headers - Only show in compare view */}
        {mobileView === "compare" && (
          <div className="lg:hidden bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="overflow-x-auto">
              <div className="flex gap-3 min-w-max pb-2">
                {plans.map((plan) => {
                  const IconComponent = plan.icon
                  return (
                    <div
                      key={plan.id}
                      className={`${plan.bgColor} rounded-lg p-3 border ${plan.borderColor} relative min-w-[140px] flex-shrink-0`}
                    >
                      {plan.id === "honour" && (
                        <span className="absolute -top-2 right-1 bg-purple-600 text-[9px] font-semibold text-white px-1.5 py-0.5 rounded-full shadow">
                          Invitation Only
                        </span>
                      )}
                      <div className="flex flex-col items-center text-center">
                        <IconComponent className={`h-4 w-4 ${plan.textColor} mb-1`} />
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{plan.name}</h4>
                        <div className={`text-lg font-bold ${plan.textColor} mb-2`}>{plan.price}/mo</div>
                        <Link href={`/waitlist?plan=${plan.id}`} className="w-full">
                          <Button size="sm" className={`w-full ${plan.buttonColor} text-white text-xs py-1.5`}>
                            Choose
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center mt-2">← Swipe to see all plans →</div>
          </div>
        )}

        {/* Feature Comparison */}
        <div className="space-y-6">
          {comparisonData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b border-gray-200">
                <h5 className="font-bold text-lg text-gray-900 flex items-center gap-3">
                  <div
                    className={`w-2 h-6 rounded-full ${
                      categoryIndex === 0
                        ? "bg-red-500"
                        : categoryIndex === 1
                          ? "bg-green-500"
                          : categoryIndex === 2
                            ? "bg-blue-500"
                            : categoryIndex === 3
                              ? "bg-purple-500"
                              : "bg-gray-500"
                    }`}
                  ></div>
                  {category.category}
                </h5>
              </div>

              <div className="divide-y divide-gray-100">
                {category.features.map((feature, featureIndex) => (
                  <div key={featureIndex}>
                    {/* Desktop Layout */}
                    <div className="hidden lg:grid grid-cols-4 gap-4 py-3 px-6 hover:bg-gray-50 transition-colors">
                      <div className="text-sm text-gray-800 font-medium leading-relaxed pr-4 flex items-center">
                        {feature.name}
                      </div>
                      <div className="flex justify-center items-center min-h-[32px]">
                        {renderFeatureValue(feature.peace, "peace", true)}
                      </div>
                      <div className="flex justify-center items-center min-h-[32px]">
                        {renderFeatureValue(feature.presence, "presence", true)}
                      </div>
                      <div className="flex justify-center items-center min-h-[32px]">
                        {renderFeatureValue(feature.honour, "honour", true)}
                      </div>
                    </div>

                    {/* Mobile Compare Layout */}
                    {mobileView === "compare" && (
                      <div className="lg:hidden p-4">
                        <div className="text-sm text-gray-800 font-medium leading-relaxed mb-3">{feature.name}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1 font-medium">Peace</div>
                            <div className="min-h-[40px] flex items-center justify-center">
                              {renderFeatureValue(feature.peace, "peace", true)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1 font-medium">Presence</div>
                            <div className="min-h-[40px] flex items-center justify-center">
                              {renderFeatureValue(feature.presence, "presence", true)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1 font-medium">Honour</div>
                            <div className="min-h-[40px] flex items-center justify-center">
                              {renderFeatureValue(feature.honour, "honour", true)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile Single Plan Layout */}
                    {mobileView === "single" && (
                      <div className="lg:hidden p-4">
                        <div className="text-sm text-gray-800 font-medium leading-relaxed mb-3">{feature.name}</div>
                        <div className="flex items-start gap-3">
                          {renderFeatureValue(
                            feature[currentPlan.id as keyof typeof feature] as boolean | string,
                            currentPlan.id as "peace" | "presence" | "honour",
                            false,
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Specialist Add-Ons */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <h6 className="font-bold text-lg text-gray-900">Specialist Add-Ons</h6>
          </div>
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  Dementia Care Add-On
                </h5>
                <span className="font-bold text-purple-600">$120/month</span>
              </div>
              <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                <li>Monthly psychologist sessions and caregiver counselling</li>
                <li>Cognitive assessment via app</li>
                <li>Diet, physiotherapy, and behavioural guidance</li>
                <li>Nurse or attendant support for respite care</li>
                <li>Medication reminders</li>
                <li>Geofencing wearables and fall detection</li>
                <li>Access to exclusive dementia caregiver content</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">🍎</span>
                  Diabetes Management Add-On
                </h5>
                <span className="font-bold text-green-600">$50/month</span>
              </div>
              <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                <li>Daily monitoring calls</li>
                <li>Quarterly HbA1c tests</li>
                <li>Teleconsults with Diabetologist</li>
                <li>Monthly dietician sessions</li>
                <li>Annual eye check-up</li>
                <li>Access to support groups and lifestyle workshops</li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">💓</span>
                  Heart Disease Management Add-On
                </h5>
                <span className="font-bold text-red-600">$50/month</span>
              </div>
              <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                <li>Daily monitoring calls</li>
                <li>Quarterly Cardiologist consultations</li>
                <li>Annual cardiac check-up (ECG, 2D Echo)</li>
                <li>Monthly dietician sessions</li>
                <li>Access to lifestyle workshops and education resources</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Each specialist add-on integrates seamlessly with any Times NRI plan for complete, continuous care.
          </div>
        </div>

        {/* Closing CTA */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
          <h6 className="font-bold text-xl text-gray-900 mb-3">Choose your plan with confidence.</h6>
          <p className="text-gray-600 mb-4">
            Every Times NRI plan includes verified emergency support, medical coordination, and trusted concierge care.
          </p>
          <Link href="/waitlist">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
              Join Waitlist
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
