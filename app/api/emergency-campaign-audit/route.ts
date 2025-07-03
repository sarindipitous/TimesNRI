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
        error: "Campaign ID is required for audit",
      })
    }

    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error: "Database not available",
      })
    }

    // Get campaign details
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: "Campaign not found",
      })
    }

    // Get all waitlist members
    const allWaitlistMembers = await sql`
      SELECT email, name, created_at FROM waitlist_submissions 
      ORDER BY created_at DESC
    `

    // Get campaign recipients using the SAME logic as sending
    const campaignRecipients = await getCampaignRecipients(campaign)

    // Get actual campaign logs (who was actually sent to)
    const campaignLogs = await sql`
      SELECT recipient_email, recipient_name, status, sent_at, error_message, email_service
      FROM email_campaign_logs 
      WHERE campaign_id = ${campaignId}
      ORDER BY created_at DESC
    `

    // CRITICAL ANALYSIS
    const audit = {
      campaign_info: {
        id: campaign.id,
        name: campaign.name,
        target_type: campaign.target_type,
        selected_recipients: campaign.selected_recipients,
        total_recipients: campaign.total_recipients,
        sent_count: campaign.sent_count,
        status: campaign.status,
      },
      targeting_analysis: {
        expected_behavior: "",
        actual_recipients_count: campaignRecipients.length,
        logs_count: campaignLogs.length,
        targeting_correct: false,
        critical_issue: false,
        issue_description: "",
      },
      recipient_comparison: {
        all_waitlist_count: allWaitlistMembers.length,
        campaign_recipients: campaignRecipients.map((r) => r.email),
        actual_logs: campaignLogs.map((log: any) => log.recipient_email),
        selected_in_campaign: campaign.selected_recipients || [],
      },
      logs_analysis: {
        sent_successfully: campaignLogs.filter((log: any) => log.status === "sent").length,
        failed: campaignLogs.filter((log: any) => log.status === "failed").length,
        pending: campaignLogs.filter((log: any) => log.status === "pending").length,
      },
    }

    // Analyze based on target type
    if (campaign.target_type === "all") {
      audit.targeting_analysis.expected_behavior = "Should send to ALL waitlist members"
      audit.targeting_analysis.targeting_correct = campaignRecipients.length === allWaitlistMembers.length

      if (campaignRecipients.length === allWaitlistMembers.length && campaign.target_type === "selected") {
        audit.targeting_analysis.critical_issue = true
        audit.targeting_analysis.issue_description = "CRITICAL: Campaign was set to 'selected' but sent to ALL users!"
      }
    } else if (campaign.target_type === "selected") {
      const selectedEmails = campaign.selected_recipients || []
      audit.targeting_analysis.expected_behavior = `Should send ONLY to ${selectedEmails.length} selected recipients`

      // Check if campaign recipients match selected recipients EXACTLY
      const campaignEmails = campaignRecipients.map((r) => r.email).sort()
      const selectedEmailsSorted = selectedEmails.sort()

      audit.targeting_analysis.targeting_correct =
        JSON.stringify(campaignEmails) === JSON.stringify(selectedEmailsSorted)

      // CRITICAL CHECK: Did it send to more people than selected?
      if (campaignRecipients.length > selectedEmails.length) {
        audit.targeting_analysis.critical_issue = true
        audit.targeting_analysis.issue_description = `CRITICAL: Selected ${selectedEmails.length} recipients but campaign targeted ${campaignRecipients.length} recipients!`
      }

      // Check if it sent to ALL users when only some were selected
      if (
        campaignRecipients.length === allWaitlistMembers.length &&
        selectedEmails.length < allWaitlistMembers.length
      ) {
        audit.targeting_analysis.critical_issue = true
        audit.targeting_analysis.issue_description = `CRITICAL: Selected ${selectedEmails.length} recipients but sent to ALL ${allWaitlistMembers.length} waitlist members!`
      }

      // Find unexpected recipients
      const unexpectedRecipients = campaignEmails.filter((email) => !selectedEmails.includes(email))
      if (unexpectedRecipients.length > 0) {
        audit.targeting_analysis.critical_issue = true
        audit.targeting_analysis.issue_description += ` Unexpected recipients: ${unexpectedRecipients.join(", ")}`
      }
    }

    // Additional safety checks
    const safetyChecks = {
      logs_match_recipients: campaignLogs.length === campaignRecipients.length,
      no_duplicate_sends: new Set(campaignLogs.map((log: any) => log.recipient_email)).size === campaignLogs.length,
      all_logs_accounted: campaignLogs.every((log: any) =>
        campaignRecipients.some((r) => r.email === log.recipient_email),
      ),
    }

    return NextResponse.json({
      success: true,
      audit,
      safety_checks: safetyChecks,
      raw_data: {
        campaign,
        all_waitlist_emails: allWaitlistMembers.map((m) => m.email),
        campaign_recipient_emails: campaignRecipients.map((r) => r.email),
        log_emails: campaignLogs.map((log: any) => log.recipient_email),
      },
      recommendation: audit.targeting_analysis.critical_issue
        ? "IMMEDIATE ACTION REQUIRED: Targeting issue detected!"
        : "Targeting appears correct",
    })
  } catch (error) {
    console.error("Emergency campaign audit error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to audit campaign",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
