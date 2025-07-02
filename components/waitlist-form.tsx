"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Copy, Share2, ArrowRight } from "lucide-react"
import { submitToWaitlist } from "@/app/actions/waitlist"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  // Fixed: Use string | null for clearer state management
  const [referredBy, setReferredBy] = useState<string | null>(null)

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
        presence: "Presence: $200/month",
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
                        <SelectItem value="australia">Australia</SelectItem>
                        <SelectItem value="singapore">Singapore</SelectItem>
                        <SelectItem value="uae">UAE</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                    <Select value={parentLocation} onValueChange={setParentLocation}>
                      <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                        <SelectValue placeholder="Where are your parents located?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delhi">Delhi NCR</SelectItem>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                        <SelectItem value="kolkata">Kolkata</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="hyderabad">Hyderabad</SelectItem>
                        <SelectItem value="pune">Pune</SelectItem>
                        <SelectItem value="ahmedabad">Ahmedabad</SelectItem>
                        <SelectItem value="surat">Surat</SelectItem>
                        <SelectItem value="chandigarh">Chandigarh</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="Presence: $200/month">Presence: $200/month</SelectItem>
                        <SelectItem value="Honour: $500/month (By Invitation Only)">
                          Honour: $500/month (By Invitation Only)
                        </SelectItem>
                      </SelectContent>
                    </Select>
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

        {/* Success message for standalone mode */}
        {isSuccessOpen && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex flex-col items-center text-center space-y-4">
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
                            <SelectItem value="australia">Australia</SelectItem>
                            <SelectItem value="singapore">Singapore</SelectItem>
                            <SelectItem value="uae">UAE</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
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
                        <Select value={parentLocation} onValueChange={setParentLocation}>
                          <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                            <SelectValue placeholder="Where are your parents located?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="delhi">Delhi NCR</SelectItem>
                            <SelectItem value="mumbai">Mumbai</SelectItem>
                            <SelectItem value="chennai">Chennai</SelectItem>
                            <SelectItem value="kolkata">Kolkata</SelectItem>
                            <SelectItem value="bangalore">Bangalore</SelectItem>
                            <SelectItem value="hyderabad">Hyderabad</SelectItem>
                            <SelectItem value="pune">Pune</SelectItem>
                            <SelectItem value="ahmedabad">Ahmedabad</SelectItem>
                            <SelectItem value="surat">Surat</SelectItem>
                            <SelectItem value="chandigarh">Chandigarh</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="Presence: $200/month">Presence: $200/month</SelectItem>
                            <SelectItem value="Honour: $500/month (By Invitation Only)">
                              Honour: $500/month (By Invitation Only)
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
