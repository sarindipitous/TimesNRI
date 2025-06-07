"use client"

import { Button } from "@/components/ui/button"
import { Check, Info } from "lucide-react"

export function PricingSection() {
  // Update the scrollToJoin function in the pricing section to open the dialog instead
  const scrollToJoin = () => {
    const headerElement = document.querySelector("header")
    if (headerElement) {
      const event = new CustomEvent("openWaitlistDialog")
      headerElement.dispatchEvent(event)
    }
  }

  return (
    <section id="pricing" className="bg-secondary py-16 md:py-24 border-t border-gray-100">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary mb-2">
            Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary">
            Plans That Care for Your Parents, Your Way
          </h2>
          <p className="max-w-[700px] text-gray-600 text-lg">
            Choose a plan that gives you peace of mind — knowing your loved ones are cared for, every single day.
          </p>
        </div>

        {/* Limited time offer banner */}
        <div className="bg-accent/10 rounded-lg p-4 mb-8 max-w-3xl mx-auto text-center">
          <p className="text-accent font-medium">
            <span className="font-bold">Limited Time Launch Offer:</span> Save up to 50% when you join our waitlist
            today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Essential Wellbeing Plan */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-2xl font-bold text-primary">Essential Wellbeing Plan</h3>
              <div className="mt-4 space-y-1">
                <div className="text-sm text-gray-500">Regular price</div>
                <div className="text-gray-400 line-through">₹5,000/month</div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-primary">₹2,500</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <div className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded mt-1">
                  Save 50%
                </div>
                <p className="text-gray-500 text-sm pt-2">For independent parents needing basic health support</p>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-primary mb-2">Health & Wellness</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>24/7 emergency support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Medication reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Organised, dose-wise packaging & delivery of medicines</span>
                  </li>
                </ul>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <span className="font-medium">Perfect for:</span> Families seeking essential health coverage and regular
                peace of mind for ageing parents.
              </div>

              <Button
                className="w-full bg-accent hover:bg-accent/90 text-white transition-all duration-300 py-6"
                onClick={scrollToJoin}
              >
                Join the Waitlist
              </Button>
            </div>
          </div>

          {/* Comfort & Care Plan - Most Popular */}
          <div className="bg-white rounded-xl shadow-md border border-accent/20 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative md:scale-105 md:-translate-y-2">
            <div className="absolute top-0 left-0 right-0 bg-accent text-white text-center py-1.5 text-sm font-medium">
              Most Popular — chosen by 65% of families
            </div>
            <div className="p-6 border-b border-gray-100 pt-10">
              <h3 className="text-2xl font-bold text-primary">Comfort & Care Plan</h3>
              <div className="mt-4 space-y-1">
                <div className="text-sm text-gray-500">Regular price</div>
                <div className="text-gray-400 line-through">₹25,000/month</div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-primary">₹16,000</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <div className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded mt-1">
                  Save 36%
                </div>
                <p className="text-gray-500 text-sm pt-2">
                  For parents who need regular health checks and lifestyle assistance
                </p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm mb-4">Includes everything in Essential Wellbeing, plus:</p>

              <div className="mb-4">
                <h4 className="font-medium text-primary mb-2">Health & Wellness</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Monthly check-in visits with vitals monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Maintaining electronic medical records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Access to on-call geriatric physicians</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Appointment scheduling (doctor + diagnostics)</span>
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-primary mb-2">Lifestyle Enablement</h4>
                <p className="text-sm text-gray-600 mb-2">Make everyday life easier and safer for your parents:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Bill payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Elder-proofing home consultancy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Scheduling regular home repairs & maintenance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>
                      Access to exclusive content on app:
                      <ul className="ml-6 mt-1">
                        <li className="text-sm">• Play Tambola</li>
                        <li className="text-sm">• Exclusive Yoga, Spiritual & Devotional content</li>
                      </ul>
                    </span>
                  </li>
                </ul>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <span className="font-medium">Perfect for:</span> Families wanting an ongoing blend of proactive health
                management and lifestyle support.
              </div>

              <Button
                className="w-full bg-accent hover:bg-accent/90 text-white transition-all duration-300 py-6"
                onClick={scrollToJoin}
              >
                Join the Waitlist
              </Button>
            </div>
          </div>

          {/* Total Support Plan */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-2xl font-bold text-primary">Total Support Plan</h3>
              <div className="mt-4 space-y-1">
                <div className="text-sm text-gray-500">Regular price</div>
                <div className="text-gray-400 line-through">₹45,000/month</div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-primary">₹30,000</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <div className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded mt-1">
                  Save 35%
                </div>
                <p className="text-gray-500 text-sm pt-2">
                  For parents needing full care, companionship, and lifestyle enablement
                </p>
                <div className="mt-1 text-xs text-accent font-medium">
                  Best Value — save 35% vs buying services separately
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm mb-4">Includes everything in Comfort & Care, plus:</p>

              <div className="mb-4">
                <h4 className="font-medium text-primary mb-2">Health & Wellness</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>24/7 emergency support accompanied by our trained staff</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Weekly check-in visits with vitals monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Doctor visits accompanied by our trained staff</span>
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-primary mb-2">Lifestyle Enablement</h4>
                <p className="text-sm text-gray-600 mb-2">Enable greater freedom and confidence for your parents:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Assisted visits (hospitals, banks, shopping)</span>
                  </li>
                </ul>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <span className="font-medium">Perfect for:</span> Families seeking comprehensive, compassionate,
                full-service care and companionship for elderly parents.
              </div>

              <Button
                className="w-full bg-accent hover:bg-accent/90 text-white transition-all duration-300 py-6"
                onClick={scrollToJoin}
              >
                Join the Waitlist
              </Button>
            </div>
          </div>
        </div>

        {/* Value-Added Services Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6 text-primary font-medium">
            <Info className="h-4 w-4" />
            <span>Value-Added Services (Available with any plan)</span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span>Trained attendants at home (12 or 24 hours)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span>Trained nurses at home (12 or 24 hours)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span>Trained physiotherapists</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span>Legal services (Wills, inheritance, Power of Attorney)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span>
                  Elder-specific travel packages:
                  <ul className="ml-6 mt-1">
                    <li className="text-sm">• Accompanied travel by trained attendants</li>
                    <li className="text-sm">• Travel insurance</li>
                  </ul>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span>Smart devices & monitors, doctor-recommended equipment</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-8 text-gray-600">
          <p>Custom plans available for more comprehensive care needs.</p>
          <p className="mt-1">Lock in these introductory rates for 12 months when you join our waitlist.</p>
        </div>
      </div>
    </section>
  )
}
