"use server"

import { neon } from "@neondatabase/serverless"
import {
  addToWaitlist,
  addReferral,
  addDetailedReferral,
  getWaitlistSubmissionByEmail,
  updateWaitlistSubmission,
  deleteWaitlistSubmission,
} from "@/lib/db"
import { sendWelcomeEmail, sendWelcomeEmailWithDetails } from "@/lib/email-service"
import { updateEmailConfig } from "@/lib/email-config"

const sql = neon(process.env.DATABASE_URL!)

/* ------------------------------------------------------------------ */
/* Shared helpers                                                     */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/* ------------------------------------------------------------------ */
/* 1. Original single-argument action (kept for backwards compatibility) */
export async function submitToWaitlist(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const source = (formData.get("source") as string) || "main-form"
    const name = (formData.get("name") as string) || undefined
    const location = (formData.get("city") as string) || undefined
    const parentLocation = (formData.get("parentLocation") as string) || undefined
    const careNeeds = (formData.get("careNeeds") as string) || undefined
    const referredBy = (formData.get("referredBy") as string) || undefined
    const carePlan = (formData.get("carePlan") as string) || undefined
    const carePlanInterest = (formData.get("carePlanInterest") as string) || undefined

    if (!email || !isValidEmail(email)) {
      return { success: false, message: "Please provide a valid email address." }
    }

    /* upsert submission */
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
      return { success: false, message: "Failed to add to waitlist. Please try again." }
    }

    /* link referral */
    if (referredBy) {
      const referrer = await getWaitlistSubmissionByEmail(referredBy)
      if (referrer) {
        await addReferral(referrer.id, email)
        await addDetailedReferral(referrer.id, email, submission.id)
      }
    }

    /* build referral link */
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://times-nri.vercel.app"
    if (!siteUrl.startsWith("http")) siteUrl = `https://${siteUrl}`
    const referralLink = `${siteUrl}?ref=${encodeURIComponent(email)}`

    /* send welcome email */
    try {
      await sendWelcomeEmail({
        name,
        email,
        parent_location: parentLocation,
        care_plan: carePlan,
        waitlist_number: submission.waitlist_number,
        referral_link: referralLink,
      })
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Don't fail the entire submission if email fails
    }

    return {
      success: true,
      message: "You've been added to our waitlist!",
      referralLink,
      submissionId: submission.id,
      waitlistNumber: submission.waitlist_number,
    }
  } catch (error) {
    console.error("Error in submitToWaitlist:", error)
    return { success: false, message: "An unexpected error occurred. Please try again." }
  }
}

/* ------------------------------------------------------------------ */
/* 2. App-Router friendly action used with `useActionState`            */
export type WaitlistState = { errors?: Record<string, string[]>; message?: string | null }

export async function createWaitlistSubmission(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const res = await submitToWaitlist(formData)
  return res.success ? { message: res.message } : { errors: { email: [res.message ?? "Error"] }, message: null }
}

/* ------------------------------------------------------------------ */
/* 3. Update an existing wait-list entry                               */
export async function updateWaitlistEntry(formData: FormData) {
  try {
    const id = Number(formData.get("id"))
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const location = formData.get("location") as string
    const parentLocation = formData.get("parentLocation") as string
    const careNeeds = formData.get("careNeeds") as string
    const carePlan = formData.get("carePlan") as string
    const carePlanInterest = formData.get("carePlanInterest") as string

    if (!id || Number.isNaN(id)) return { success: false, message: "Invalid ID." }
    if (!email || !isValidEmail(email)) return { success: false, message: "Invalid email." }

    const updated = await updateWaitlistSubmission(id, {
      name,
      email,
      location,
      parent_location: parentLocation,
      care_needs: careNeeds,
      care_plan: carePlan,
      care_plan_interest: carePlanInterest,
    })

    return updated
      ? { success: true, message: "Entry updated!", submission: updated }
      : { success: false, message: "Update failed." }
  } catch (error) {
    console.error("updateWaitlistEntry:", error)
    return { success: false, message: "Unexpected error during update." }
  }
}

