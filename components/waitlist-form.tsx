"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Loader2 } from "lucide-react"
import { submitToWaitlist } from "@/app/actions/waitlist"

interface WaitlistFormProps {
  buttonText?: string
  source?: string
  includeNameField?: boolean
  isDetailed?: boolean
  onClose?: () => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  referredBy?: string | null
}

export function WaitlistForm({
  buttonText = "Join Waitlist",
  source = "main-form",
  includeNameField = false,
  isDetailed = false,
  onClose,
  isOpen = false,
  onOpenChange,
  referredBy = null,
}: WaitlistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referralLink, setReferralLink] = useState<string | null>(null)
  const [waitlistNumber, setWaitlistNumber] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    city: "",
    parentLocation: "",
    careNeeds: "",
    carePlan: "",
    carePlanInterest: "",
  })

  // Debug log to verify referredBy is received
  useEffect(() => {
    if (referredBy) {
      console.log("WaitlistForm received referredBy:", referredBy)
    }
  }, [referredBy])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formDataToSubmit = new FormData()
      formDataToSubmit.append("email", formData.email)
      formDataToSubmit.append("source", source)

      if (includeNameField && formData.name) {
        formDataToSubmit.append("name", formData.name)
      }

      if (formData.city) {
        formDataToSubmit.append("city", formData.city)
      }

      if (formData.parentLocation) {
        formDataToSubmit.append("parentLocation", formData.parentLocation)
      }

      if (formData.careNeeds) {
        formDataToSubmit.append("careNeeds", formData.careNeeds)
      }

      if (formData.carePlan) {
        formDataToSubmit.append("carePlan", formData.carePlan)
      }

      if (formData.carePlanInterest) {
        formDataToSubmit.append("carePlanInterest", formData.carePlanInterest)
      }

      // Add referredBy if present
      if (referredBy) {
        formDataToSubmit.append("referredBy", referredBy)
        console.log("Adding referredBy to form submission:", referredBy) // Debug log
      }

      const result = await submitToWaitlist(formDataToSubmit)

      if (result.success) {
        setIsSuccess(true)
        setReferralLink(result.referralLink || null)
        setWaitlistNumber(result.waitlistNumber || null)

        // Reset form
        setFormData({
          name: "",
          email: "",
          city: "",
          parentLocation: "",
          careNeeds: "",
          carePlan: "",
          carePlanInterest: "",
        })
      } else {
        setError(result.message || "Something went wrong. Please try again.")
      }
    } catch (err) {
      console.error("Form submission error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsSuccess(false)
    setError(null)
    if (onClose) {
      onClose()
    }
  }

  const copyReferralLink = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink)
        // Could add a toast notification here
      } catch (err) {
        console.error("Failed to copy referral link:", err)
      }
    }
  }

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Welcome to the Waitlist!
            </DialogTitle>
            <DialogDescription className="space-y-4">
              <p>Thank you for joining our waitlist! We'll keep you updated on our launch progress.</p>

              {waitlistNumber && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="font-medium text-primary">You're #{waitlistNumber} on our waitlist!</p>
                </div>
              )}

              {referralLink && (
                <div className="space-y-2">
                  <p className="font-medium">Share with friends and family:</p>
                  <div className="flex gap-2">
                    <Input value={referralLink} readOnly className="text-sm" />
                    <Button onClick={copyReferralLink} variant="outline" size="sm">
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Get priority access when people join through your link!</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {referredBy && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">
            <strong>Referred by:</strong> {referredBy}
          </p>
        </div>
      )}

      {includeNameField && (
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter your full name"
            required={includeNameField}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          placeholder="Enter your email address"
          required
        />
      </div>

      {isDetailed && (
        <>
          <div className="space-y-2">
            <Label htmlFor="city">Your Current City</Label>
            <Input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="e.g., New York, London, Dubai"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentLocation">Parent's Location in India</Label>
            <Input
              id="parentLocation"
              type="text"
              value={formData.parentLocation}
              onChange={(e) => handleInputChange("parentLocation", e.target.value)}
              placeholder="e.g., Mumbai, Delhi, Bangalore"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="careNeeds">Care Needs (Optional)</Label>
            <Textarea
              id="careNeeds"
              value={formData.careNeeds}
              onChange={(e) => handleInputChange("careNeeds", e.target.value)}
              placeholder="Tell us about your parent's specific care needs..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carePlan">Interested Care Plan</Label>
            <Select onValueChange={(value) => handleInputChange("carePlan", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a care plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="peace">Peace Plan - $50/month</SelectItem>
                <SelectItem value="comfort">Comfort Plan - $150/month</SelectItem>
                <SelectItem value="comprehensive">Comprehensive Plan - $300/month</SelectItem>
                <SelectItem value="not-sure">Not sure yet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carePlanInterest">What interests you most?</Label>
            <Select onValueChange={(value) => handleInputChange("carePlanInterest", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your primary interest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergency Response</SelectItem>
                <SelectItem value="health-monitoring">Health Monitoring</SelectItem>
                <SelectItem value="companionship">Companionship</SelectItem>
                <SelectItem value="daily-assistance">Daily Assistance</SelectItem>
                <SelectItem value="all">All of the above</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </form>
  )

  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Our Waitlist</DialogTitle>
            <DialogDescription>Be among the first to access our Elderly Care Concierge service.</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    )
  }

  return formContent
}
