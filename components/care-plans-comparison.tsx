"use client"
import { Check, X, Crown, Heart, Shield, Plus, ChevronLeft, ChevronRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

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
    category: "Emergency",
    features: [
      {
        name: "24x7 Emergency Helpline",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "24x7 Doctor on Call",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Complimentary Ambulance In-case of Emergency",
        peace: "1/Year",
        presence: "6/Year",
        honour: "Unlimited",
      },
      {
        name: "Emergency co-ordination with hospitals",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "On-Ground Doctor availability to speak with the specialist at the hospital and answer any question that the senior member or the family may have (if hospitalised)",
        peace: "Value-Added",
        presence: "Value-Added",
        honour: "Full hospitalisation duration",
      },
      {
        name: "On-Ground Nurse during the day (if hospitalised)",
        peace: "Value-Added",
        presence: "Up to 3 days",
        honour: "Full hospitalisation duration",
      },
      {
        name: "Ambulance Tracking",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Medical Handover of senior member's health records and advocacy on your behalf",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Partner Hospital Benefits - priority check-in, priority access to physicians and specialists, manage insurance documentation, free credit line extended to ensure early checkout of the senior member",
        peace: "Value-Added",
        presence: "Value-Added",
        honour: true,
      },
      {
        name: "During onboarding, Mapping the closest hospitals and healthcare providers in the event of an emergency",
        peace: true,
        presence: true,
        honour: true,
      },
    ],
  },
  {
    category: "Health & Wellness",
    features: [
      {
        name: "Creating and maintaining an updated health profile",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Annual Health Test",
        peace: "Value-Added",
        presence: "72 markers",
        honour: "Comprehensive + Microbiome",
      },
      {
        name: "Quarterly Diabetes Panel",
        peace: "Value-Added",
        presence: "If diabetic",
        honour: "If diabetic",
      },
      {
        name: "Health monitoring wearables (fall detection + vitals tracking)",
        peace: "Value-Added",
        presence: "Value-Added",
        honour: true,
      },
      {
        name: "Home Medical Kit includes devices to monitor BP, HR, Glucose, SpO2, Temperature",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Home Care Kit includes a first aid kit and certain emergency medication depending on the health profile of the senior member",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "At-home Prescheduled Doctor Visits",
        peace: "Value-Added",
        presence: "Value-Added",
        honour: "2/month",
      },
      {
        name: "Physiotherapy at Home",
        peace: "Value-Added",
        presence: "6/year",
        honour: "12/year",
      },
      {
        name: "Monthly Diet Plans by Nutritionist",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "During onboarding Home Safety Audit (based on health profile)",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Medication Management - Delivery + Reminders",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Access to Nurses & Attendants at Home",
        peace: "Value-Added",
        presence: "Value-Added",
        honour: "Value-Added",
      },
      {
        name: "Specialised recovery centres for post-hospital healing",
        peace: "Value-Added",
        presence: "Value-Added",
        honour: "Value-Added",
      },
    ],
  },
  {
    category: "Engagement",
    features: [
      {
        name: "Care Companion Visits (3 hrs each)",
        peace: "Value-Added",
        presence: "2/month",
        honour: "4/month",
      },
      {
        name: "Vitals monitored by Care Companion during their visit",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Trusted companionship for doctor visits, errands, walks and everyday life during their visit",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Access to Wellness and spiritual Content",
        peace: true,
        presence: true,
        honour: true,
      },
      {
        name: "Live Online Events (Yoga, Tambola, Antakshari)",
        peace: "Limited access",
        presence: true,
        honour: true,
      },
      {
        name: "Peer Community Access",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Volunteering Platform (e.g. Teach India)",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Storytelling, Book Clubs, Cognitive Groups",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Gentle gamification to motivate movement, wellness, and community - through daily steps, yoga, and volunteering",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
    ],
  },
  {
    category: "Convenience",
    features: [
      {
        name: "Concierge for Bills, Meds, Cabs, Appointments",
        peace: "Limited to doctor appointments and medicine delivery",
        presence: "Full",
        honour: "Full + Priority",
      },
      {
        name: "Travel Booking, Visa, Biometrics at Home",
        peace: "Value-Added",
        presence: "Value-Added",
        honour: "Included",
      },
      {
        name: "Access to Airport Lounges",
        peace: "Value-Added",
        presence: true,
        honour: true,
      },
      {
        name: "Assisted Travel with Trained Companion",
        peace: "Value-Added",
        presence: "Value-Added",
        honour: "Value-Added",
      },
      {
        name: "Assisted checkin to boarding experience at most Indian Airports",
        peace: "Value-Added",
        presence: "2 trips/year",
        honour: "Unlimited",
      },
    ],
  },
]

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
  },
]