/* ------------------------------------------------------------------ */
/* 4. Delete a wait-list entry                                         */
export async function deleteWaitlistEntry(formData: FormData) {
  try {
    const id = Number(formData.get("id"))
    if (!id || Number.isNaN(id)) return { success: false, message: "Invalid ID." }

    const ok = await deleteWaitlistSubmission(id)
    return ok
      ? { success: true, message: "Entry deleted." }
      : { success: false, message: "Delete failed. Entry may not exist." }
  } catch (error) {
    console.error("deleteWaitlistEntry:", error)
    return { success: false, message: "Unexpected error during delete." }
  }
}

/* ------------------------------------------------------------------ */
/* 5. Email configuration actions                                      */
export async function updateEmailConfiguration(formData: FormData) {
  try {
    const updates = [
      { key: "welcome_email_enabled", value: formData.get("welcome_email_enabled") as string },
      { key: "welcome_email_subject", value: formData.get("welcome_email_subject") as string },
      { key: "welcome_email_from_name", value: formData.get("welcome_email_from_name") as string },
      { key: "welcome_email_from_email", value: formData.get("welcome_email_from_email") as string },
      { key: "welcome_email_template", value: formData.get("welcome_email_template") as string },
    ]

    for (const update of updates) {
      if (update.value !== null) {
        await updateEmailConfig(update.key, update.value)
      }
    }

    return {
      success: true,
      message: "Email configuration updated successfully",
    }
  } catch (error) {
    console.error("Error updating email configuration:", error)
    return {
      success: false,
      message: "Failed to update email configuration",
    }
  }
}

export async function sendTestWelcomeEmail(formData: FormData) {
  try {
    const testEmail = formData.get("testEmail") as string

    if (!testEmail) {
      return {
        success: false,
        message: "Test email address is required",
      }
    }

    const emailResult = await sendWelcomeEmailWithDetails({
      name: "Test User",
      email: testEmail,
      parent_location: "Mumbai, India",
      care_plan: "Peace Plan - $50/month",
      waitlist_number: 999,
      referral_link: `${process.env.NEXT_PUBLIC_SITE_URL || "https://timesnri.com"}?ref=testuser`,
    })

    return {
      success: emailResult.success,
      message: emailResult.success
        ? `Test email sent successfully to ${testEmail} via ${emailResult.service}`
        : `Failed to send test email: ${emailResult.error}`,
      details: emailResult.details,
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return {
      success: false,
      message: "An error occurred while sending test email",
    }
  }
}

/* ------------------------------------------------------------------ */
/* 6. New action to join waitlist                                      */
export async function joinWaitlist(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const parentLocation = formData.get("parentLocation") as string
    const carePlanInterest = formData.get("carePlanInterest") as string
    const referralSource = formData.get("referralSource") as string

    if (!name || !email || !parentLocation) {
      return {
        success: false,
        message: "Please fill in all required fields",
      }
    }

    // Check if email already exists
    const existingUser = await sql`
      SELECT id FROM waitlist WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return {
        success: false,
        message: "This email is already on our waitlist",
      }
    }

    // Get the next waitlist number
    const countResult = await sql`
      SELECT COUNT(*) as count FROM waitlist
    `
    const waitlistNumber = Number.parseInt(countResult[0].count) + 1

    // Generate referral code (simple hash of email)
    const referralCode = Buffer.from(email)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 8)

    // Create referral link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://timesnri.com"
    const referralLink = `${siteUrl}?ref=${referralCode}`

    // Insert into waitlist
    const result = await sql`
      INSERT INTO waitlist (
        name, email, parent_location, care_plan_interest, 
        referral_source, waitlist_number, referral_code
      ) VALUES (
        ${name}, ${email}, ${parentLocation}, ${carePlanInterest}, 
        ${referralSource}, ${waitlistNumber}, ${referralCode}
      ) RETURNING id
    `

    if (result.length === 0) {
      throw new Error("Failed to insert into waitlist")
    }

    // Send welcome email
    const emailResult = await sendWelcomeEmailWithDetails({
      name,
      email,
      parent_location: parentLocation,
      care_plan: carePlanInterest,
      waitlist_number: waitlistNumber,
      referral_link: referralLink,
    })

    console.log("Welcome email result:", emailResult)

    return {
      success: true,
      message: "Successfully joined the waitlist!",
      data: {
        waitlistNumber,
        referralCode,
        referralLink,
        emailSent: emailResult.success,
        emailError: emailResult.success ? null : emailResult.error,
      },
    }
  } catch (error) {
    console.error("Error joining waitlist:", error)
    return {
      success: false,
      message: "An error occurred. Please try again.",
    }
  }
}
