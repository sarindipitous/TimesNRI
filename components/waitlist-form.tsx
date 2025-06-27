"use client"

import { DialogTitle } from "@/components/ui/dialog"

import { DialogHeader } from "@/components/ui/dialog"

import { DialogContent } from "@/components/ui/dialog"

import { Dialog } from "@/components/ui/dialog"

import { cn } from "@/lib/utils"

import { useRef, useState } from "react"
import { useActionState } from "react"
import { createWaitlistSubmission, type WaitlistState } from "@/app/actions/waitlist"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Copy, Share2, ArrowRight, CheckCircle, Loader2 } from "lucide-react"

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
  const initialState: WaitlistState = { success: false, message: "" }
  const [state, dispatch, isPending] = useActionState(createWaitlistSubmission, initialState)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    parent_location: "",
    care_needs: "",
    care_plan: "",
  })
  const [step, setStep] = useState(1)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [referralCopied, setReferralCopied] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
        <form
          ref={formRef}
          action={dispatch}
          className="w-full space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {!isDetailed ? (
            <div className="space-y-4">
              {includeNameField && (
                <Input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                  required
                />
              )}
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                className={cn(
                  state.errors?.email && "border-red-500",
                  "w-full border-gray-300 focus:border-accent focus:ring-accent h-12",
                )}
                required
              />
              {state.errors?.email && <p className="text-sm text-red-500">{state.errors.email.join(", ")}</p>}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-accent hover:bg-accent/90 text-white h-12"
              >
                {isPending ? "Joining..." : buttonText}
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
                      className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                      required
                    />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Your email"
                      className={cn(
                        state.errors?.email && "border-red-500",
                        "w-full border-gray-300 focus:border-accent focus:ring-accent h-12",
                      )}
                      required
                    />
                    {state.errors?.email && <p className="text-sm text-red-500">{state.errors.email.join(", ")}</p>}
                    <Input
                      type="text"
                      name="city"
                      placeholder="San Francisco, USA"
                      className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-accent hover:bg-accent/90 text-white mt-2 flex items-center justify-center h-12"
                    disabled={isPending}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-lg font-medium text-gray-800">About Your Parents</h3>
                  <div className="space-y-3">
                    <Select
                      name="parent_location"
                      onValueChange={(value) => handleInputChange("parent_location", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="pune">Pune</SelectItem>
                        <SelectItem value="hyderabad">Hyderabad</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                        <SelectItem value="kolkata">Kolkata</SelectItem>
                        <SelectItem value="ahmedabad">Ahmedabad</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      id="careNeeds"
                      name="careNeeds"
                      placeholder="e.g. Hypertension follow-ups, emergency coverage..."
                      rows={3}
                      className="w-full border border-gray-300 focus:border-accent focus:ring-accent rounded-md p-3 min-h-[80px] resize-none"
                    />
                  </div>
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
                      onClick={() => setStep(3)}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white flex items-center justify-center h-12"
                      disabled={isPending}
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
                      <span className="font-medium">Name:</span> {formData.name}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {formData.email}
                    </p>
                    <p>
                      <span className="font-medium">Your location:</span> {formData.city}
                    </p>
                    <p>
                      <span className="font-medium">Parents' location:</span> {formData.parent_location}
                    </p>
                    <p>
                      <span className="font-medium">Care needs:</span> {formData.care_needs}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    By joining our waitlist, you'll be among the first to know when we launch in your parents' city.
                    We'll also send you resources on senior care in India.
                  </p>
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
                      disabled={isPending}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white h-12"
                    >
                      {isPending ? "Submitting..." : "Join Waitlist"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Success message for standalone mode */}
        {state.message && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center text-lg text-green-800">{state.message}</p>
              {formData.parent_location && (
                <p className="text-center text-sm text-gray-600">
                  We'll be in touch soon with personalized information about our services in {formData.parent_location}.
                </p>
              )}

              {referralLink && (
                <div className="w-full space-y-3 mt-4 pt-4 border-t border-green-200">
                  <p className="text-center font-medium">Want priority access?</p>
                  <p className="text-center text-sm text-gray-600">Share with other NRIs who might need our help.</p>
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

            <form
              ref={formRef}
              action={dispatch}
              className="w-full space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              {!isDetailed ? (
                <div className="space-y-4">
                  {includeNameField && (
                    <Input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                      required
                    />
                  )}
                  <Input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className={cn(
                      state.errors?.email && "border-red-500",
                      "w-full border-gray-300 focus:border-accent focus:ring-accent h-12",
                    )}
                    required
                  />
                  {state.errors?.email && <p className="text-sm text-red-500">{state.errors.email.join(", ")}</p>}
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-accent hover:bg-accent/90 text-white h-12"
                  >
                    {isPending ? "Joining..." : buttonText}
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
                          className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                          required
                        />
                        <Input
                          type="email"
                          name="email"
                          placeholder="Your email"
                          className={cn(
                            state.errors?.email && "border-red-500",
                            "w-full border-gray-300 focus:border-accent focus:ring-accent h-12",
                          )}
                          required
                        />
                        {state.errors?.email && <p className="text-sm text-red-500">{state.errors.email.join(", ")}</p>}
                        <Input
                          type="text"
                          name="city"
                          placeholder="San Francisco, USA"
                          className="w-full border-gray-300 focus:border-accent focus:ring-accent h-12"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full bg-accent hover:bg-accent/90 text-white mt-2 flex items-center justify-center h-12"
                        disabled={isPending}
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-lg font-medium text-gray-800">About Your Parents</h3>
                      <div className="space-y-3">
                        <Select
                          name="parent_location"
                          onValueChange={(value) => handleInputChange("parent_location", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mumbai">Mumbai</SelectItem>
                            <SelectItem value="delhi">Delhi</SelectItem>
                            <SelectItem value="bangalore">Bangalore</SelectItem>
                            <SelectItem value="pune">Pune</SelectItem>
                            <SelectItem value="hyderabad">Hyderabad</SelectItem>
                            <SelectItem value="chennai">Chennai</SelectItem>
                            <SelectItem value="kolkata">Kolkata</SelectItem>
                            <SelectItem value="ahmedabad">Ahmedabad</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          id="careNeeds"
                          name="careNeeds"
                          placeholder="e.g. Hypertension follow-ups, emergency coverage..."
                          rows={3}
                          className="w-full border border-gray-300 focus:border-accent focus:ring-accent rounded-md p-3 min-h-[80px] resize-none"
                        />
                      </div>
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
                          onClick={() => setStep(3)}
                          className="flex-1 bg-accent hover:bg-accent/90 text-white flex items-center justify-center h-12"
                          disabled={isPending}
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
                          <span className="font-medium">Name:</span> {formData.name}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span> {formData.email}
                        </p>
                        <p>
                          <span className="font-medium">Your location:</span> {formData.city}
                        </p>
                        <p>
                          <span className="font-medium">Parents' location:</span> {formData.parent_location}
                        </p>
                        <p>
                          <span className="font-medium">Care needs:</span> {formData.care_needs}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        By joining our waitlist, you'll be among the first to know when we launch in your parents' city.
                        We'll also send you resources on senior care in India.
                      </p>
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
                          disabled={isPending}
                          className="flex-1 bg-accent hover:bg-accent/90 text-white h-12"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Joining Waitlist...
                            </>
                          ) : (
                            "Join Waitlist"
                          )}
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
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p id="waitlist-success-dialog-description" className="text-center text-lg text-green-800">
              {state.message}
            </p>
            {formData.parent_location && (
              <p className="text-center text-sm text-gray-600">
                We'll be in touch soon with personalized information about our services in {formData.parent_location}.
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
