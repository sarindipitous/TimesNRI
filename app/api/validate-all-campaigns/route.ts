import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { getAllCampaigns, getCampaignRecipients } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error: "Database not available",
      })
    }

    console.log("[CAMPAIGN VALIDATION] Starting validation of all campaigns")

    const allCampaigns = await getAllCampaigns()
    const validationResults = []
    const criticalIssues = []
    const warnings = []

    // Get total waitlist count for comparison
    const totalWaitlistResult = await sql`SELECT COUNT(*) as count FROM waitlist_submissions`
    const totalWaitlistCount = Number(totalWaitlistResult[0].count)

    for (const campaign of allCampaigns) {
      console.log(`[CAMPAIGN VALIDATION] Validating campaign ${campaign.id}: ${campaign.name}`)

      const validation = {
        campaignId: campaign.id,
        name: campaign.name,
        targetType: campaign.target_type,
        status: campaign.status,
        issues: [],
        warnings: [],
        isValid: true,
      }

      try {
        // Validate selected targeting
        if (campaign.target_type === "selected") {
          let selectedEmails = campaign.selected_recipients

          // Test JSON parsing
          if (typeof selectedEmails === "string") {
            try {
              selectedEmails = JSON.parse(selectedEmails)
            } catch (e) {
              validation.issues.push("Invalid JSON in selected_recipients")
              validation.isValid = false
              continue
            }
          }

          // Test array validation
          if (!Array.isArray(selectedEmails)) {
            validation.issues.push("selected_recipients is not an array")
            validation.isValid = false
            continue
          }

          // Test recipient targeting
          const recipients = await getCampaignRecipients(campaign)

          // CRITICAL: Check for mass email bug
          if (recipients.length === totalWaitlistCount && selectedEmails.length < totalWaitlistCount) {
            validation.issues.push(
              `CRITICAL MASS EMAIL BUG: Selected ${selectedEmails.length} but targets ALL ${totalWaitlistCount} users`,
            )
            validation.isValid = false
            criticalIssues.push({
              campaignId: campaign.id,
              issue: "Mass email bug detected",
              severity: "CRITICAL",
            })
          }

          // Check recipient count
          if (recipients.length !== selectedEmails.length) {
            validation.issues.push(
              `Recipient count mismatch: selected ${selectedEmails.length}, targeting ${recipients.length}`,
            )
            validation.isValid = false
          }

          // Check email matching
          const recipientEmails = recipients.map((r) => r.email)
          const missingEmails = selectedEmails.filter((email) => !recipientEmails.includes(email))
          const extraEmails = recipientEmails.filter((email) => !selectedEmails.includes(email))

          if (missingEmails.length > 0) {
            validation.warnings.push(`Missing emails in recipients: ${missingEmails.join(", ")}`)
          }

          if (extraEmails.length > 0) {
            validation.issues.push(`Extra emails in recipients: ${extraEmails.join(", ")}`)
            validation.isValid = false
          }

          validation.selectedCount = selectedEmails.length
          validation.recipientCount = recipients.length
          validation.selectedEmails = selectedEmails
          validation.recipientEmails = recipientEmails
        }

        // Validate all targeting
        else if (campaign.target_type === "all") {
          const recipients = await getCampaignRecipients(campaign)

          if (recipients.length !== totalWaitlistCount) {
            validation.warnings.push(
              `All targeting not returning all users: ${recipients.length}/${totalWaitlistCount}`,
            )
          }

          validation.recipientCount = recipients.length
          validation.expectedCount = totalWaitlistCount
        }

        // Validate filtered targeting
        else if (campaign.target_type === "filtered") {
          const recipients = await getCampaignRecipients(campaign)
          validation.recipientCount = recipients.length

          if (!campaign.target_criteria) {
            validation.warnings.push("No filter criteria specified")
          }
        }

        // Validate campaign content
        if (!campaign.html_content || campaign.html_content.trim().length === 0) {
          validation.warnings.push("Campaign has no content")
        }

        if (!campaign.subject || campaign.subject.trim().length === 0) {
          validation.warnings.push("Campaign has no subject")
        }

        if (!campaign.from_email || !campaign.from_email.includes("@")) {
          validation.warnings.push("Invalid from email")
        }
      } catch (error) {
        validation.issues.push(`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`)
        validation.isValid = false
      }

      validationResults.push(validation)

      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings.map((w) => `Campaign ${campaign.id}: ${w}`))
      }
    }

    const validCampaigns = validationResults.filter((v) => v.isValid)
    const invalidCampaigns = validationResults.filter((v) => !v.isValid)
    const campaignsWithWarnings = validationResults.filter((v) => v.warnings.length > 0)

    const overallValid = invalidCampaigns.length === 0 && criticalIssues.length === 0

    console.log(
      `[CAMPAIGN VALIDATION] Completed. Valid: ${validCampaigns.length}, Invalid: ${invalidCampaigns.length}, Critical Issues: ${criticalIssues.length}`,
    )

    return NextResponse.json({
      success: true,
      overallValid,
      summary: {
        totalCampaigns: allCampaigns.length,
        validCampaigns: validCampaigns.length,
        invalidCampaigns: invalidCampaigns.length,
        campaignsWithWarnings: campaignsWithWarnings.length,
        criticalIssues: criticalIssues.length,
        totalWarnings: warnings.length,
      },
      validationResults,
      criticalIssues,
      warnings,
      recommendation: overallValid
        ? "✅ All campaigns are valid and safe for production"
        : "❌ CRITICAL ISSUES FOUND - Fix before deployment",
      deploymentDecision: overallValid ? "APPROVED" : "BLOCKED",
      totalWaitlistCount,
    })
  } catch (error) {
    console.error("Campaign validation error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to validate campaigns",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
