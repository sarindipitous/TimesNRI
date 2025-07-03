import { NextResponse } from "next/server"
import { getCampaignById, getCampaignRecipients } from "@/lib/email-campaigns"
import { sql, hasDb } from "@/lib/db"

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

    console.log(`[CAMPAIGN SAFETY] Testing campaign ${campaignId} for production safety`)

    // Get campaign details
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: "Campaign not found",
      })
    }

    // Get recipients that would be targeted
    const recipients = await getCampaignRecipients(campaign)

    // Safety analysis
    const safetyAnalysis = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      targetType: campaign.target_type,
      recipientCount: recipients.length,
      safetyChecks: {
        hasRecipients: recipients.length > 0,
        reasonableSize: recipients.length <= 1000, // Flag if too many recipients
        hasContent: campaign.html_content && campaign.html_content.length > 0,
        hasSubject: campaign.subject && campaign.subject.length > 0,
        hasFromEmail: campaign.from_email && campaign.from_email.includes("@"),
        isNotWelcomeEmail: !campaign.html_content.toLowerCase().includes("welcome to our waitlist"),
        hasTemplateVariables: campaign.html_content.includes("{{name}}") || campaign.html_content.includes("{{email}}"),
      },
      recipients: recipients.slice(0, 10).map((r) => ({ email: r.email, name: r.name })), // Show first 10 for review
      contentPreview: {
        subject: campaign.subject,
        fromEmail: campaign.from_email,
        fromName: campaign.from_name,
        htmlPreview: campaign.html_content.substring(0, 500) + (campaign.html_content.length > 500 ? "..." : ""),
        htmlLength: campaign.html_content.length,
      },
    }

    // Process template variables for preview
    let processedHtml = campaign.html_content
    processedHtml = processedHtml.replace(/\{\{name\}\}/g, "John Doe")
    processedHtml = processedHtml.replace(/\{\{email\}\}/g, "john@example.com")
    processedHtml = processedHtml.replace(/\{\{subject\}\}/g, campaign.subject)

    safetyAnalysis.contentPreview.processedHtmlPreview =
      processedHtml.substring(0, 500) + (processedHtml.length > 500 ? "..." : "")

    // Determine safety status
    const criticalIssues = []
    const warnings = []

    if (!safetyAnalysis.safetyChecks.hasRecipients) {
      criticalIssues.push("No recipients found - campaign will not send to anyone")
    }

    if (!safetyAnalysis.safetyChecks.hasContent) {
      criticalIssues.push("Campaign has no content")
    }

    if (!safetyAnalysis.safetyChecks.hasSubject) {
      criticalIssues.push("Campaign has no subject line")
    }

    if (!safetyAnalysis.safetyChecks.hasFromEmail) {
      criticalIssues.push("Invalid from email address")
    }

    if (!safetyAnalysis.safetyChecks.reasonableSize) {
      warnings.push(`Large recipient count (${recipients.length}) - consider testing with smaller group first`)
    }

    if (!safetyAnalysis.safetyChecks.isNotWelcomeEmail) {
      warnings.push("Content appears to be welcome email template - verify this is intentional")
    }

    if (!safetyAnalysis.safetyChecks.hasTemplateVariables) {
      warnings.push("No template variables found - emails will be identical for all recipients")
    }

    // Targeting analysis
    let targetingAnalysis = {}

    if (campaign.target_type === "selected" && campaign.selected_recipients) {
      const selectedEmails = campaign.selected_recipients
      const actualEmails = recipients.map((r) => r.email)

      targetingAnalysis = {
        selectedCount: selectedEmails.length,
        actualCount: actualEmails.length,
        matchesSelection: selectedEmails.length === actualEmails.length,
        selectedEmails: selectedEmails,
        actualEmails: actualEmails,
        missingFromActual: selectedEmails.filter((email) => !actualEmails.includes(email)),
        extraInActual: actualEmails.filter((email) => !selectedEmails.includes(email)),
      }

      if (!targetingAnalysis.matchesSelection) {
        warnings.push("Selected recipients don't match actual recipients - some may not be in waitlist")
      }
    } else if (campaign.target_type === "all") {
      const totalWaitlist = await sql`SELECT COUNT(*) as count FROM waitlist_submissions`
      const totalCount = Number(totalWaitlist[0].count)

      targetingAnalysis = {
        expectedCount: totalCount,
        actualCount: recipients.length,
        matchesExpected: totalCount === recipients.length,
      }

      if (!targetingAnalysis.matchesExpected) {
        warnings.push("Recipient count doesn't match total waitlist - some users may be excluded")
      }
    }

    const isSafe = criticalIssues.length === 0
    const hasWarnings = warnings.length > 0

    console.log(
      `[CAMPAIGN SAFETY] Campaign ${campaignId} safety check: ${isSafe ? "SAFE" : "UNSAFE"}, ${warnings.length} warnings`,
    )

    return NextResponse.json({
      success: true,
      campaignSafety: {
        isSafe,
        hasWarnings,
        status: isSafe ? (hasWarnings ? "SAFE_WITH_WARNINGS" : "SAFE") : "UNSAFE",
        criticalIssues,
        warnings,
      },
      safetyAnalysis,
      targetingAnalysis,
      recommendation: isSafe
        ? hasWarnings
          ? "Campaign is safe to send but review warnings carefully"
          : "Campaign is safe to send"
        : "DO NOT SEND - Fix critical issues first",
    })
  } catch (error) {
    console.error("Campaign safety test error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to test campaign safety",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
