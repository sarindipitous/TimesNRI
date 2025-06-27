"use server"

import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"
import { sendWelcomeEmail } from "@/lib/email-service"

const sql = neon(process.env.DATABASE_URL!)

export async function createWaitlistSubmissionAction(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const source = (formData.get("source") as string) || "main-form"
    const location = formData.get("location") as string
    const parent_location = formData.get("parent_location") as string
    const care_needs = formData.get("care_needs") as string
    const care_plan = formData.get("care_plan") as string
    const care_plan_interest = formData.get("care_plan_interest") as string
    const referred_by = formData.get("referred_by") as string

    if (!email) {
      return {
        success: false,
        message: "Email is required",
      }
    }

    // Get next waitlist number
    const countResult = await sql`SELECT COUNT(*) as count FROM waitlist_submissions`
    const waitlist_number = Number(countResult[0]?.count || 0) + 1

    // Insert new submission
    const result = await sql`
      INSERT INTO waitlist_submissions (
        email, name, source, location, parent_location, care_needs, 
        care_plan, care_plan_interest, waitlist_number, referred_by, created_at
      ) VALUES (
        ${email}, ${name || null}, ${source}, ${location || null}, ${parent_location || null}, 
        ${care_needs || null}, ${care_plan || null}, ${care_plan_interest || null}, ${waitlist_number}, 
        ${referred_by || null}, ${new Date().toISOString()}
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

    revalidatePath("/admin")
    revalidatePath("/admin/waitlist")

    if (result.success) {
      // Try to send welcome email
      try {
        await sendWelcomeEmail(email, name || "Friend", result.waitlist_number || 1)
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
        // Don't fail the whole operation if email fails
      }
    }

    return result
  } catch (error) {
    console.error("Server action error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function updateEmailConfiguration(formData: FormData) {
  try {
    const service = formData.get("service") as string
    const apiKey = formData.get("apiKey") as string
    const fromEmail = formData.get("fromEmail") as string
    const fromName = formData.get("fromName") as string

    await sql`
      INSERT INTO email_config (service, api_key, from_email, from_name, created_at)
      VALUES (${service}, ${apiKey}, ${fromEmail}, ${fromName}, ${new Date().toISOString()})
    `

    return {
      success: true,
      message: "Email configuration updated successfully",
    }
  } catch (error) {
    console.error("Email config error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
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

    // For now, just return success since we don't have email service configured
    return {
      success: true,
      message: `Test email would be sent to ${testEmail}`,
    }
  } catch (error) {
    console.error("Test email error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
