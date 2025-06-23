"use client"
import { Check, X, Crown, Heart, Shield, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

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
        name: "Ultrahuman Ring (fall detection + vitals tracking)",
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

interface CarePlansComparisonProps {
  onClose: () => void
  onSelectPlan: (plan: string) => void
}

export function CarePlansComparison({ onClose, onSelectPlan }: CarePlansComparisonProps) {
  const renderFeatureValue = (value: boolean | string, planType: "peace" | "presence" | "honour") => {
    if (value === true) {
      return <Check className="h-5 w-5 text-green-500 mx-auto flex-shrink-0" />
    }
    if (value === false) {
      return <X className="h-5 w-5 text-gray-300 mx-auto flex-shrink-0" />
    }
    if (value === "Value-Added") {
      return (
        <div className="flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 px-2 py-1 rounded-md flex items-center gap-1">
            <Plus className="h-3 w-3" />
            Value-Added
          </span>
        </div>
      )
    }
    if (typeof value === "string") {
      return (
        <span
          className={`text-sm font-medium text-center px-3 py-2 rounded-lg ${
            planType === "peace"
              ? "text-blue-700 bg-blue-100 border border-blue-200"
              : planType === "presence"
                ? "text-accent bg-accent/10 border border-accent/20"
                : "text-purple-700 bg-purple-100 border border-purple-200"
          }`}
        >
          {value}
        </span>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-gray-100 p-6 flex items-center justify-between rounded-t-3xl bg-white">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Compare Care Plans</h3>
            <p className="text-sm text-gray-500 mt-1">Choose the right level of care for your loved ones</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {/* Plan Headers - Sticky */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
            <div className="grid grid-cols-4 gap-6 p-6 min-w-[1000px]">
              <div className="font-bold text-gray-900 text-lg flex items-center">
                <div className="text-4xl mr-3">🪷</div>
                Features
              </div>

              {/* Peace Plan Header */}
              <div className="text-center">
                <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Heart className="h-6 w-6 text-blue-600" />
                    <h4 className="font-bold text-gray-900 text-lg">Peace</h4>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">$50</div>
                  <div className="text-sm text-gray-600 mb-3">per month</div>
                  <div className="text-xs text-blue-600 font-medium italic mb-4 leading-relaxed">
                    Peace of mind, always within reach
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
                    onClick={() => onSelectPlan("peace")}
                  >
                    Choose Peace
                  </Button>
                </div>
              </div>

              {/* Presence Plan Header */}
              <div className="text-center">
                <div className="bg-accent/10 rounded-2xl p-6 border-2 border-accent/30 shadow-sm relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-4 mt-2">
                    <Shield className="h-6 w-6 text-accent" />
                    <h4 className="font-bold text-gray-900 text-lg">Presence</h4>
                  </div>
                  <div className="text-3xl font-bold text-accent mb-2">$200</div>
                  <div className="text-sm text-gray-600 mb-3">per month</div>
                  <div className="text-xs text-accent font-medium italic mb-4 leading-relaxed">
                    Your caring presence, delivered daily
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-2"
                    onClick={() => onSelectPlan("presence")}
                  >
                    Choose Presence
                  </Button>
                </div>
              </div>

              {/* Honour Plan Header */}
              <div className="text-center">
                <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Crown className="h-6 w-6 text-purple-600" />
                    <h4 className="font-bold text-gray-900 text-lg">Honour</h4>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">$500</div>
                  <div className="text-sm text-gray-600 mb-3">per month</div>
                  <div className="text-xs text-purple-600 font-medium italic mb-4 leading-relaxed">
                    The dignity and care they gave you, returned in full
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2"
                    onClick={() => onSelectPlan("honour")}
                  >
                    Choose Honour
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="p-6 space-y-10 min-w-[1000px]">
            {comparisonData.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 shadow-sm">
                <h5 className="font-bold text-2xl text-gray-900 mb-8 pb-4 border-b-2 border-gray-300 flex items-center gap-4">
                  <div
                    className={`w-3 h-10 rounded-full ${
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
                <div className="space-y-3">
                  {category.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="grid grid-cols-4 gap-6 py-5 px-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                    >
                      <div className="text-sm text-gray-800 font-medium leading-relaxed pr-4 flex items-center">
                        {feature.name}
                      </div>
                      <div className="flex justify-center items-center min-h-[40px]">
                        {renderFeatureValue(feature.peace, "peace")}
                      </div>
                      <div className="flex justify-center items-center min-h-[40px]">
                        {renderFeatureValue(feature.presence, "presence")}
                      </div>
                      <div className="flex justify-center items-center min-h-[40px]">
                        {renderFeatureValue(feature.honour, "honour")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Value-Added Services Note */}
          <div className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-t border-gray-200 min-w-[1000px]">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">🪷</div>
                <h6 className="font-bold text-xl text-gray-900">Understanding Your Options</h6>
              </div>
              <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-700">
                <div className="space-y-3">
                  <p className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-semibold">Included:</span> Feature is part of your plan at no extra cost
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded border border-blue-200 mt-0.5 flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">2x</span>
                    </div>
                    <span>
                      <span className="font-semibold">Specific Quantity:</span> Number of times per month/year included
                    </span>
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gray-100 rounded border border-gray-300 mt-0.5 flex-shrink-0 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-gray-600" />
                    </div>
                    <span>
                      <span className="font-semibold">Value-Added:</span> Available as an add-on service with
                      transparent pricing
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <X className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-semibold">Not Available:</span> Feature not offered (very rare)
                    </span>
                  </p>
                </div>
                <div className="bg-accent/5 rounded-xl p-4">
                  <p className="text-accent font-semibold mb-2">Our Promise</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
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
