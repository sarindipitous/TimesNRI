"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email-service"
import { updateEmailConfig } from "@/lib/email-config"

export type WaitlistState = {
  errors?: Record<string, string[]>
  message?: string | null
  data?: {
    name?: string
    email?: string
    city?: string
    parentLocation?: string
    careNeeds?: string
    carePlan?: string
  }
}

function isValidEmail(email?: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function createWaitlistSubmission(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  try {
    const email = formData.get("email")
    if (!isValidEmail(email)) {
      return {
        errors: { email: ["Please provide a valid email address."] },
        message: null,
      }
    }

    const name = (formData.get("name") as string | null) ?? undefined
    const city = (formData.get("city") as string | null) ?? undefined
    const parentLocation = (formData.get("parentLocation") as string | null) ?? undefined
    const careNeeds = (formData.get("careNeeds") as string | null) ?? undefined
    const carePlan = (formData.get("carePlan") as string | null) ?? undefined
    const source = (formData.get("source") as string | null) ?? "main-form"

    // Insert into database
    const result = await sql`
      INSERT INTO waitlist_submissions (
        email, name, source, location, parent_location, care_needs, care_plan
      ) 
      VALUES (
        ${email}, ${name || null}, ${source}, ${city || null}, 
        ${parentLocation || null}, ${careNeeds || null}, ${carePlan || null}
      )
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, waitlist_submissions.name),
        location = COALESCE(EXCLUDED.location, waitlist_submissions.location),
        parent_location = COALESCE(EXCLUDED.parent_location, waitlist_submissions.parent_location),
        care_needs = COALESCE(EXCLUDED.care_needs, waitlist_submissions.care_needs),
        care_plan = COALESCE(EXCLUDED.care_plan, waitlist_submissions.care_plan),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const submission = result[0]

    // Try to send welcome email (don't fail if this fails)
    try {
      await sendWelcomeEmail({
        name,
        email,
        parent_location: parentLocation,
        care_plan: carePlan,
        waitlist_number: submission.id,
        referral_link: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://timesnri.com"}?ref=${encodeURIComponent(email)}`,
      })
    } catch (err) {
      console.error("welcome-email error (non-fatal):", err)
    }

    revalidatePath("/admin/waitlist")

    return {
      message: "You've been added to our waitlist!",
      data: { name, email, city, parentLocation, careNeeds, carePlan },
    }
  } catch (err) {
    console.error("createWaitlistSubmission:", err)
    return {
      errors: { email: ["Unexpected error. Please try again later."] },
      message: null,
    }
  }
}

export async function updateEmailConfiguration(formData: FormData) {
  try {
    const CONFIG_KEYS = [
      "welcome_email_enabled",
      "welcome_email_subject",
      "welcome_email_from_name",
      "welcome_email_from_email",
      "welcome_email_template",
    ] as const

    for (const key of CONFIG_KEYS) {
      const value = formData.get(key) as string | null
      if (value !== null) {
        const enabled = key === "welcome_email_enabled" ? value === "true" : true
        await updateEmailConfig(key, value, enabled)
      }
    }

    return { success: true, message: "Email configuration saved." }
  } catch (err) {
    console.error("updateEmailConfiguration:", err)
    return { success: false, message: "Failed to update email settings." }
  }
}

export async function sendTestWelcomeEmail(formData: FormData) {
  try {
    const testEmail = formData.get("testEmail") as string | null
    if (!testEmail || !isValidEmail(testEmail)) {
      return { success: false, message: "Please supply a valid test email." }
    }

    const ok = await sendWelcomeEmail({
      name: "Test User",
      email: testEmail,
      parent_location: "Mumbai, India",
      care_plan: "Peace Plan – $50/month",
      waitlist_number: 999,
      referral_link: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://timesnri.com"}?ref=test`,
    })

    return ok
      ? { success: true, message: `Test email sent to ${testEmail}` }
      : { success: false, message: "Send failed – check API key / sender setup." }
  } catch (err) {
    console.error("sendTestWelcomeEmail:", err)
    return { success: false, message: "Error when sending test email." }
  }
}
