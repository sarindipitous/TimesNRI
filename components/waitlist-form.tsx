"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Mail,
  User,
  MapPin,
  Heart,
  MessageSquare,
  CheckCircle,
  UserCheck,
  ExternalLink,
  Copy,
  Loader2,
} from "lucide-react"
import { createWaitlistSubmission } from "@/app/actions/waitlist"
import { toast } from "@/hooks/use-toast"

const initialState = { errors: {}, message: null }

export default function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(createWaitlistSubmission, initialState)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    city: "",
    parentLocation: "",
    careNeeds: "",
    carePlan: "",
    carePlanInterest: "",
    referredBy: "",
  })
  const [referralInfo, setReferralInfo] = useState<{
    referrer: string | null
    source: string
  }>({
    referrer: null,
    source: "direct",
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [referralLink, setReferralLink] = useState("")

  // Capture referral information on component mount
  useEffect(() => {
    console.log("=== WAITLIST FORM MOUNTED ===")

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const refParam = urlParams.get("ref")

    console.log("URL parameters:", Object.fromEntries(urlParams.entries()))
    console.log("Referral parameter:", refParam)

    // Check localStorage for persisted referral info
    const storedReferral = localStorage.getItem("timesnri_referral")
    console.log("Stored referral:", storedReferral)

    let referrer = null
    let source = "direct"

    if (refParam) {
      referrer = decodeURIComponent(refParam)
      source = "referral"
      console.log("✅ Referral detected from URL:", referrer)

      // Store in localStorage for persistence
      localStorage.setItem("timesnri_referral", referrer)
      console.log("💾 Stored referral in localStorage")
    } else if (storedReferral) {
      referrer = storedReferral
      source = "referral"
      console.log("✅ Referral detected from localStorage:", referrer)
    }

    setReferralInfo({ referrer, source })
    setFormData((prev) => ({ ...prev, referredBy: referrer || "" }))

    console.log("📊 Final referral info:", { referrer, source })
  }, [])

  // Handle successful submission
  useEffect(() => {
    if (state.message && !state.errors?.email) {
      console.log("✅ Form submission successful:", state.message)
      setShowSuccess(true)

      // Generate referral link
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const newReferralLink = `${siteUrl}?ref=${encodeURIComponent(formData.email)}`
      setReferralLink(newReferralLink)
      console.log("🔗 Generated referral link:", newReferralLink)

      // Clear stored referral after successful submission
      localStorage.removeItem("timesnri_referral")
      console.log("🧹 Cleared stored referral")
    }
  }, [state, formData.email])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    console.log(`📝 Form field updated: ${field} = ${value}`)
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      console.log(`➡️ Moving to step ${currentStep + 1}`)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      console.log(`⬅️ Moving to step ${currentStep - 1}`)
    }
  }

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.email && formData.name
      case 2:
        return formData.city && formData.parentLocation
      case 3:
        return formData.careNeeds
      default:
        return true
    }
  }

  if (showSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to the Waitlist! 🎉</CardTitle>
          <CardDescription>Thank you for joining Times NRI. We'll keep you updated on our progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {referralInfo.referrer && (
            <Alert className="border-green-200 bg-green-50">
              <UserCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Referral Confirmed!</strong> You were referred by{" "}
                <span className="font-mono">{referralInfo.referrer}</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Your Referral Link</Label>
              <div className="flex gap-2 mt-1">
                <Input value={referralLink} readOnly className="font-mono text-sm" />
                <Button onClick={copyReferralLink} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Share this link with friends and family to refer them to Times NRI
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => window.open("/", "_self")} variant="outline" className="flex-1">
                Back to Home
              </Button>
              <Button
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=Just joined the Times NRI waitlist! They're building something amazing for NRI families. Join me: ${encodeURIComponent(referralLink)}`,
                    "_blank",
                  )
                }
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Share on Twitter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Join the Waitlist
        </CardTitle>
        <CardDescription>Step {currentStep} of 3 - Help us understand your needs better</CardDescription>

        {referralInfo.referrer && (
          <Alert className="border-blue-200 bg-blue-50">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Referral Detected!</strong> You were referred by{" "}
              <span className="font-mono">{referralInfo.referrer}</span>
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Hidden fields for referral tracking */}
          <input type="hidden" name="source" value={referralInfo.source} />
          <input type="hidden" name="referredBy" value={formData.referredBy} />

          <Tabs value={currentStep.toString()} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1" disabled={currentStep !== 1}>
                Personal Info
              </TabsTrigger>
              <TabsTrigger value="2" disabled={currentStep !== 2}>
                Location
              </TabsTrigger>
              <TabsTrigger value="3" disabled={currentStep !== 3}>
                Care Needs
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Personal Information */}
            <TabsContent value="1" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                  {state.errors?.email && <p className="text-sm text-red-600 mt-1">{state.errors.email[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <Button type="button" onClick={handleNextStep} disabled={!validateStep(1)} className="w-full">
                  Continue to Location
                </Button>
              </div>
            </TabsContent>

            {/* Step 2: Location Information */}
            <TabsContent value="2" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Your Current City *
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="e.g., New York, London, Dubai"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="parentLocation" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Parent's Location in India *
                  </Label>
                  <Input
                    id="parentLocation"
                    name="parentLocation"
                    value={formData.parentLocation}
                    onChange={(e) => handleInputChange("parentLocation", e.target.value)}
                    placeholder="e.g., Mumbai, Delhi, Bangalore"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handlePrevStep} variant="outline" className="flex-1 bg-transparent">
                    Back
                  </Button>
                  <Button type="button" onClick={handleNextStep} disabled={!validateStep(2)} className="flex-1">
                    Continue to Care Needs
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Step 3: Care Needs */}
            <TabsContent value="3" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="careNeeds" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    What care needs do your parents have? *
                  </Label>
                  <Textarea
                    id="careNeeds"
                    name="careNeeds"
                    value={formData.careNeeds}
                    onChange={(e) => handleInputChange("careNeeds", e.target.value)}
                    placeholder="Tell us about your parents' health, mobility, or daily living needs..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">Which care plan interests you most?</Label>
                  <RadioGroup
                    value={formData.carePlan}
                    onValueChange={(value) => handleInputChange("carePlan", value)}
                    name="carePlan"
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Peace: $50/month" id="peace" />
                      <Label htmlFor="peace" className="flex-1">
                        <div className="font-medium">Peace - $50/month</div>
                        <div className="text-sm text-muted-foreground">
                          Daily check-ins, emergency response, basic health monitoring
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Comfort: $150/month" id="comfort" />
                      <Label htmlFor="comfort" className="flex-1">
                        <div className="font-medium">Comfort - $150/month</div>
                        <div className="text-sm text-muted-foreground">
                          Everything in Peace + weekly visits, medication management
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Complete: $300/month" id="complete" />
                      <Label htmlFor="complete" className="flex-1">
                        <div className="font-medium">Complete - $300/month</div>
                        <div className="text-sm text-muted-foreground">
                          Full-service care with daily visits, medical coordination
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="carePlanInterest">Any specific questions about our care plans?</Label>
                  <Textarea
                    id="carePlanInterest"
                    name="carePlanInterest"
                    value={formData.carePlanInterest}
                    onChange={(e) => handleInputChange("carePlanInterest", e.target.value)}
                    placeholder="Optional: Tell us what you'd like to know more about..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handlePrevStep} variant="outline" className="flex-1 bg-transparent">
                    Back
                  </Button>
                  <Button type="submit" disabled={isPending || !validateStep(3)} className="flex-1">
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Joining Waitlist...
                      </>
                    ) : (
                      "Join Waitlist"
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {state.message && state.errors?.email && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{state.message}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

// ⬇️  NEW — provide a named export alongside the default export
export { WaitlistForm }
