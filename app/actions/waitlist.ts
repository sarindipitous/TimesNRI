"use server"

import {
  addToWaitlist,
  addReferral,
  addDetailedReferral,
  getWaitlistSubmissionByEmail,
  updateWaitlistSubmission,
  deleteWaitlistSubmission,
} from "@/lib/db"

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

    return {
      success: true,
      message: "You've been added to our waitlist!",
      referralLink: `${siteUrl}?ref=${encodeURIComponent(email)}`,
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
