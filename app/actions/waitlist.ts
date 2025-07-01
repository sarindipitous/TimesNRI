"use server"

import {
  addToWaitlist,
  addReferral,
  addDetailedReferral,
  getWaitlistSubmissionByEmail,
  updateWaitlistSubmission,
  deleteWaitlistSubmission,
} from "@/lib/db"
import { sendWelcomeEmail, sendWelcomeEmailWithDetails } from "@/lib/email-service"

// ──────────────────────────────────────────────────────────────────────────────
// Input validation helpers
// ──────────────────────────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

function sanitizeString(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined
  const trimmed = input.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function validateFormData(formData: FormData) {
  const email = formData.get("email") as string

  if (!email || !isValidEmail(email)) {
    return { isValid: false, error: "Please provide a valid email address." }
  }

  return { isValid: true, error: null }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main action used throughout the app - PRODUCTION READY
// ──────────────────────────────────────────────────────────────────────────────
export async function submitToWaitlist(formData: FormData) {
  try {
    console.log("=== WAITLIST SUBMISSION START ===")

    // Validate form data
    const validation = validateFormData(formData)
    if (!validation.isValid) {
      console.log("❌ Validation failed:", validation.error)
      return { success: false, message: validation.error }
    }

    // Extract and sanitize form data
    const email = (formData.get("email") as string).toLowerCase().trim()
    const source = sanitizeString(formData.get("source")) || "main-form"
    const name = sanitizeString(formData.get("name"))
    const location = sanitizeString(formData.get("city"))
    const parentLocation = sanitizeString(formData.get("parentLocation"))
    const careNeeds = sanitizeString(formData.get("careNeeds"))
    const referredBy = sanitizeString(formData.get("referredBy"))
    const carePlan = sanitizeString(formData.get("carePlan"))
    const carePlanInterest = sanitizeString(formData.get("carePlanInterest"))

    console.log("Form data extracted:", {
      email,
      source,
      name,
      location,
      parentLocation,
      careNeeds,
      referredBy,
      carePlan: carePlan ? carePlan.substring(0, 20) + "..." : undefined,
      carePlanInterest: carePlanInterest ? carePlanInterest.substring(0, 20) + "..." : undefined,
    })

    // Add to waitlist (upsert)
    console.log("📝 Adding to waitlist...")
    const submission = await addToWaitlist(
      email,
      source,
      name,
      location,
      parentLocation,
      careNeeds,
      carePlan,
      carePlanInterest,
    )

    if (!submission) {
      console.log("❌ Failed to add to waitlist")
      return { success: false, message: "Failed to add to waitlist. Please try again." }
    }

    console.log("✅ Added to waitlist:", {
      id: submission.id,
      email: submission.email,
      waitlist_number: submission.waitlist_number,
    })

    // Handle referral linking with proper validation
    if (referredBy && isValidEmail(referredBy)) {
      console.log("🔗 Processing referral from:", referredBy)

      try {
        const referrer = await getWaitlistSubmissionByEmail(referredBy)
        if (referrer) {
          console.log("✅ Found referrer:", { id: referrer.id, email: referrer.email })

          // Add to referrals table
          const referralResult = await addReferral(referrer.id, email)
          if (referralResult) {
            console.log("✅ Added to referrals table:", referralResult.id)
          }

          // Add to detailed referrals table
          const detailedReferralResult = await addDetailedReferral(referrer.id, email, submission.id)
          if (detailedReferralResult) {
            console.log("✅ Added to detailed referrals table:", detailedReferralResult.id)
          }

          // Update the submission with referrer info
          const updatedSubmission = await updateWaitlistSubmission(submission.id, {
            referred_by: referredBy,
          })

          if (updatedSubmission) {
            console.log("✅ Updated submission with referrer info")
          }
        } else {
          console.log("⚠️ Referrer not found in waitlist:", referredBy)
        }
      } catch (referralError) {
        console.error("❌ Error processing referral:", referralError)
        // Don't fail the main submission if referral fails
      }
    } else if (referredBy) {
      console.log("⚠️ Invalid referrer email:", referredBy)
    }

    // Build referral link with proper URL validation
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://times-nri.vercel.app"
    if (!siteUrl.startsWith("http")) {
      siteUrl = `https://${siteUrl}`
    }

    // Ensure URL is valid
    try {
      new URL(siteUrl)
    } catch {
      siteUrl = "https://times-nri.vercel.app"
    }

    const referralLink = `${siteUrl}?ref=${encodeURIComponent(email)}`
    console.log("🔗 Generated referral link:", referralLink)

    // Send welcome email with error handling
    try {
      console.log("📧 Sending welcome email...")
      await sendWelcomeEmail({
        name,
        email,
        parent_location: parentLocation,
        care_plan: carePlan,
        waitlist_number: submission.waitlist_number,
        referral_link: referralLink,
      })
      console.log("✅ Welcome email sent successfully")
    } catch (emailError) {
      console.error("❌ Failed to send welcome email:", emailError)
      // Do not fail submission if email fails
    }

    console.log("=== WAITLIST SUBMISSION SUCCESS ===")
    return {
      success: true,
      message: "You've been added to our waitlist!",
      referralLink,
      submissionId: submission.id,
      waitlistNumber: submission.waitlist_number,
    }
  } catch (error) {
    console.error("❌ Error in submitToWaitlist:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// App-Router friendly wrapper for useActionState - PRODUCTION READY
// ──────────────────────────────────────────────────────────────────────────────
export type WaitlistState = {
  errors?: Record<string, string[]>
  message?: string | null
}

export async function createWaitlistSubmission(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  try {
    const res = await submitToWaitlist(formData)

    if (res.success) {
      return { message: res.message }
    } else {
      return {
        errors: { email: [res.message ?? "Submission failed"] },
        message: null,
      }
    }
  } catch (error) {
    console.error("❌ Error in createWaitlistSubmission:", error)
    return {
      errors: { email: ["An unexpected error occurred"] },
      message: null,
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Update existing waitlist entry - PRODUCTION READY
// ──────────────────────────────────────────────────────────────────────────────
export async function updateWaitlistEntry(formData: FormData) {
  try {
    const id = Number(formData.get("id"))
    const name = sanitizeString(formData.get("name"))
    const email = sanitizeString(formData.get("email"))
    const location = sanitizeString(formData.get("location"))
    const parentLocation = sanitizeString(formData.get("parentLocation"))
    const careNeeds = sanitizeString(formData.get("careNeeds"))
    const carePlan = sanitizeString(formData.get("carePlan"))
    const carePlanInterest = sanitizeString(formData.get("carePlanInterest"))

    if (!id || Number.isNaN(id) || id <= 0) {
      return { success: false, message: "Invalid ID provided." }
    }

    if (!email || !isValidEmail(email)) {
      return { success: false, message: "Valid email is required." }
    }

    const updated = await updateWaitlistSubmission(id, {
      name,
      email: email.toLowerCase().trim(),
      location,
      parent_location: parentLocation,
      care_needs: careNeeds,
      care_plan: carePlan,
      care_plan_interest: carePlanInterest,
    })

    return updated
      ? { success: true, message: "Entry updated successfully!", submission: updated }
      : { success: false, message: "Update failed. Entry may not exist." }
  } catch (error) {
    console.error("❌ updateWaitlistEntry error:", error)
    return { success: false, message: "Unexpected error during update." }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Delete waitlist entry - PRODUCTION READY
// ──────────────────────────────────────────────────────────────────────────────
export async function deleteWaitlistEntry(formData: FormData) {
  try {
    const id = Number(formData.get("id"))

    if (!id || Number.isNaN(id) || id <= 0) {
      return { success: false, message: "Invalid ID provided." }
    }

    const success = await deleteWaitlistSubmission(id)

    return success
      ? { success: true, message: "Entry deleted successfully." }
      : { success: false, message: "Delete failed. Entry may not exist." }
  } catch (error) {
    console.error("❌ deleteWaitlistEntry error:", error)
    return { success: false, message: "Unexpected error during delete." }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Email configuration - PRODUCTION READY
// ──────────────────────────────────────────────────────────────────────────────
export async function updateEmailConfiguration(formData: FormData) {
  try {
    const { updateEmailConfig } = await import("@/lib/email-config")

    const configs = [
      "welcome_email_enabled",
      "welcome_email_subject",
      "welcome_email_from_name",
      "welcome_email_from_email",
      "welcome_email_template",
    ]

    for (const key of configs) {
      const value = formData.get(key) as string
      if (value !== null && value !== undefined) {
        const sanitizedValue = typeof value === "string" ? value.trim() : value
        const enabled = key === "welcome_email_enabled" ? sanitizedValue === "true" : true
        await updateEmailConfig(key, sanitizedValue, enabled)
      }
    }

    return { success: true, message: "Email configuration updated successfully!" }
  } catch (error) {
    console.error("❌ Error updating email configuration:", error)
    return { success: false, message: "Failed to update email configuration." }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Send test welcome email - PRODUCTION READY
// ──────────────────────────────────────────────────────────────────────────────
export async function sendTestWelcomeEmail(formData: FormData) {
  try {
    const testEmail = sanitizeString(formData.get("testEmail"))

    if (!testEmail || !isValidEmail(testEmail)) {
      return { success: false, message: "Please provide a valid test email address." }
    }

    const result = await sendWelcomeEmailWithDetails({
      name: "Test User",
      email: testEmail,
      parent_location: "Mumbai",
      care_plan: "Peace: $50/month",
      waitlist_number: 999,
      referral_link: `${process.env.NEXT_PUBLIC_SITE_URL || "https://times-nri.vercel.app"}?ref=test`,
    })

    if (result.success) {
      return {
        success: true,
        message: `Test email sent successfully to ${testEmail} via ${result.service}!`,
        details: result.details,
      }
    } else {
      return {
        success: false,
        message: `Failed to send test email: ${result.error}`,
        details: result.details,
      }
    }
  } catch (error) {
    console.error("❌ Error sending test email:", error)
    return {
      success: false,
      message: "Error sending test email.",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Legacy alias for backward compatibility
export { submitToWaitlist as submitWaitlist }
