"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Copy, Share2, ArrowRight } from "lucide-react"
import confetti from "canvas-confetti"
import { submitToWaitlist } from "@/app/actions/waitlist"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WaitlistFormProps {
  buttonText?: string
  source?: string
  includeNameField?: boolean
  className?: string
  isDetailed?: boolean
}

export function WaitlistForm({
  buttonText = "Join the Waitlist",
  source = "main-form",
  includeNameField = true,
  className = "",
  isDetailed = false,
}: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [parentLocation, setParentLocation] = useState("")
  const [careNeeds, setCareNeeds] = useState("")
  const [step, setStep] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [referralCopied, setReferralCopied] = useState(false)
  const [formMessage, setFormMessage] = useState("")
  const [formError, setFormError] = useState("")
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Basic email validation function for client-side
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Check for referral in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const ref = urlParams.get("ref")
    if (ref) {
      // Store the referrer in localStorage
      localStorage.setItem("referredBy", ref)
    }
  }, [])

  const triggerConfetti = () => {
    if (typeof window !== "undefined") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      // Optional: vibration for mobile
      if (navigator.vibrate) {
        navigator.vibrate(100)
      }
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
      // Get referrer from localStorage if exists
      const referredBy = localStorage.getItem("referredBy")

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
      }

      if (referredBy) {
        formData.append("referredBy", referredBy)
      }

      console.log("Submitting form with data:", {
        email,
        name,
        city,
        parentLocation,
        careNeeds,
        source,
        referredBy,
      })

      // Submit to server action
      const result = await submitToWaitlist(formData)
      console.log("Server response:", result)

      if (result.success) {
        setIsOpen(true)
        if (result.referralLink) {
          setReferralLink(result.referralLink)
        }
        triggerConfetti()
        setEmail("")
        setName("")
        setCity("")
        setParentLocation("")
        setCareNeeds("")
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

  if (!isDetailed) {
    return (
      <>
        <form ref={formRef} onSubmit={handleSubmit} className={`flex w-full max-w-sm flex-col space-y-2 ${className}`}>
          {includeNameField && (
            <Input
              type="text"
              name="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border-gray-300 focus:border-accent focus:ring-accent h-12" // Increased height for touch
              required
            />
          )}
          <div className="flex space-x-2">
            <Input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 border-gray-300 focus:border-accent focus:ring-accent h-12" // Increased height for touch
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent hover:bg-accent/90 text-white h-12 px-6" // Increased touch target
            >
              {isSubmitting ? "Joining..." : buttonText}
            </Button>
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          {formMessage && <p className="text-sm text-green-500">{formMessage}</p>}
        </form>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md" aria-describedby="waitlist-success-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">You're on the list!</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="rounded-full bg-green-100 p-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p id="waitlist-success-dialog-description" className="text-center text-lg">
                We'll reach out when your city is live.
              </p>

              {referralLink && (
                <div className="w-full space-y-3">
                  <p className="text-center">Want priority access? Refer 3 friends.</p>
                  <div className="flex items-center space-x-2 rounded-md border p-2">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm outline-none p-2" // Added padding
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyReferralLink}
                      className="h-10 w-10 p-2" // Increased touch target
                    >
                      {referralCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1 h-12 px-4" // Increased touch target
                      onClick={() => {
                        window.open(
                          `https://wa.me/?text=I'm joining the Times NRI waitlist for elderly care services in India. Join me: ${referralLink}`,
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

              <p className="text-sm text-gray-500">Email: {email}</p>
              <Button className="mt-4 bg-primary h-12 px-6" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Detailed multi-step form
  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className={`w-full ${className}`}>
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
                className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12" // Increased height for touch
                required
              />
              <Input
                type="email"
                name="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12" // Increased height for touch
              />
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                  {" "}
                  {/* Increased height for touch */}
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
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <Button
              type="button"
              onClick={() => {
                if (validateForm()) setStep(2)
              }}
              className="w-full bg-accent hover:bg-accent/90 text-white mt-2 flex items-center justify-center h-12" // Increased height for touch
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
                  {" "}
                  {/* Increased height for touch */}
                  <SelectValue placeholder="Where are your parents located?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delhi">Delhi NCR</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="pune">Pune</SelectItem>
                  <SelectItem value="chennai">Chennai</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={careNeeds} onValueChange={setCareNeeds}>
                <SelectTrigger className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12">
                  {" "}
                  {/* Increased height for touch */}
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
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 h-12" // Increased height for touch
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (validateForm()) setStep(3)
                }}
                className="flex-1 bg-accent hover:bg-accent/90 text-white flex items-center justify-center h-12" // Increased height for touch
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
            </div>
            <p className="text-xs text-gray-500">
              By joining our waitlist, you'll be among the first to know when we launch in your parents' city. We'll
              also send you resources on elderly care in India.
            </p>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 h-12" // Increased height for touch
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-accent hover:bg-accent/90 text-white h-12" // Increased height for touch
              >
                {isSubmitting ? "Submitting..." : "Join Waitlist"}
              </Button>
            </div>
          </div>
        )}

        {formMessage && <p className="text-sm text-green-500 mt-2">{formMessage}</p>}
      </form>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="waitlist-success-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">You're on the list!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="rounded-full bg-green-100 p-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p id="waitlist-success-dialog-description" className="text-center text-lg">
              Thank you for sharing your needs with us.
            </p>
            <p className="text-center text-sm text-gray-600">
              We'll be in touch soon with personalized information about our services in {parentLocation}.
            </p>

            {referralLink && (
              <div className="w-full space-y-3 mt-4 pt-4 border-t border-gray-100">
                <p className="text-center font-medium">Want priority access?</p>
                <p className="text-center text-sm text-gray-600">Share with other NRIs who might need our help.</p>
                <div className="flex items-center space-x-2 rounded-md border p-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-transparent text-sm outline-none p-2" // Added padding
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyReferralLink}
                    className="h-10 w-10 p-2" // Increased touch target
                  >
                    {referralCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex justify-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1 h-12 px-4" // Increased touch target
                    onClick={() => {
                      window.open(
                        `https://wa.me/?text=I just joined the Times NRI waitlist for elderly care services in India. As an NRI, I found this service really promising for managing parent care from abroad: ${referralLink}`,
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

            <Button className="mt-4 bg-primary h-12 px-6" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
