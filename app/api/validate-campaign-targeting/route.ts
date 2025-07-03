import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { getCampaignById, getCampaignRecipients } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({
        success: false,
        error: "Campaign ID is required",
      })
    }

    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error: "Database not available",
      })
    }

    console.log(`[TARGETING QA] Validating campaign ${campaignId}`)

    // Get campaign
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: "Campaign not found",
      })
    }

    // Get total waitlist count for comparison
    const totalWaitlistResult = await sql`SELECT COUNT(*) as count FROM waitlist_submissions`
    const totalWaitlistCount = Number(totalWaitlistResult[0].count)

    // Get campaign recipients using the actual targeting logic
    const recipients = await getCampaignRecipients(campaign)

    // Validation results
    const validation = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      targetType: campaign.target_type,
      totalWaitlistCount,
      recipientCount: recipients.length,
      issues: [] as string[],
      warnings: [] as string[],
      isValid: true,
      details: {
        selectedRecipients: campaign.selected_recipients,
        targetCriteria: campaign.target_criteria,
        actualRecipients: recipients.map((r) => r.email),
      },
    }

    // Validate based on target type
    if (campaign.target_type === "all") {
      if (recipients.length !== totalWaitlistCount) {
        validation.issues.push(`Expected ${totalWaitlistCount} recipients but got ${recipients.length}`)
        validation.isValid = false
      }
    } else if (campaign.target_type === "selected") {
      const selectedEmails = campaign.selected_recipients || []

      // Check if selected_recipients is properly formatted
      if (!Array.isArray(selectedEmails)) {
        validation.issues.push("selected_recipients is not an array")
        validation.isValid = false
      } else if (selectedEmails.length === 0) {
        validation.issues.push("No recipients selected for 'selected' targeting")
        validation.isValid = false
      } else {
        // Check if recipient count matches selection
        if (recipients.length !== selectedEmails.length) {
          validation.warnings.push(
            `Selected ${selectedEmails.length} emails but targeting ${recipients.length} recipients`,
          )
        }

        // CRITICAL: Check for mass email bug
        if (recipients.length === totalWaitlistCount && selectedEmails.length < totalWaitlistCount) {
          validation.issues.push(
            `CRITICAL: Selected ${selectedEmails.length} recipients but would target ALL ${totalWaitlistCount} waitlist members!`,
          )
          validation.isValid = false
        }

        // Verify selected emails are in recipient list
        const recipientEmails = recipients.map((r) => r.email)
        const missingEmails = selectedEmails.filter((email) => !recipientEmails.includes(email))
        const extraEmails = recipientEmails.filter((email) => !selectedEmails.includes(email))

        if (missingEmails.length > 0) {
          validation.warnings.push(`Selected emails not in waitlist: ${missingEmails.join(", ")}`)
        }

        if (extraEmails.length > 0) {
          validation.warnings.push(`Extra recipients not selected: ${extraEmails.join(", ")}`)
        }
      }
    } else if (campaign.target_type === "filtered") {
      if (!campaign.target_criteria) {
        validation.issues.push("No filter criteria specified for filtered targeting")
        validation.isValid = false
      }
      // Additional validation for filtered targeting could be added here
    } else {
      validation.issues.push(`Invalid target type: ${campaign.target_type}`)
      validation.isValid = false
    }

    // Additional safety checks
    if (recipients.length > 1000) {
      validation.warnings.push(
        `Large recipient count (${recipients.length}) - consider testing with smaller group first`,
      )
    }

    console.log(`[TARGETING QA] Campaign ${campaignId} validation: ${validation.isValid ? "VALID" : "INVALID"}`)

    return NextResponse.json({
      success: true,
      validation,
      recommendation: validation.isValid
        ? validation.warnings.length > 0
          ? "Valid with warnings - review before sending"
          : "Valid and safe to send"
        : "Invalid - fix issues before sending",
    })
  } catch (error) {
    console.error("[TARGETING QA] Validation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate campaign targeting",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
