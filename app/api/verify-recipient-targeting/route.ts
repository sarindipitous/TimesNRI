import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { getCampaignById, getCampaignRecipients } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { campaignId, expectedRecipients } = await request.json()

    if (!campaignId) {
      return NextResponse.json({
        success: false,
        error: "Campaign ID is required",
      })
    }

    const campaign = await getCampaignById(Number.parseInt(campaignId))
    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: "Campaign not found",
      })
    }

    // Get actual recipients that would be targeted
    const actualRecipients = await getCampaignRecipients(campaign)
    const actualEmails = actualRecipients.map((r) => r.email).sort()

    // Get all waitlist members for comparison
    let allWaitlistMembers: any[] = []
    if (hasDb) {
      allWaitlistMembers = await sql`
        SELECT email, name FROM waitlist_submissions 
        ORDER BY email
      `
    }

    // Analyze targeting accuracy
    const targetingAnalysis: any = {
      campaign_target_type: campaign.target_type,
      actual_recipient_count: actualRecipients.length,
      actual_recipients: actualEmails,
    }

    if (campaign.target_type === "all") {
      const allEmails = allWaitlistMembers.map((m) => m.email).sort()
      targetingAnalysis.expected_all_waitlist = allEmails
      targetingAnalysis.targeting_correct = JSON.stringify(actualEmails) === JSON.stringify(allEmails)
      targetingAnalysis.missing_recipients = allEmails.filter((email) => !actualEmails.includes(email))
      targetingAnalysis.unexpected_recipients = actualEmails.filter((email) => !allEmails.includes(email))
    }

    if (campaign.target_type === "selected") {
      const selectedEmails = (campaign.selected_recipients || []).sort()
      targetingAnalysis.expected_selected = selectedEmails

      // Check if actual recipients match selected recipients
      const selectedInWaitlist = selectedEmails.filter((email) => allWaitlistMembers.some((m) => m.email === email))

      targetingAnalysis.targeting_correct = JSON.stringify(actualEmails) === JSON.stringify(selectedInWaitlist)
      targetingAnalysis.selected_not_in_waitlist = selectedEmails.filter(
        (email) => !allWaitlistMembers.some((m) => m.email === email),
      )
      targetingAnalysis.missing_from_actual = selectedInWaitlist.filter((email) => !actualEmails.includes(email))
      targetingAnalysis.unexpected_in_actual = actualEmails.filter((email) => !selectedInWaitlist.includes(email))
    }

    if (campaign.target_type === "filtered") {
      targetingAnalysis.filter_criteria = campaign.target_criteria
      // Add more detailed filtering analysis if needed
    }

    // Test with expected recipients if provided
    if (expectedRecipients && Array.isArray(expectedRecipients)) {
      const expectedEmails = expectedRecipients.sort()
      targetingAnalysis.user_expected = expectedEmails
      targetingAnalysis.matches_user_expectation = JSON.stringify(actualEmails) === JSON.stringify(expectedEmails)
      targetingAnalysis.missing_from_user_expected = expectedEmails.filter((email) => !actualEmails.includes(email))
      targetingAnalysis.unexpected_from_user_expected = actualEmails.filter((email) => !expectedEmails.includes(email))
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        target_type: campaign.target_type,
        selected_recipients: campaign.selected_recipients,
        target_criteria: campaign.target_criteria,
      },
      targeting_analysis: targetingAnalysis,
      waitlist_summary: {
        total_waitlist_members: allWaitlistMembers.length,
        sample_emails: allWaitlistMembers.slice(0, 5).map((m) => m.email),
      },
    })
  } catch (error) {
    console.error("Error verifying recipient targeting:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to verify recipient targeting",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
