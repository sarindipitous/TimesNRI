"use server"
import { sql, hasDb } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email-service"
import { updateEmailConfig } from "@/lib/email-config"

/* ------------------------------------------------------------------ */
/* Types                                                               */

export interface WaitlistState {
  success: boolean
  message: string
  error?: string
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */

function isValidEmail(email?: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/* ------------------------------------------------------------------ */
/* Action                                                              */

export async function createWaitlistSubmission(
  prevState: WaitlistState | null,
  formData: FormData,
): Promise<WaitlistState> {
  if (!hasDb) {
    return {
      success: false,
      message: "Database not configured",
      error: "Database connection not available",
    }
  }

  try {
    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const source = formData.get("source") as string
    const location = formData.get("location") as string
    const parent_location = formData.get("parent_location") as string
    const care_needs = formData.get("care_needs") as string
    const care_plan = formData.get("care_plan") as string
    const care_plan_interest = formData.get("care_plan_interest") as string

    if (!email) {
      return {
        success: false,
        message: "Email is required",
        error: "Missing email address",
      }
    }

    // Insert into database
    const result = await sql`
    INSERT INTO waitlist_submissions (
      email, name, source, location, parent_location, care_needs, care_plan, care_plan_interest
    ) 
    VALUES (
      ${email}, ${name || null}, ${source || null}, ${location || null}, 
      ${parent_location || null}, ${care_needs || null}, ${care_plan || null}, ${care_plan_interest || null}
    )
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, waitlist_submissions.name),
      source = COALESCE(EXCLUDED.source, waitlist_submissions.source),
      location = COALESCE(EXCLUDED.location, waitlist_submissions.location),
      parent_location = COALESCE(EXCLUDED.parent_location, waitlist_submissions.parent_location),
      care_needs = COALESCE(EXCLUDED.care_needs, waitlist_submissions.care_needs),
      care_plan = COALESCE(EXCLUDED.care_plan, waitlist_submissions.care_plan),
      care_plan_interest = COALESCE(EXCLUDED.care_plan_interest, waitlist_submissions.care_plan_interest)
    RETURNING *
  `

    const submission = result[0]

    // Try to send welcome email
    try {
      await sendWelcomeEmail({
        name: submission.name,
        email: submission.email,
        parent_location: submission.parent_location,
        care_plan: submission.care_plan,
        waitlist_number: submission.id,
      })
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Don't fail the whole operation if email fails
    }

    return {
      success: true,
      message: "Successfully added to waitlist! Check your email for confirmation.",
    }
  } catch (error) {
    console.error("Error creating waitlist submission:", error)
    return {
      success: false,
      message: "Failed to add to waitlist. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Update global email settings (admin  settings)                   */
export async function updateEmailConfiguration(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const enabled = formData.get("enabled") === "on" ? "true" : "false"
    const subject = formData.get("subject") as string
    const fromName = formData.get("fromName") as string
    const fromEmail = formData.get("fromEmail") as string
    const template = formData.get("template") as string

    if (!subject || !fromName || !fromEmail || !template) {
      return {
        success: false,
        message: "All fields are required",
        error: "Missing required fields",
      }
    }

    // Update email configuration
    await Promise.all([
      updateEmailConfig("welcome_email_enabled", enabled),
      updateEmailConfig("welcome_email_subject", subject),
      updateEmailConfig("welcome_email_from_name", fromName),
      updateEmailConfig("welcome_email_from_email", fromEmail),
      updateEmailConfig("welcome_email_template", template),
    ])

    return {
      success: true,
      message: "Email configuration updated successfully",
    }
  } catch (error) {
    console.error("Error updating email configuration:", error)
    return {
      success: false,
      message: "Failed to update email configuration",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Send a single test “Welcome” email to verify the SMTP integration  */
export async function sendTestWelcomeEmail(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const testEmail = formData.get("testEmail") as string

    if (!testEmail) {
      return {
        success: false,
        message: "Test email address is required",
        error: "Missing email address",
      }
    }

    // Send test email
    const emailSent = await sendWelcomeEmail({
      name: "Test User",
      email: testEmail,
      parent_location: "Mumbai, India",
      care_plan: "Peace Plan - $50/month",
      waitlist_number: 999,
    })

    if (emailSent) {
      return {
        success: true,
        message: "Test email sent successfully! Check your inbox.",
      }
    } else {
      return {
        success: false,
        message: "Failed to send test email. Check your configuration.",
        error: "Email service failed",
      }
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return {
      success: false,
      message: "Failed to send test email",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
