"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Copy, ArrowRight } from "lucide-react"
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
  const [referredBy, setReferredBy] = useState<string | null>(null)

  // Basic email validation function for client-side
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // CRITICAL FIX: Enhanced referral detection
  useEffect(() => {
    console.log("🔍 WaitlistForm: Checking for referral parameters...")

    // Method 1: Check URL parameters directly
    const urlParams = new URLSearchParams(window.location.search)
    const urlRef = urlParams.get("ref")

    // Method 2: Check localStorage
    const storedRef = localStorage.getItem("timesnri_referral")

    console.log("🔍 WaitlistForm referral sources:", {
      urlRef,
      storedRef,
      currentUrl: window.location.href,
    })

    // Priority: URL parameter > localStorage
    let finalRef: string | null = null

    if (urlRef && urlRef.trim()) {
      finalRef = urlRef.trim()
      console.log("✅ Using URL referral:", finalRef)
      // Update localStorage with URL parameter
      localStorage.setItem("timesnri_referral", finalRef)
    } else if (storedRef && storedRef.trim()) {
      finalRef = storedRef.trim()
      console.log("📦 Using stored referral:", finalRef)
    }

    if (finalRef) {
      setReferredBy(finalRef)
      console.log("🎯 WaitlistForm: Set referredBy to:", finalRef)
    } else {
      console.log("❌ WaitlistForm: No referral found")
      setReferredBy(null)
    }

    // Handle plan parameter
    const planParam = urlParams.get("plan")
    if (planParam && !preSelectedPlan) {
      const planMap: Record<string, string> = {
        peace: "Peace: $50/month",
        presence: "Presence: $200/month",
        honour: "Honour: $500/month (By Invitation Only)",
      }
      const mappedPlan = planMap[planParam]
      if (mappedPlan) {
        console.log("📋 WaitlistForm: Setting plan from URL:", mappedPlan)
        setCarePlan(mappedPlan)
      }
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

    console.log("📝 Form submission started with referral:", referredBy)

    if (isDetailed && step < 3) {
      console.log(`➡️ Moving to next step: ${step + 1}`)
      setStep(step + 1)
      return
    }

    setIsSubmitting(true)
    setFormMessage("")
    setFormError("")

    try {
      // Create FormData and append values
      const formData = new FormData()

      // Add all form fields
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

      // CRITICAL: Add referral with proper validation
      if (referredBy && referredBy.trim()) {
        console.log("✅ Adding referral to form submission:", referredBy)
        formData.append("referredBy", referredBy.trim())
      } else {
        console.log("❌ No referral to add to form submission")
      }

      // Log all form data for debugging
      console.log("📋 Form data being submitted:")
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`)
      }

      // Submit to server action
      const result = await submitToWaitlist(formData)
      console.log("📨 Server response:", result)

      if (result.success) {
        setIsSuccessOpen(true)
        await triggerConfetti()
        if (result.referralLink) {
          setReferralLink(result.referralLink)
        }

        // Reset form
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
        console.error("❌ Form submission failed:", result)
        setFormError(result.message || "Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("💥 Error submitting form:", error)
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

                    {/* Show referral info if present */}
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
                  </div>
                  {formError && <p className="text-sm text-red-500">{formError}</p>}
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (validateForm()) setStep(3)
                      }}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white h-12"
                      disabled={!parentLocation || !careNeeds}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-lg font-medium text-gray-800">Care Plan Interest</h3>
                  <div className="space-y-3">
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
                        <SelectItem value="Not sure yet">Not sure yet</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={carePlanInterest} onValueChange={setCarePlanInterest}>
                      <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                        <SelectValue placeholder="How soon would you like to start?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediately">Immediately</SelectItem>
                        <SelectItem value="1-3 months">Within 1-3 months</SelectItem>
                        <SelectItem value="3-6 months">Within 3-6 months</SelectItem>
                        <SelectItem value="6+ months">6+ months from now</SelectItem>
                        <SelectItem value="just exploring">Just exploring options</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formError && <p className="text-sm text-red-500">{formError}</p>}
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white h-12"
                    >
                      {isSubmitting ? "Joining..." : "Join Waitlist"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Success Dialog */}
        <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">Welcome to Times NRI!</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-gray-600">
                Thank you for joining our waitlist! We'll keep you updated on our launch progress.
              </p>
              {formMessage && <p className="text-sm font-medium text-green-600">{formMessage}</p>}
              {referralLink && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Share Times NRI with others:</p>
                  <div className="flex gap-2">
                    <Input value={referralLink} readOnly className="text-xs" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyReferralLink}
                      className="flex-shrink-0 bg-transparent"
                    >
                      {referralCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              <Button onClick={handleSuccessClose} className="w-full">
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Modal version (for popups)
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Our Waitlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show referral info if present */}
            {referredBy && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
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

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {includeNameField && (
                <Input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
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
                className="w-full"
              />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              {formMessage && <p className="text-sm text-green-500">{formMessage}</p>}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Joining..." : buttonText}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">Welcome to Times NRI!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-gray-600">
              Thank you for joining our waitlist! We'll keep you updated on our launch progress.
            </p>
            {formMessage && <p className="text-sm font-medium text-green-600">{formMessage}</p>}
            {referralLink && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Share Times NRI with others:</p>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="text-xs" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyReferralLink}
                    className="flex-shrink-0 bg-transparent"
                  >
                    {referralCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            <Button onClick={handleSuccessClose} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
