"use server"

import {
  addToWaitlist,
  addReferral,
  addDetailedReferral,
  getWaitlistSubmissionByEmail,
  updateWaitlistSubmission,
  deleteWaitlistSubmission,
} from "@/lib/db"

// A more robust email validation function
function isValidEmail(email: string): boolean {
  // Basic email regex that allows most valid email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function submitToWaitlist(formData: FormData) {
  try {
    // Extract all form data for debugging
    const formDataObj: Record<string, any> = {}
    formData.forEach((value, key) => {
      formDataObj[key] = value
    })

    console.log("Raw form data received:", formDataObj)

    const email = formData.get("email") as string
    const source = (formData.get("source") as string) || "main-form"
    const name = (formData.get("name") as string) || undefined
    const location = (formData.get("city") as string) || undefined
    const parentLocation = (formData.get("parentLocation") as string) || undefined
    const careNeeds = (formData.get("careNeeds") as string) || undefined
    const referredBy = (formData.get("referredBy") as string) || undefined

    console.log("Processed form data:", {
      email,
      source,
      name,
      location,
      parentLocation,
      careNeeds,
      referredBy,
      emailValid: isValidEmail(email),
    })

    // Improved email validation with more detailed error
    if (!email) {
      console.log("Email validation failed: Email is empty")
      return {
        success: false,
        message: "Email address is required.",
      }
    }

    if (!isValidEmail(email)) {
      console.log(`Email validation failed for: "${email}"`)
      return {
        success: false,
        message: "Please provide a valid email address.",
      }
    }

    // Try to add to waitlist even if validation seems to fail (for debugging)
    console.log("Attempting to add to waitlist:", { email, source, name, location, parentLocation, careNeeds })

    try {
      // Add to waitlist with all available fields
      let submission
      try {
        submission = await addToWaitlist(email, source, name, location, parentLocation, careNeeds)
        console.log("Database response:", submission)
      } catch (dbError) {
        console.error("Database operation error:", dbError)

        // Check if this is a connection error
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
        if (errorMessage.includes("connection")) {
          return {
            success: false,
            message: "Database connection error. Please try again later.",
            error: errorMessage,
          }
        }

        // Check for constraint violations
        if (errorMessage.includes("constraint") || errorMessage.includes("duplicate")) {
          return {
            success: false,
            message: "This email is already registered. Please use a different email.",
            error: errorMessage,
          }
        }

        return {
          success: false,
          message: "Database error: " + errorMessage,
          error: errorMessage,
        }
      }

      if (!submission) {
        console.log("Database returned null submission")
        return {
          success: false,
          message: "Could not create submission. Please try again.",
        }
      }

      // Handle referral if applicable
      if (referredBy) {
        const referrer = await getWaitlistSubmissionByEmail(referredBy)
        if (referrer) {
          // Add to both referral tables for backward compatibility
          await addReferral(referrer.id, email)
          await addDetailedReferral(referrer.id, email, submission.id)
        }
      }

      // Get referral link
      let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://times-nri.vercel.app"
      // Ensure the URL has a protocol
      if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
        siteUrl = `https://${siteUrl}`
      }
      const referralLink = `${siteUrl}?ref=${encodeURIComponent(email)}`

      console.log("Submission successful, returning success response")

      return {
        success: true,
        message: "You've been added to our waitlist!",
        referralLink,
        submissionId: submission.id,
        waitlistNumber: submission.waitlist_number,
      }
    } catch (dbError) {
      console.error("Database operation error:", dbError)
      return {
        success: false,
        message: "Database error: " + (dbError instanceof Error ? dbError.message : "Unknown error"),
      }
    }
  } catch (error) {
    console.error(
      "Detailed error in submitToWaitlist:",
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error,
    )
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function submitReferrals(formData: FormData) {
  try {
    const referrerEmail = formData.get("referrerEmail") as string
    const referredEmails = (formData.get("referredEmails") as string).split(",").map((email) => email.trim())

    if (!referrerEmail || !isValidEmail(referrerEmail)) {
      return {
        success: false,
        message: "Invalid referrer email.",
      }
    }

    if (!referredEmails.length || !referredEmails.every((email) => isValidEmail(email))) {
      return {
        success: false,
        message: "Please provide valid email addresses for your referrals.",
      }
    }

    const referrer = await getWaitlistSubmissionByEmail(referrerEmail)
    if (!referrer) {
      return {
        success: false,
        message: "Referrer not found in waitlist.",
      }
    }

    // Add all referrals to both tables
    const referralPromises = referredEmails.map(async (email) => {
      await addReferral(referrer.id, email)

      // Check if the referred person is already in the waitlist
      const referred = await getWaitlistSubmissionByEmail(email)
      if (referred) {
        await addDetailedReferral(referrer.id, email, referred.id)
      } else {
        await addDetailedReferral(referrer.id, email)
      }
    })

    await Promise.all(referralPromises)

    return {
      success: true,
      message: `Successfully added ${referredEmails.length} referrals!`,
    }
  } catch (error) {
    console.error("Error in submitReferrals:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function updateWaitlistEntry(formData: FormData) {
  try {
    const id = Number.parseInt(formData.get("id") as string)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const location = formData.get("location") as string
    const parentLocation = formData.get("parentLocation") as string
    const careNeeds = formData.get("careNeeds") as string

    if (!id || isNaN(id)) {
      return {
        success: false,
        message: "Invalid submission ID.",
      }
    }

    if (!email || !isValidEmail(email)) {
      return {
        success: false,
        message: "Please provide a valid email address.",
      }
    }

    const updatedSubmission = await updateWaitlistSubmission(id, {
      name,
      email,
      location,
      parent_location: parentLocation,
      care_needs: careNeeds,
    })

    if (!updatedSubmission) {
      return {
        success: false,
        message: "Failed to update waitlist entry. Please try again.",
      }
    }

    return {
      success: true,
      message: "Waitlist entry updated successfully!",
      submission: updatedSubmission,
    }
  } catch (error) {
    console.error("Error in updateWaitlistEntry:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function deleteWaitlistEntry(formData: FormData) {
  try {
    const id = Number.parseInt(formData.get("id") as string)

    if (!id || isNaN(id)) {
      return {
        success: false,
        message: "Invalid submission ID.",
      }
    }

    const success = await deleteWaitlistSubmission(id)

    if (!success) {
      return {
        success: false,
        message: "Failed to delete waitlist entry. Please try again.",
      }
    }

    return {
      success: true,
      message: "Waitlist entry deleted successfully!",
    }
  } catch (error) {
    console.error("Error in deleteWaitlistEntry:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}
