"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Copy, Share2, ArrowRight } from "lucide-react"
import { submitToWaitlist } from "@/app/actions/waitlist"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trackWaitlistSignup } from "@/lib/gtm-utils"
import { CarePlansComparison } from "@/components/care-plans-comparison"

interface WaitlistFormProps {
  buttonText?: string
  source?: string
  includeNameField?: boolean
  className?: string
  isDetailed?: boolean
  onClose?: () => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  standalone?: boolean
  preSelectedPlan?: string
}

export function WaitlistForm({
  buttonText = "Join the Waitlist",
  source = "main-form",
  includeNameField = true,
  className = "",
  isDetailed = false,
  onClose,
  isOpen = false,
  onOpenChange,
  standalone = false,
  preSelectedPlan,
}: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [parentLocation, setParentLocation] = useState("")
  const [careNeeds, setCareNeeds] = useState("")
  const [carePlan, setCarePlan] = useState(preSelectedPlan || "")
  const [step, setStep] = useState(1)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [referralCopied, setReferralCopied] = useState(false)
  const [formMessage, setFormMessage] = useState("")
  const [formError, setFormError] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const [carePlanInterest, setCarePlanInterest] = useState("")
  const [referredBy, setReferredBy] = useState<string | null>(null)
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)

  // Basic email validation function for client-side
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Check for referral in URL and plan parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const ref = urlParams.get("ref")
    const planParam = urlParams.get("plan")

    console.log("URL params detected:", { ref, planParam, currentUrl: window.location.href })

    // Set referral parameter with proper validation
    if (ref && ref.trim()) {
      const cleanRef = ref.trim()
      console.log("Setting referredBy to:", cleanRef)
      setReferredBy(cleanRef)
    } else {
      console.log("No valid referral parameter found")
      setReferredBy(null)
    }

    // Set plan based on preSelectedPlan prop first, then URL parameter
    if (preSelectedPlan) {
      setCarePlan(preSelectedPlan)
    } else if (planParam) {
      const planMap: Record<string, string> = {
        peace: "Peace: $50/month",
        presence: "Presence: $150/month",
        honour: "Honour: $500/month (By Invitation Only)",
      }
      setCarePlan(planMap[planParam] || "")
    }
  }, [preSelectedPlan])

  const triggerConfetti = async () => {
    // Only run in the browser
    if (typeof window === "undefined") return

    try {
      const { default: confetti } = await import("canvas-confetti")
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      // Optional mobile vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
    } catch (err) {
      // Silently ignore if the import fails (e.g. offline)
      console.error("Unable to load canvas-confetti:", err)
    }
  }

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    setReferralCopied(true)
    setTimeout(() => setReferralCopied(false), 2000)
  }

  const validateForm = (): boolean => {
    // Reset error messages
    setFormError("")

    // Validate email
    if (!email || !isValidEmail(email)) {
      setFormError("Please provide a valid email address.")
      return false
    }

    // If detailed form, validate required fields based on current step
    if (isDetailed) {
      if (step === 1 && (!name || !city)) {
        setFormError("Please fill in all required fields.")
        return false
      }

      if (step === 2 && (!parentLocation || !careNeeds)) {
        setFormError("Please fill in all required fields.")
        return false
      }
    } else if (includeNameField && !name) {
      setFormError("Please provide your name.")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("Form submission started")

    if (isDetailed && step < 3) {
      console.log(`Moving to next step: ${step + 1}`)
      setStep(step + 1)
      return
    }

    setIsSubmitting(true)
    setFormMessage("")
    setFormError("")

    try {
      // Create FormData and append values
      const formData = new FormData()

      // Manually add form fields to ensure they're included
      formData.append("email", email)
      formData.append("name", name)
      formData.append("source", source)

      if (isDetailed) {
        formData.append("city", city)
        formData.append("parentLocation", parentLocation)
        formData.append("careNeeds", careNeeds)
        if (carePlan) {
          formData.append("carePlan", carePlan)
        }
        if (carePlanInterest) {
          formData.append("carePlanInterest", carePlanInterest)
        }
      }

      // Fixed: Simplified referral handling - use state value directly
      if (referredBy) {
        console.log("Adding referredBy to form data:", referredBy)
        formData.append("referredBy", referredBy)
      } else {
        console.log("No referral to add to form data")
      }

      console.log("Submitting form with data:", {
        email,
        name,
        city,
        parentLocation,
        careNeeds,
        carePlan,
        source,
        referredBy,
      })

      // Submit to server action
      const result = await submitToWaitlist(formData)
      console.log("Server response:", result)

      if (result.success) {
        // Track the conversion with Google Tag Manager
        trackWaitlistSignup({
          email,
          name,
          source,
          city,
          parentLocation,
          careNeeds: careNeeds ? [careNeeds] : [],
          carePlanInterest,
          referralCode: referredBy || undefined,
        })

        setIsSuccessOpen(true)
        await triggerConfetti()
        if (result.referralLink) {
          setReferralLink(result.referralLink)
        }
        setEmail("")
        setName("")
        setCity("")
        setParentLocation("")
        setCareNeeds("")
        setCarePlan("")
        setCarePlanInterest("")
        setStep(1)

        // Show waitlist number if available
        if (result.waitlistNumber) {
          setFormMessage(`Your waitlist number is #${result.waitlistNumber}`)
        }
      } else {
        console.error("Form submission failed:", result)
        setFormError(result.message || "Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setFormError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false)
    }
    if (onClose) {
      onClose()
    }
  }

  const handleSuccessClose = () => {
    setIsSuccessOpen(false)
    if (!standalone) {
      handleClose()
    }
  }

  const handleSelectPlanFromComparison = (plan: string) => {
    // Map the plan names to the format used in the form
    const planMap: Record<string, string> = {
      Peace: "Peace: $50/month",
      Presence: "Presence: $150/month",
      Honour: "Honour: $500/month (By Invitation Only)",
    }
    setCarePlan(planMap[plan] || plan)
    setIsComparisonOpen(false)
  }

  // Standalone version (for dedicated waitlist page)
  if (standalone) {
    return (
      <div className="w-full">
        {/* Show referral info if present */}
        {referredBy && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">You were referred!</p>
                <p className="text-sm text-green-600">
                  Referred by: <span className="font-mono">{referredBy}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="w-full">
          {!isDetailed ? (
            <div className="space-y-4">
              {includeNameField && (
                <Input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                  required
                />
              )}
              <Input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
              />

              {/* Referral field - only show if there's a referral */}
              {referredBy && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Referred by</label>
                  <Input
                    type="text"
                    name="referredBy"
                    value={referredBy}
                    readOnly
                    className="w-full border-gray-300 bg-gray-50 text-gray-600 h-12"
                  />
                </div>
              )}

              {formError && <p className="text-sm text-red-500">{formError}</p>}
              {formMessage && <p className="text-sm text-green-500">{formMessage}</p>}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent/90 text-white h-12"
              >
                {isSubmitting ? "Joining..." : buttonText}
              </Button>
            </div>
          ) : (
            // Detailed form steps here
            <div>
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-lg font-medium text-gray-800">About You</h3>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                      required
                    />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                    />
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                        <SelectValue placeholder="Where are you based?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="canada">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <div className="border-t border-gray-200 my-1"></div>
                        <SelectItem value="afghanistan">Afghanistan</SelectItem>
                        <SelectItem value="albania">Albania</SelectItem>
                        <SelectItem value="algeria">Algeria</SelectItem>
                        <SelectItem value="andorra">Andorra</SelectItem>
                        <SelectItem value="angola">Angola</SelectItem>
                        <SelectItem value="argentina">Argentina</SelectItem>
                        <SelectItem value="armenia">Armenia</SelectItem>
                        <SelectItem value="australia">Australia</SelectItem>
                        <SelectItem value="austria">Austria</SelectItem>
                        <SelectItem value="azerbaijan">Azerbaijan</SelectItem>
                        <SelectItem value="bahamas">Bahamas</SelectItem>
                        <SelectItem value="bahrain">Bahrain</SelectItem>
                        <SelectItem value="bangladesh">Bangladesh</SelectItem>
                        <SelectItem value="barbados">Barbados</SelectItem>
                        <SelectItem value="belarus">Belarus</SelectItem>
                        <SelectItem value="belgium">Belgium</SelectItem>
                        <SelectItem value="belize">Belize</SelectItem>
                        <SelectItem value="benin">Benin</SelectItem>
                        <SelectItem value="bhutan">Bhutan</SelectItem>
                        <SelectItem value="bolivia">Bolivia</SelectItem>
                        <SelectItem value="bosnia">Bosnia and Herzegovina</SelectItem>
                        <SelectItem value="botswana">Botswana</SelectItem>
                        <SelectItem value="brazil">Brazil</SelectItem>
                        <SelectItem value="brunei">Brunei</SelectItem>
                        <SelectItem value="bulgaria">Bulgaria</SelectItem>
                        <SelectItem value="burkina">Burkina Faso</SelectItem>
                        <SelectItem value="burundi">Burundi</SelectItem>
                        <SelectItem value="cambodia">Cambodia</SelectItem>
                        <SelectItem value="cameroon">Cameroon</SelectItem>
                        <SelectItem value="cape-verde">Cape Verde</SelectItem>
                        <SelectItem value="chad">Chad</SelectItem>
                        <SelectItem value="chile">Chile</SelectItem>
                        <SelectItem value="china">China</SelectItem>
                        <SelectItem value="colombia">Colombia</SelectItem>
                        <SelectItem value="comoros">Comoros</SelectItem>
                        <SelectItem value="congo">Congo</SelectItem>
                        <SelectItem value="costa-rica">Costa Rica</SelectItem>
                        <SelectItem value="croatia">Croatia</SelectItem>
                        <SelectItem value="cuba">Cuba</SelectItem>
                        <SelectItem value="cyprus">Cyprus</SelectItem>
                        <SelectItem value="czech">Czech Republic</SelectItem>
                        <SelectItem value="denmark">Denmark</SelectItem>
                        <SelectItem value="djibouti">Djibouti</SelectItem>
                        <SelectItem value="dominica">Dominica</SelectItem>
                        <SelectItem value="dominican">Dominican Republic</SelectItem>
                        <SelectItem value="ecuador">Ecuador</SelectItem>
                        <SelectItem value="egypt">Egypt</SelectItem>
                        <SelectItem value="el-salvador">El Salvador</SelectItem>
                        <SelectItem value="estonia">Estonia</SelectItem>
                        <SelectItem value="eswatini">Eswatini</SelectItem>
                        <SelectItem value="ethiopia">Ethiopia</SelectItem>
                        <SelectItem value="fiji">Fiji</SelectItem>
                        <SelectItem value="finland">Finland</SelectItem>
                        <SelectItem value="france">France</SelectItem>
                        <SelectItem value="gabon">Gabon</SelectItem>
                        <SelectItem value="gambia">Gambia</SelectItem>
                        <SelectItem value="georgia">Georgia</SelectItem>
                        <SelectItem value="germany">Germany</SelectItem>
                        <SelectItem value="ghana">Ghana</SelectItem>
                        <SelectItem value="greece">Greece</SelectItem>
                        <SelectItem value="grenada">Grenada</SelectItem>
                        <SelectItem value="guatemala">Guatemala</SelectItem>
                        <SelectItem value="guinea">Guinea</SelectItem>
                        <SelectItem value="guyana">Guyana</SelectItem>
                        <SelectItem value="haiti">Haiti</SelectItem>
                        <SelectItem value="honduras">Honduras</SelectItem>
                        <SelectItem value="hungary">Hungary</SelectItem>
                        <SelectItem value="iceland">Iceland</SelectItem>
                        <SelectItem value="indonesia">Indonesia</SelectItem>
                        <SelectItem value="iran">Iran</SelectItem>
                        <SelectItem value="iraq">Iraq</SelectItem>
                        <SelectItem value="ireland">Ireland</SelectItem>
                        <SelectItem value="israel">Israel</SelectItem>
                        <SelectItem value="italy">Italy</SelectItem>
                        <SelectItem value="jamaica">Jamaica</SelectItem>
                        <SelectItem value="japan">Japan</SelectItem>
                        <SelectItem value="jordan">Jordan</SelectItem>
                        <SelectItem value="kazakhstan">Kazakhstan</SelectItem>
                        <SelectItem value="kenya">Kenya</SelectItem>
                        <SelectItem value="kiribati">Kiribati</SelectItem>
                        <SelectItem value="kuwait">Kuwait</SelectItem>
                        <SelectItem value="kyrgyzstan">Kyrgyzstan</SelectItem>
                        <SelectItem value="laos">Laos</SelectItem>
                        <SelectItem value="latvia">Latvia</SelectItem>
                        <SelectItem value="lebanon">Lebanon</SelectItem>
                        <SelectItem value="lesotho">Lesotho</SelectItem>
                        <SelectItem value="liberia">Liberia</SelectItem>
                        <SelectItem value="libya">Libya</SelectItem>
                        <SelectItem value="liechtenstein">Liechtenstein</SelectItem>
                        <SelectItem value="lithuania">Lithuania</SelectItem>
                        <SelectItem value="luxembourg">Luxembourg</SelectItem>
                        <SelectItem value="madagascar">Madagascar</SelectItem>
                        <SelectItem value="malawi">Malawi</SelectItem>
                        <SelectItem value="malaysia">Malaysia</SelectItem>
                        <SelectItem value="maldives">Maldives</SelectItem>
                        <SelectItem value="mali">Mali</SelectItem>
                        <SelectItem value="malta">Malta</SelectItem>
                        <SelectItem value="mauritania">Mauritania</SelectItem>
                        <SelectItem value="mauritius">Mauritius</SelectItem>
                        <SelectItem value="mexico">Mexico</SelectItem>
                        <SelectItem value="micronesia">Micronesia</SelectItem>
                        <SelectItem value="moldova">Moldova</SelectItem>
                        <SelectItem value="monaco">Monaco</SelectItem>
                        <SelectItem value="mongolia">Mongolia</SelectItem>
                        <SelectItem value="montenegro">Montenegro</SelectItem>
                        <SelectItem value="morocco">Morocco</SelectItem>
                        <SelectItem value="mozambique">Mozambique</SelectItem>
                        <SelectItem value="myanmar">Myanmar</SelectItem>
                        <SelectItem value="namibia">Namibia</SelectItem>
                        <SelectItem value="nauru">Nauru</SelectItem>
                        <SelectItem value="nepal">Nepal</SelectItem>
                        <SelectItem value="netherlands">Netherlands</SelectItem>
                        <SelectItem value="new-zealand">New Zealand</SelectItem>
                        <SelectItem value="nicaragua">Nicaragua</SelectItem>
                        <SelectItem value="niger">Niger</SelectItem>
                        <SelectItem value="nigeria">Nigeria</SelectItem>
                        <SelectItem value="north-korea">North Korea</SelectItem>
                        <SelectItem value="north-macedonia">North Macedonia</SelectItem>
                        <SelectItem value="norway">Norway</SelectItem>
                        <SelectItem value="oman">Oman</SelectItem>
                        <SelectItem value="pakistan">Pakistan</SelectItem>
                        <SelectItem value="palau">Palau</SelectItem>
                        <SelectItem value="panama">Panama</SelectItem>
                        <SelectItem value="papua-new-guinea">Papua New Guinea</SelectItem>
                        <SelectItem value="paraguay">Paraguay</SelectItem>
                        <SelectItem value="peru">Peru</SelectItem>
                        <SelectItem value="philippines">Philippines</SelectItem>
                        <SelectItem value="poland">Poland</SelectItem>
                        <SelectItem value="portugal">Portugal</SelectItem>
                        <SelectItem value="qatar">Qatar</SelectItem>
                        <SelectItem value="romania">Romania</SelectItem>
                        <SelectItem value="russia">Russia</SelectItem>
                        <SelectItem value="rwanda">Rwanda</SelectItem>
                        <SelectItem value="samoa">Samoa</SelectItem>
                        <SelectItem value="san-marino">San Marino</SelectItem>
                        <SelectItem value="saudi-arabia">Saudi Arabia</SelectItem>
                        <SelectItem value="senegal">Senegal</SelectItem>
                        <SelectItem value="serbia">Serbia</SelectItem>
                        <SelectItem value="seychelles">Seychelles</SelectItem>
                        <SelectItem value="sierra-leone">Sierra Leone</SelectItem>
                        <SelectItem value="singapore">Singapore</SelectItem>
                        <SelectItem value="slovakia">Slovakia</SelectItem>
                        <SelectItem value="slovenia">Slovenia</SelectItem>
                        <SelectItem value="solomon-islands">Solomon Islands</SelectItem>
                        <SelectItem value="somalia">Somalia</SelectItem>
                        <SelectItem value="south-africa">South Africa</SelectItem>
                        <SelectItem value="south-korea">South Korea</SelectItem>
                        <SelectItem value="south-sudan">South Sudan</SelectItem>
                        <SelectItem value="spain">Spain</SelectItem>
                        <SelectItem value="sri-lanka">Sri Lanka</SelectItem>
                        <SelectItem value="sudan">Sudan</SelectItem>
                        <SelectItem value="suriname">Suriname</SelectItem>
                        <SelectItem value="sweden">Sweden</SelectItem>
                        <SelectItem value="switzerland">Switzerland</SelectItem>
                        <SelectItem value="syria">Syria</SelectItem>
                        <SelectItem value="taiwan">Taiwan</SelectItem>
                        <SelectItem value="tajikistan">Tajikistan</SelectItem>
                        <SelectItem value="tanzania">Tanzania</SelectItem>
                        <SelectItem value="thailand">Thailand</SelectItem>
                        <SelectItem value="timor-leste">Timor-Leste</SelectItem>
                        <SelectItem value="togo">Togo</SelectItem>
                        <SelectItem value="tonga">Tonga</SelectItem>
                        <SelectItem value="trinidad">Trinidad and Tobago</SelectItem>
                        <SelectItem value="tunisia">Tunisia</SelectItem>
                        <SelectItem value="turkey">Turkey</SelectItem>
                        <SelectItem value="turkmenistan">Turkmenistan</SelectItem>
                        <SelectItem value="tuvalu">Tuvalu</SelectItem>
                        <SelectItem value="uganda">Uganda</SelectItem>
                        <SelectItem value="ukraine">Ukraine</SelectItem>
                        <SelectItem value="uae">United Arab Emirates</SelectItem>
                        <SelectItem value="uruguay">Uruguay</SelectItem>
                        <SelectItem value="uzbekistan">Uzbekistan</SelectItem>
                        <SelectItem value="vanuatu">Vanuatu</SelectItem>
                        <SelectItem value="vatican">Vatican City</SelectItem>
                        <SelectItem value="venezuela">Venezuela</SelectItem>
                        <SelectItem value="vietnam">Vietnam</SelectItem>
                        <SelectItem value="yemen">Yemen</SelectItem>
                        <SelectItem value="zambia">Zambia</SelectItem>
                        <SelectItem value="zimbabwe">Zimbabwe</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Referral field - only show if there's a referral */}
                    {referredBy && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Referred by</label>
                        <Input
                          type="text"
                          name="referredBy"
                          value={referredBy}
                          readOnly
                          className="w-full border-gray-300 bg-gray-50 text-gray-600 h-12"
                        />
                      </div>
                    )}
                  </div>
                  {formError && <p className="text-sm text-red-500">{formError}</p>}
                  <Button
                    type="button"
                    onClick={() => {
                      if (validateForm()) setStep(2)
                    }}
                    className="w-full bg-accent hover:bg-accent/90 text-white mt-2 flex items-center justify-center h-12"
                    disabled={!name || !email || !city}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-lg font-medium text-gray-800">About Your Parents</h3>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      name="parentLocation"
                      placeholder="Where are your parents located? (City, State/Country)"
                      value={parentLocation}
                      onChange={(e) => setParentLocation(e.target.value)}
                      className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                      required
                    />
                    <Select value={careNeeds} onValueChange={setCareNeeds}>
                      <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                        <SelectValue placeholder="What type of care do they need?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular check-ins</SelectItem>
                        <SelectItem value="medical">Medical appointment assistance</SelectItem>
                        <SelectItem value="daily">Daily living assistance</SelectItem>
                        <SelectItem value="emergency">Emergency support</SelectItem>
                        <SelectItem value="all">All of the above</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={carePlan} onValueChange={setCarePlan}>
                      <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                        <SelectValue placeholder="Which care plan interests you?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Peace: $50/month">Peace: $50/month</SelectItem>
                        <SelectItem value="Presence: $150/month">Presence: $150/month</SelectItem>
                        <SelectItem value="Honour: $500/month (By Invitation Only)">
                          Honour: $500/month (By Invitation Only)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => setIsComparisonOpen(true)}
                      className="text-sm text-accent hover:text-accent/80 underline"
                    >
                      Compare all plans
                    </button>
                    {carePlan && (
                      <div className="space-y-2">
                        <label htmlFor="carePlanInterest" className="block text-sm font-medium text-gray-700">
                          What interests you about the {carePlan.split(":")[0]} plan?
                        </label>
                        <textarea
                          id="carePlanInterest"
                          name="carePlanInterest"
                          placeholder="Tell us what drew you to this plan or any specific needs you have..."
                          value={carePlanInterest}
                          onChange={(e) => setCarePlanInterest(e.target.value)}
                          className="w-full border border-gray-300 focus:border-accent focus:ring-accent rounded-md p-3 min-h-[80px] resize-none"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                  {formError && <p className="text-sm text-red-500">{formError}</p>}
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 h-12"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (validateForm()) setStep(3)
                      }}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white flex items-center justify-center h-12"
                      disabled={!parentLocation || !careNeeds}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-lg font-medium text-gray-800">Confirm Your Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Name:</span> {name}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {email}
                    </p>
                    <p>
                      <span className="font-medium">Your location:</span> {city}
                    </p>
                    <p>
                      <span className="font-medium">Parents' location:</span> {parentLocation}
                    </p>
                    <p>
                      <span className="font-medium">Care needs:</span> {careNeeds}
                    </p>
                    {carePlan && (
                      <p>
                        <span className="font-medium">Interested in:</span> {carePlan}
                      </p>
                    )}
                    {carePlanInterest && (
                      <p>
                        <span className="font-medium">Interest in plan:</span> {carePlanInterest}
                      </p>
                    )}
                    {referredBy && (
                      <p>
                        <span className="font-medium">Referred by:</span>{" "}
                        <span className="font-mono">{referredBy}</span>
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    By joining our waitlist, you'll be among the first to know when we launch in your parents' city.
                    We'll also send you resources on senior care in India.
                  </p>
                  {formError && <p className="text-sm text-red-500">{formError}</p>}
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 h-12"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white h-12"
                    >
                      {isSubmitting ? "Submitting..." : "Join Waitlist"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Comparison Dialog for standalone mode */}
        <Dialog open={isComparisonOpen} onOpenChange={setIsComparisonOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <CarePlansComparison
              onClose={() => setIsComparisonOpen(false)}
              onSelectPlan={handleSelectPlanFromComparison}
            />
          </DialogContent>
        </Dialog>

        {/* Success message for standalone mode */}
        {isSuccessOpen && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="rounded-full bg-green-100 p-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800">You're on the list!</h3>
              <p className="text-green-700">
                {isDetailed ? `Thank you for sharing your needs with us.` : `We'll reach out when your city is live.`}
              </p>
              {isDetailed && (
                <p className="text-sm text-green-600">
                  We'll be in touch soon with personalized information about our services in {parentLocation}.
                </p>
              )}

              {referralLink && (
                <div className="w-full space-y-3 mt-4 pt-4 border-t border-green-200">
                  <p className="font-medium text-green-800">Want priority access?</p>
                  <p className="text-sm text-green-600">Share with other NRIs who might need our help.</p>
                  <div className="flex items-center space-x-2 rounded-md border border-green-300 p-2 bg-white">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm outline-none p-2"
                    />
                    <Button size="sm" variant="ghost" onClick={copyReferralLink} className="h-10 w-10 p-2">
                      {referralCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1 h-12 px-4 border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                      onClick={() => {
                        window.open(
                          `https://wa.me/?text=I just joined the Times NRI waitlist for senior care services in India. As an NRI, I found this service really promising for managing parent care from abroad: ${referralLink}`,
                          "_blank",
                        )
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Modal version (existing code)
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" aria-describedby="waitlist-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Join Our Waitlist</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p id="waitlist-dialog-description" className="text-center mb-6 text-gray-600">
              Be among the first to access our Senior Care & Wellness Membership when we launch in your city.
            </p>

            {/* Show referral info if present */}
            {referredBy && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">You were referred!</p>
                    <p className="text-xs text-green-600">
                      By: <span className="font-mono">{referredBy}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="w-full">
              {!isDetailed ? (
                <div className="space-y-4">
                  {includeNameField && (
                    <Input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                      required
                    />
                  )}
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                  />

                  {/* Referral field - only show if there's a referral */}
                  {referredBy && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Referred by</label>
                      <Input
                        type="text"
                        name="referredBy"
                        value={referredBy}
                        readOnly
                        className="w-full border-gray-300 bg-gray-50 text-gray-600 h-12"
                      />
                    </div>
                  )}

                  {formError && <p className="text-sm text-red-500">{formError}</p>}
                  {formMessage && <p className="text-sm text-green-500">{formMessage}</p>}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-accent hover:bg-accent/90 text-white h-12"
                  >
                    {isSubmitting ? "Joining..." : buttonText}
                  </Button>
                </div>
              ) : (
                // Detailed form steps here (same as standalone version)
                <div>
                  {step === 1 && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-lg font-medium text-gray-800">About You</h3>
                      <div className="space-y-3">
                        <Input
                          type="text"
                          name="name"
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                          required
                        />
                        <Input
                          type="email"
                          name="email"
                          placeholder="Your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                        />
                        <Select value={city} onValueChange={setCity}>
                          <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                            <SelectValue placeholder="Where are you based?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="canada">Canada</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                            <div className="border-t border-gray-200 my-1"></div>
                            <SelectItem value="afghanistan">Afghanistan</SelectItem>
                            <SelectItem value="albania">Albania</SelectItem>
                            <SelectItem value="algeria">Algeria</SelectItem>
                            <SelectItem value="andorra">Andorra</SelectItem>
                            <SelectItem value="angola">Angola</SelectItem>
                            <SelectItem value="argentina">Argentina</SelectItem>
                            <SelectItem value="armenia">Armenia</SelectItem>
                            <SelectItem value="australia">Australia</SelectItem>
                            <SelectItem value="austria">Austria</SelectItem>
                            <SelectItem value="azerbaijan">Azerbaijan</SelectItem>
                            <SelectItem value="bahamas">Bahamas</SelectItem>
                            <SelectItem value="bahrain">Bahrain</SelectItem>
                            <SelectItem value="bangladesh">Bangladesh</SelectItem>
                            <SelectItem value="barbados">Barbados</SelectItem>
                            <SelectItem value="belarus">Belarus</SelectItem>
                            <SelectItem value="belgium">Belgium</SelectItem>
                            <SelectItem value="belize">Belize</SelectItem>
                            <SelectItem value="benin">Benin</SelectItem>
                            <SelectItem value="bhutan">Bhutan</SelectItem>
                            <SelectItem value="bolivia">Bolivia</SelectItem>
                            <SelectItem value="bosnia">Bosnia and Herzegovina</SelectItem>
                            <SelectItem value="botswana">Botswana</SelectItem>
                            <SelectItem value="brazil">Brazil</SelectItem>
                            <SelectItem value="brunei">Brunei</SelectItem>
                            <SelectItem value="bulgaria">Bulgaria</SelectItem>
                            <SelectItem value="burkina">Burkina Faso</SelectItem>
                            <SelectItem value="burundi">Burundi</SelectItem>
                            <SelectItem value="cambodia">Cambodia</SelectItem>
                            <SelectItem value="cameroon">Cameroon</SelectItem>
                            <SelectItem value="cape-verde">Cape Verde</SelectItem>
                            <SelectItem value="chad">Chad</SelectItem>
                            <SelectItem value="chile">Chile</SelectItem>
                            <SelectItem value="china">China</SelectItem>
                            <SelectItem value="colombia">Colombia</SelectItem>
                            <SelectItem value="comoros">Comoros</SelectItem>
                            <SelectItem value="congo">Congo</SelectItem>
                            <SelectItem value="costa-rica">Costa Rica</SelectItem>
                            <SelectItem value="croatia">Croatia</SelectItem>
                            <SelectItem value="cuba">Cuba</SelectItem>
                            <SelectItem value="cyprus">Cyprus</SelectItem>
                            <SelectItem value="czech">Czech Republic</SelectItem>
                            <SelectItem value="denmark">Denmark</SelectItem>
                            <SelectItem value="djibouti">Djibouti</SelectItem>
                            <SelectItem value="dominica">Dominica</SelectItem>
                            <SelectItem value="dominican">Dominican Republic</SelectItem>
                            <SelectItem value="ecuador">Ecuador</SelectItem>
                            <SelectItem value="egypt">Egypt</SelectItem>
                            <SelectItem value="el-salvador">El Salvador</SelectItem>
                            <SelectItem value="estonia">Estonia</SelectItem>
                            <SelectItem value="eswatini">Eswatini</SelectItem>
                            <SelectItem value="ethiopia">Ethiopia</SelectItem>
                            <SelectItem value="fiji">Fiji</SelectItem>
                            <SelectItem value="finland">Finland</SelectItem>
                            <SelectItem value="france">France</SelectItem>
                            <SelectItem value="gabon">Gabon</SelectItem>
                            <SelectItem value="gambia">Gambia</SelectItem>
                            <SelectItem value="georgia">Georgia</SelectItem>
                            <SelectItem value="germany">Germany</SelectItem>
                            <SelectItem value="ghana">Ghana</SelectItem>
                            <SelectItem value="greece">Greece</SelectItem>
                            <SelectItem value="grenada">Grenada</SelectItem>
                            <SelectItem value="guatemala">Guatemala</SelectItem>
                            <SelectItem value="guinea">Guinea</SelectItem>
                            <SelectItem value="guyana">Guyana</SelectItem>
                            <SelectItem value="haiti">Haiti</SelectItem>
                            <SelectItem value="honduras">Honduras</SelectItem>
                            <SelectItem value="hungary">Hungary</SelectItem>
                            <SelectItem value="iceland">Iceland</SelectItem>
                            <SelectItem value="indonesia">Indonesia</SelectItem>
                            <SelectItem value="iran">Iran</SelectItem>
                            <SelectItem value="iraq">Iraq</SelectItem>
                            <SelectItem value="ireland">Ireland</SelectItem>
                            <SelectItem value="israel">Israel</SelectItem>
                            <SelectItem value="italy">Italy</SelectItem>
                            <SelectItem value="jamaica">Jamaica</SelectItem>
                            <SelectItem value="japan">Japan</SelectItem>
                            <SelectItem value="jordan">Jordan</SelectItem>
                            <SelectItem value="kazakhstan">Kazakhstan</SelectItem>
                            <SelectItem value="kenya">Kenya</SelectItem>
                            <SelectItem value="kiribati">Kiribati</SelectItem>
                            <SelectItem value="kuwait">Kuwait</SelectItem>
                            <SelectItem value="kyrgyzstan">Kyrgyzstan</SelectItem>
                            <SelectItem value="laos">Laos</SelectItem>
                            <SelectItem value="latvia">Latvia</SelectItem>
                            <SelectItem value="lebanon">Lebanon</SelectItem>
                            <SelectItem value="lesotho">Lesotho</SelectItem>
                            <SelectItem value="liberia">Liberia</SelectItem>
                            <SelectItem value="libya">Libya</SelectItem>
                            <SelectItem value="liechtenstein">Liechtenstein</SelectItem>
                            <SelectItem value="lithuania">Lithuania</SelectItem>
                            <SelectItem value="luxembourg">Luxembourg</SelectItem>
                            <SelectItem value="madagascar">Madagascar</SelectItem>
                            <SelectItem value="malawi">Malawi</SelectItem>
                            <SelectItem value="malaysia">Malaysia</SelectItem>
                            <SelectItem value="maldives">Maldives</SelectItem>
                            <SelectItem value="mali">Mali</SelectItem>
                            <SelectItem value="malta">Malta</SelectItem>
                            <SelectItem value="mauritania">Mauritania</SelectItem>
                            <SelectItem value="mauritius">Mauritius</SelectItem>
                            <SelectItem value="mexico">Mexico</SelectItem>
                            <SelectItem value="micronesia">Micronesia</SelectItem>
                            <SelectItem value="moldova">Moldova</SelectItem>
                            <SelectItem value="monaco">Monaco</SelectItem>
                            <SelectItem value="mongolia">Mongolia</SelectItem>
                            <SelectItem value="montenegro">Montenegro</SelectItem>
                            <SelectItem value="morocco">Morocco</SelectItem>
                            <SelectItem value="mozambique">Mozambique</SelectItem>
                            <SelectItem value="myanmar">Myanmar</SelectItem>
                            <SelectItem value="namibia">Namibia</SelectItem>
                            <SelectItem value="nauru">Nauru</SelectItem>
                            <SelectItem value="nepal">Nepal</SelectItem>
                            <SelectItem value="netherlands">Netherlands</SelectItem>
                            <SelectItem value="new-zealand">New Zealand</SelectItem>
                            <SelectItem value="nicaragua">Nicaragua</SelectItem>
                            <SelectItem value="niger">Niger</SelectItem>
                            <SelectItem value="nigeria">Nigeria</SelectItem>
                            <SelectItem value="north-korea">North Korea</SelectItem>
                            <SelectItem value="north-macedonia">North Macedonia</SelectItem>
                            <SelectItem value="norway">Norway</SelectItem>
                            <SelectItem value="oman">Oman</SelectItem>
                            <SelectItem value="pakistan">Pakistan</SelectItem>
                            <SelectItem value="palau">Palau</SelectItem>
                            <SelectItem value="panama">Panama</SelectItem>
                            <SelectItem value="papua-new-guinea">Papua New Guinea</SelectItem>
                            <SelectItem value="paraguay">Paraguay</SelectItem>
                            <SelectItem value="peru">Peru</SelectItem>
                            <SelectItem value="philippines">Philippines</SelectItem>
                            <SelectItem value="poland">Poland</SelectItem>
                            <SelectItem value="portugal">Portugal</SelectItem>
                            <SelectItem value="qatar">Qatar</SelectItem>
                            <SelectItem value="romania">Romania</SelectItem>
                            <SelectItem value="russia">Russia</SelectItem>
                            <SelectItem value="rwanda">Rwanda</SelectItem>
                            <SelectItem value="samoa">Samoa</SelectItem>
                            <SelectItem value="san-marino">San Marino</SelectItem>
                            <SelectItem value="saudi-arabia">Saudi Arabia</SelectItem>
                            <SelectItem value="senegal">Senegal</SelectItem>
                            <SelectItem value="serbia">Serbia</SelectItem>
                            <SelectItem value="seychelles">Seychelles</SelectItem>
                            <SelectItem value="sierra-leone">Sierra Leone</SelectItem>
                            <SelectItem value="singapore">Singapore</SelectItem>
                            <SelectItem value="slovakia">Slovakia</SelectItem>
                            <SelectItem value="slovenia">Slovenia</SelectItem>
                            <SelectItem value="solomon-islands">Solomon Islands</SelectItem>
                            <SelectItem value="somalia">Somalia</SelectItem>
                            <SelectItem value="south-africa">South Africa</SelectItem>
                            <SelectItem value="south-korea">South Korea</SelectItem>
                            <SelectItem value="south-sudan">South Sudan</SelectItem>
                            <SelectItem value="spain">Spain</SelectItem>
                            <SelectItem value="sri-lanka">Sri Lanka</SelectItem>
                            <SelectItem value="sudan">Sudan</SelectItem>
                            <SelectItem value="suriname">Suriname</SelectItem>
                            <SelectItem value="sweden">Sweden</SelectItem>
                            <SelectItem value="switzerland">Switzerland</SelectItem>
                            <SelectItem value="syria">Syria</SelectItem>
                            <SelectItem value="taiwan">Taiwan</SelectItem>
                            <SelectItem value="tajikistan">Tajikistan</SelectItem>
                            <SelectItem value="tanzania">Tanzania</SelectItem>
                            <SelectItem value="thailand">Thailand</SelectItem>
                            <SelectItem value="timor-leste">Timor-Leste</SelectItem>
                            <SelectItem value="togo">Togo</SelectItem>
                            <SelectItem value="tonga">Tonga</SelectItem>
                            <SelectItem value="trinidad">Trinidad and Tobago</SelectItem>
                            <SelectItem value="tunisia">Tunisia</SelectItem>
                            <SelectItem value="turkey">Turkey</SelectItem>
                            <SelectItem value="turkmenistan">Turkmenistan</SelectItem>
                            <SelectItem value="tuvalu">Tuvalu</SelectItem>
                            <SelectItem value="uganda">Uganda</SelectItem>
                            <SelectItem value="ukraine">Ukraine</SelectItem>
                            <SelectItem value="uae">United Arab Emirates</SelectItem>
                            <SelectItem value="uruguay">Uruguay</SelectItem>
                            <SelectItem value="uzbekistan">Uzbekistan</SelectItem>
                            <SelectItem value="vanuatu">Vanuatu</SelectItem>
                            <SelectItem value="vatican">Vatican City</SelectItem>
                            <SelectItem value="venezuela">Venezuela</SelectItem>
                            <SelectItem value="vietnam">Vietnam</SelectItem>
                            <SelectItem value="yemen">Yemen</SelectItem>
                            <SelectItem value="zambia">Zambia</SelectItem>
                            <SelectItem value="zimbabwe">Zimbabwe</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Referral field - only show if there's a referral */}
                        {referredBy && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Referred by</label>
                            <Input
                              type="text"
                              name="referredBy"
                              value={referredBy}
                              readOnly
                              className="w-full border-gray-300 bg-gray-50 text-gray-600 h-12"
                            />
                          </div>
                        )}
                      </div>
                      {formError && <p className="text-sm text-red-500">{formError}</p>}
                      <Button
                        type="button"
                        onClick={() => {
                          if (validateForm()) setStep(2)
                        }}
                        className="w-full bg-accent hover:bg-accent/90 text-white mt-2 flex items-center justify-center h-12"
                        disabled={!name || !email || !city}
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-lg font-medium text-gray-800">About Your Parents</h3>
                      <div className="space-y-3">
                        <Input
                          type="text"
                          name="parentLocation"
                          placeholder="Where are your parents located? (City, State/Country)"
                          value={parentLocation}
                          onChange={(e) => setParentLocation(e.target.value)}
                          className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                          required
                        />
                        <Select value={careNeeds} onValueChange={setCareNeeds}>
                          <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                            <SelectValue placeholder="What type of care do they need?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular check-ins</SelectItem>
                            <SelectItem value="medical">Medical appointment assistance</SelectItem>
                            <SelectItem value="daily">Daily living assistance</SelectItem>
                            <SelectItem value="emergency">Emergency support</SelectItem>
                            <SelectItem value="all">All of the above</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={carePlan} onValueChange={setCarePlan}>
                          <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                            <SelectValue placeholder="Which care plan interests you?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Peace: $50/month">Peace: $50/month</SelectItem>
                            <SelectItem value="Presence: $150/month">Presence: $150/month</SelectItem>
                            <SelectItem value="Honour: $500/month (By Invitation Only)">
                              Honour: $500/month (By Invitation Only)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => setIsComparisonOpen(true)}
                          className="text-sm text-accent hover:text-accent/80 underline"
                        >
                          Compare all plans
                        </button>
                        {carePlan && (
                          <div className="space-y-2">
                            <label htmlFor="carePlanInterest" className="block text-sm font-medium text-gray-700">
                              What interests you about the {carePlan.split(":")[0]} plan?
                            </label>
                            <textarea
                              id="carePlanInterest"
                              name="carePlanInterest"
                              placeholder="Tell us what drew you to this plan or any specific needs you have..."
                              value={carePlanInterest}
                              onChange={(e) => setCarePlanInterest(e.target.value)}
                              className="w-full border border-gray-300 focus:border-accent focus:ring-accent rounded-md p-3 min-h-[80px] resize-none"
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                      {formError && <p className="text-sm text-red-500">{formError}</p>}
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 h-12"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            if (validateForm()) setStep(3)
                          }}
                          className="flex-1 bg-accent hover:bg-accent/90 text-white flex items-center justify-center h-12"
                          disabled={!parentLocation || !careNeeds}
                        >
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-lg font-medium text-gray-800">Confirm Your Details</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Name:</span> {name}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span> {email}
                        </p>
                        <p>
                          <span className="font-medium">Your location:</span> {city}
                        </p>
                        <p>
                          <span className="font-medium">Parents' location:</span> {parentLocation}
                        </p>
                        <p>
                          <span className="font-medium">Care needs:</span> {careNeeds}
                        </p>
                        {carePlan && (
                          <p>
                            <span className="font-medium">Interested in:</span> {carePlan}
                          </p>
                        )}
                        {carePlanInterest && (
                          <p>
                            <span className="font-medium">Interest in plan:</span> {carePlanInterest}
                          </p>
                        )}
                        {referredBy && (
                          <p>
                            <span className="font-medium">Referred by:</span>{" "}
                            <span className="font-mono">{referredBy}</span>
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        By joining our waitlist, you'll be among the first to know when we launch in your parents' city.
                        We'll also send you resources on senior care in India.
                      </p>
                      {formError && <p className="text-sm text-red-500">{formError}</p>}
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          onClick={() => setStep(2)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 h-12"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-accent hover:bg-accent/90 text-white h-12"
                        >
                          {isSubmitting ? "Submitting..." : "Join Waitlist"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comparison Dialog for modal version */}
      <Dialog open={isComparisonOpen} onOpenChange={setIsComparisonOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <CarePlansComparison
            onClose={() => setIsComparisonOpen(false)}
            onSelectPlan={handleSelectPlanFromComparison}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={handleSuccessClose}>
        <DialogContent className="sm:max-w-md" aria-describedby="waitlist-success-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">You're on the list!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="rounded-full bg-green-100 p-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p id="waitlist-success-dialog-description" className="text-center text-lg">
              {isDetailed ? `Thank you for sharing your needs with us.` : `We'll reach out when your city is live.`}
            </p>
            {isDetailed && (
              <p className="text-center text-sm text-gray-600">
                We'll be in touch soon with personalized information about our services in {parentLocation}.
              </p>
            )}

            {referralLink && (
              <div className="w-full space-y-3 mt-4 pt-4 border-t border-gray-100">
                <p className="text-center font-medium">Want priority access?</p>
                <p className="text-center text-sm text-gray-600">Share with other NRIs who might need our help.</p>
                <div className="flex items-center space-x-2 rounded-md border p-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-transparent text-sm outline-none p-2"
                  />
                  <Button size="sm" variant="ghost" onClick={copyReferralLink} className="h-10 w-10 p-2">
                    {referralCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex justify-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1 h-12 px-4 bg-transparent"
                    onClick={() => {
                      window.open(
                        `https://wa.me/?text=I just joined the Times NRI waitlist for senior care services in India. As an NRI, I found this service really promising for managing parent care from abroad: ${referralLink}`,
                        "_blank",
                      )
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </Button>
                </div>
              </div>
            )}

            <Button className="mt-4 bg-primary h-12 px-6" onClick={handleSuccessClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default WaitlistForm