interface CarePlansComparisonProps {
  onClose: () => void
  onSelectPlan?: (plan: string) => void
}

export function CarePlansComparison({ onClose, onSelectPlan }: CarePlansComparisonProps) {
  const [mobileView, setMobileView] = useState<"compare" | "single">("compare")
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(1) // Default to Presence plan

  const renderFeatureValue = (value: boolean | string, planType: "peace" | "presence" | "honour", compact = false) => {
    if (value === true) {
      return (
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          {!compact && <span className="text-sm text-green-700 font-medium">Included</span>}
        </div>
      )
    }
    if (value === false) {
      return (
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
          {!compact && <span className="text-sm text-gray-500">Not included</span>}
        </div>
      )
    }
    if (value === "Value-Added") {
      return (
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-orange-500 flex-shrink-0" />
          <span className="text-sm text-orange-700 font-medium">Add-on available</span>
        </div>
      )
    }
    if (typeof value === "string") {
      return (
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span
            className={`text-sm font-medium ${
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-gray-100 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Compare Care Plans</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Choose the right level of care for your loved ones
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
            </button>
          </div>

          {/* Mobile View Toggle */}
          <div className="lg:hidden mt-4 flex bg-gray-100 rounded-lg p-1">
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

        {/* Mobile Plan Selector - Only show in single view */}
        {mobileView === "single" && (
          <div className="lg:hidden flex-shrink-0 bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedPlanIndex(Math.max(0, selectedPlanIndex - 1))}
                disabled={selectedPlanIndex === 0}
                className="p-2 rounded-full bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex-1 mx-4">
                <div className={`${currentPlan.bgColor} rounded-xl p-4 border-2 ${currentPlan.borderColor} shadow-sm`}>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <IconComponent className={`h-5 w-5 ${currentPlan.textColor}`} />
                    <h4 className="font-bold text-gray-900">{currentPlan.name}</h4>
                  </div>
                  <div className={`text-2xl font-bold ${currentPlan.textColor} mb-1 text-center`}>
                    {currentPlan.price}
                  </div>
                  <div className="text-xs text-gray-600 mb-3 text-center">per month</div>
                  <div
                    className={`text-xs ${currentPlan.textColor} font-medium italic mb-3 leading-relaxed text-center`}
                  >
                    {currentPlan.description}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {/* Desktop Plan Headers - Hidden on mobile */}
          <div className="hidden lg:block sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
            <div className="grid grid-cols-4 gap-6 p-6 min-w-[1000px]">
              <div className="font-bold text-gray-900 text-lg flex items-center">Features</div>

              {plans.map((plan) => {
                const IconComponent = plan.icon
                return (
                  <div key={plan.id} className="text-center">
                    <div className={`${plan.bgColor} rounded-2xl p-6 border-2 ${plan.borderColor} shadow-sm`}>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <IconComponent className={`h-6 w-6 ${plan.textColor}`} />
                        <h4 className="font-bold text-gray-900 text-lg">{plan.name}</h4>
                      </div>
                      <div className={`text-3xl font-bold ${plan.textColor} mb-2`}>{plan.price}</div>
                      <div className="text-sm text-gray-600 mb-3">per month</div>
                      <div className={`text-xs ${plan.textColor} font-medium italic mb-4 leading-relaxed`}>
                        {plan.description}
                      </div>
                      <Link href={`/waitlist?plan=${plan.id}`}>
                        <Button size="sm" className={`w-full ${plan.buttonColor} text-white font-semibold py-2`}>
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
            <div className="lg:hidden bg-white border-b border-gray-200 p-4">
              <div className="grid grid-cols-3 gap-3">
                {plans.map((plan) => {
                  const IconComponent = plan.icon
                  return (
                    <div key={plan.id} className={`${plan.bgColor} rounded-lg p-3 border ${plan.borderColor}`}>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <IconComponent className={`h-4 w-4 ${plan.textColor}`} />
                        <h4 className="font-bold text-gray-900 text-sm">{plan.name}</h4>
                      </div>
                      <div className={`text-lg font-bold ${plan.textColor} text-center`}>{plan.price}</div>
                      <div className="text-xs text-gray-600 text-center">per month</div>
                      <Link href={`/waitlist?plan=${plan.id}`} className="block mt-2">
                        <Button size="sm" className={`w-full ${plan.buttonColor} text-white text-xs py-1`}>
                          Choose
                        </Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Feature Comparison */}
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-10">
            {comparisonData.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm"
              >
                <h5 className="font-bold text-lg sm:text-2xl text-gray-900 mb-4 sm:mb-8 pb-2 sm:pb-4 border-b-2 border-gray-300 flex items-center gap-2 sm:gap-4">
                  <div
                    className={`w-2 sm:w-3 h-6 sm:h-10 rounded-full ${
                      categoryIndex === 0
                        ? "bg-red-500"
                        : categoryIndex === 1
                          ? "bg-green-500"
                          : categoryIndex === 2
                            ? "bg-blue-500"
                            : "bg-purple-500"
                    }`}
                  ></div>
                  {category.category}
                </h5>

                <div className="space-y-2 sm:space-y-3">
                  {category.features.map((feature, featureIndex) => (
                    <div key={featureIndex}>
                      {/* Desktop Layout */}
                      <div className="hidden lg:grid grid-cols-4 gap-6 py-5 px-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 min-w-[1000px]">
                        <div className="text-sm text-gray-800 font-medium leading-relaxed pr-4 flex items-center">
                          {feature.name}
                        </div>
                        <div className="flex justify-center items-center min-h-[40px]">
                          {renderFeatureValue(feature.peace, "peace", true)}
                        </div>
                        <div className="flex justify-center items-center min-h-[40px]">
                          {renderFeatureValue(feature.presence, "presence", true)}
                        </div>
                        <div className="flex justify-center items-center min-h-[40px]">
                          {renderFeatureValue(feature.honour, "honour", true)}
                        </div>
                      </div>

                      {/* Mobile Compare Layout */}
                      {mobileView === "compare" && (
                        <div className="lg:hidden bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="text-sm text-gray-800 font-medium leading-relaxed mb-4">{feature.name}</div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <div className="text-xs text-gray-600 mb-2 font-medium">Peace</div>
                              {renderFeatureValue(feature.peace, "peace")}
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600 mb-2 font-medium">Presence</div>
                              {renderFeatureValue(feature.presence, "presence")}
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600 mb-2 font-medium">Honour</div>
                              {renderFeatureValue(feature.honour, "honour")}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mobile Single Plan Layout */}
                      {mobileView === "single" && (
                        <div className="lg:hidden bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="text-sm text-gray-800 font-medium leading-relaxed mb-3">{feature.name}</div>
                          <div className="flex items-start gap-3">
                            {renderFeatureValue(
                              feature[currentPlan.id as keyof typeof feature] as boolean | string,
                              currentPlan.id as "peace" | "presence" | "honour",
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

          {/* Value-Added Services Note */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-t border-gray-200">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <h6 className="font-bold text-lg sm:text-xl text-gray-900">Understanding Your Options</h6>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-green-700">Included:</span>
                    <span className="text-sm text-gray-600 ml-2">Feature is part of your plan at no extra cost</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Plus className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-orange-700">Add-on available:</span>
                    <span className="text-sm text-gray-600 ml-2">
                      Available as an add-on service with transparent pricing
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-blue-700">Specific details:</span>
                    <span className="text-sm text-gray-600 ml-2">Shows quantity limits or specific conditions</span>
                  </div>
                </div>
                <div className="bg-accent/5 rounded-xl p-4 mt-4">
                  <p className="text-accent font-semibold mb-2">Our Promise</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Every service you need is available. If it's not included in your plan, we offer it as a value-added
                    service with clear, upfront pricing. No surprises, just care.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
