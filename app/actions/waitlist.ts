"use server"

/**
 * This file is the single source-of-truth for all wait-list
 * related server actions.  It MUST export `createWaitlistSubmission`
 * so that client components (e.g. `<WaitlistForm />`) can import it
 * with:
 *
 *   import { createWaitlistSubmission } from '@/app/actions/waitlist'
 *
 * If you change the name here, remember to update every import.
 */

import { revalidatePath } from "next/cache"
import { addToWaitlist } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email-service"
import { updateEmailConfig } from "@/lib/email-config"

/* ------------------------------------------------------------------ */
/* Types                                                               */

export type WaitlistState = {
  /** keyed by field name – used by <WaitlistForm/> to highlight errors */
  errors?: Record<string, string[]>
  /** success / generic message to surface to the user                */
  message?: string | null
  /**
   * optional data bag –  the client form uses it to echo information
   * back to the user after a successful submission.  All keys are
   * optional so that we never break if a new field is added.
   */
  data?: {
    name?: string
    email?: string
    city?: string
    parentLocation?: string
    careNeeds?: string
    carePlan?: string
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */

function isValidEmail(email?: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/* ------------------------------------------------------------------ */
/* Action                                                              */

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

    /* ---------------------------------------------------------------- */
    /* Persist to DB                                                     */
    const submission = await addToWaitlist(
      email,
      source,
      name,
      city,
      parentLocation,
      careNeeds,
      carePlan,
      /* carePlanInterest */ undefined,
    )

    if (!submission) {
      return {
        errors: { email: ["Failed to save. Please try again."] },
        message: null,
      }
    }

    /* ---------------------------------------------------------------- */
    /* Send welcome email (ignore error – we don’t want to block UX)     */
    try {
      await sendWelcomeEmail({
        name,
        email,
        parent_location: parentLocation,
        care_plan: carePlan,
        waitlist_number: submission.waitlist_number,
        referral_link: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://timesnri.com"}?ref=${encodeURIComponent(email)}`,
      })
    } catch (err) {
      console.error("welcome-email error (non-fatal):", err)
    }

    /* revalidate any pages that list wait-list numbers                  */
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

/* ------------------------------------------------------------------ */
/*  Update global email settings (admin  settings)                   */
export async function updateEmailConfiguration(formData: FormData) {
  try {
    /**
     * Keys we allow from the admin screen.
     * Each <input name="…"> in the form must match one of these.
     */
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
        /**
         * For the “enabled” toggle we store a boolean → string.
         * Everything else is stored as-is.
         */
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

/* ------------------------------------------------------------------ */
/*  Send a single test “Welcome” email to verify the SMTP integration  */
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
