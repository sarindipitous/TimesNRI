"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check } from "lucide-react"
import { createWaitlistSubmissionAction } from "@/app/actions/waitlist"
import { useActionState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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
  const [state, formAction, isPending] = useActionState(createWaitlistSubmissionAction, null)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    source: "",
    location: "",
    parent_location: "",
    care_needs: "",
    care_plan: "",
    care_plan_interest: "",
    referred_by: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formRef = useRef<HTMLFormElement>(null)

  // Check for referral in URL and plan parameter
  const urlParams = new URLSearchParams(window.location.search)
  const ref = urlParams.get("ref")
  const planParam = urlParams.get("plan")

  if (ref) {
    localStorage.setItem("referredBy", ref)
  }

  // Set plan based on preSelectedPlan prop first, then URL parameter
  if (preSelectedPlan) {
    setFormData((prev) => ({ ...prev, care_plan: preSelectedPlan }))
  } else if (planParam) {
    const planMap: Record<string, string> = {
      peace: "Peace: $50/month",
      presence: "Presence: $200/month",
      honour: "Honour: $500/month (By Invitation Only)",
    }
    setFormData((prev) => ({ ...prev, care_plan: planMap[planParam] || "" }))
  }

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false)
    }
    if (onClose) {
      onClose()
    }
  }

  // Standalone version (for dedicated waitlist page)
  if (standalone) {
    return (
      <div className="w-full">
        <form ref={formRef} action={formAction} className="w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>

          {includeNameField && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Your full name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="parent_location">Parent's Location</Label>
            <Input
              id="parent_location"
              name="parent_location"
              value={formData.parent_location}
              onChange={(e) => handleInputChange("parent_location", e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Your Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="care_needs">Care Needs</Label>
            <Textarea
              id="care_needs"
              name="care_needs"
              value={formData.care_needs}
              onChange={(e) => handleInputChange("care_needs", e.target.value)}
              placeholder="Describe the type of care needed..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="care_plan">Preferred Care Plan</Label>
            <Select
              name="care_plan"
              value={formData.care_plan}
              onValueChange={(value) => handleInputChange("care_plan", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a care plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Care</SelectItem>
                <SelectItem value="standard">Standard Care</SelectItem>
                <SelectItem value="premium">Premium Care</SelectItem>
                <SelectItem value="custom">Custom Care Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="care_plan_interest">Care Plan Interest Level</Label>
            <Select
              name="care_plan_interest"
              value={formData.care_plan_interest}
              onValueChange={(value) => handleInputChange("care_plan_interest", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="How interested are you?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very_interested">Very Interested</SelectItem>
                <SelectItem value="somewhat_interested">Somewhat Interested</SelectItem>
                <SelectItem value="just_exploring">Just Exploring</SelectItem>
                <SelectItem value="need_more_info">Need More Information</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">How did you hear about us?</Label>
            <Select name="source" value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Search</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="referral">Friend/Family Referral</SelectItem>
                <SelectItem value="advertisement">Advertisement</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referred_by">Referred By (Optional)</Label>
            <Input
              id="referred_by"
              name="referred_by"
              value={formData.referred_by}
              onChange={(e) => handleInputChange("referred_by", e.target.value)}
              placeholder="Name or email of person who referred you"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Joining..." : buttonText}
          </Button>
        </form>

        {/* Success message for standalone mode */}
        {state?.success && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800">You're on the list!</h3>
              <p className="text-green-700">
                Thank you for joining our waitlist. We'll keep you updated on our progress and notify you when we launch
                in your area.
              </p>
              {state.waitlist_number && (
                <p className="text-sm text-gray-500">Your waitlist number: #{state.waitlist_number}</p>
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
              Be among the first to know when Times NRI launches in your area.
            </p>

            <form ref={formRef} action={formAction} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>

              {includeNameField && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="parent_location">Parent's Location</Label>
                <Input
                  id="parent_location"
                  name="parent_location"
                  value={formData.parent_location}
                  onChange={(e) => handleInputChange("parent_location", e.target.value)}
                  placeholder="City, Country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Your Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="City, Country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="care_needs">Care Needs</Label>
                <Textarea
                  id="care_needs"
                  name="care_needs"
                  value={formData.care_needs}
                  onChange={(e) => handleInputChange("care_needs", e.target.value)}
                  placeholder="Describe the type of care needed..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="care_plan">Preferred Care Plan</Label>
                <Select
                  name="care_plan"
                  value={formData.care_plan}
                  onValueChange={(value) => handleInputChange("care_plan", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a care plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Care</SelectItem>
                    <SelectItem value="standard">Standard Care</SelectItem>
                    <SelectItem value="premium">Premium Care</SelectItem>
                    <SelectItem value="custom">Custom Care Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="care_plan_interest">Care Plan Interest Level</Label>
                <Select
                  name="care_plan_interest"
                  value={formData.care_plan_interest}
                  onValueChange={(value) => handleInputChange("care_plan_interest", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How interested are you?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_interested">Very Interested</SelectItem>
                    <SelectItem value="somewhat_interested">Somewhat Interested</SelectItem>
                    <SelectItem value="just_exploring">Just Exploring</SelectItem>
                    <SelectItem value="need_more_info">Need More Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">How did you hear about us?</Label>
                <Select
                  name="source"
                  value={formData.source}
                  onValueChange={(value) => handleInputChange("source", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Search</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="referral">Friend/Family Referral</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referred_by">Referred By (Optional)</Label>
                <Input
                  id="referred_by"
                  name="referred_by"
                  value={formData.referred_by}
                  onChange={(e) => handleInputChange("referred_by", e.target.value)}
                  placeholder="Name or email of person who referred you"
                />
              </div>

              {state?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{state.error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Joining..." : buttonText}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {state?.success && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-md" aria-describedby="waitlist-success-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">You're on the list!</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="rounded-full bg-green-100 p-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p id="waitlist-success-dialog-description" className="text-center text-lg">
                Thank you for joining our waitlist. We'll keep you updated on our progress and notify you when we launch
                in your area.
              </p>
              {state.waitlist_number && (
                <p className="text-center text-sm text-gray-500">Your waitlist number: #{state.waitlist_number}</p>
              )}
              <Button className="mt-4 bg-primary h-12 px-6" onClick={handleClose}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
