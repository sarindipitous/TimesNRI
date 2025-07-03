import { type NextRequest, NextResponse } from "next/server"
import { getCampaignById, getCampaignRecipients } from "@/lib/email-campaigns"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign ID is required",
        },
        { status: 400 },
      )
    }

    if (!hasDb) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not available",
        },
        { status: 500 },
      )
    }

    // Get campaign details
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found",
        },
        { status: 404 },
      )
    }

    // Get all waitlist emails for comparison
    const allWaitlistEmails = await sql`
      SELECT email, name FROM waitlist_submissions 
      ORDER BY created_at DESC
    `

    // Get campaign recipients
    const campaignRecipients = await getCampaignRecipients(campaign)

    // Analysis based on target type
    const analysis = {
      targetType: campaign.target_type,
      expectedBehavior: "",
      actualRecipients: campaignRecipients.length,
      totalWaitlistUsers: allWaitlistEmails.length,
      isCorrect: false,
      details: {},
    }

    if (campaign.target_type === "all") {
      analysis.expectedBehavior = "Should target all waitlist users"
      analysis.isCorrect = campaignRecipients.length === allWaitlistEmails.length
      analysis.details = {
        expected: allWaitlistEmails.length,
        actual: campaignRecipients.length,
        difference: allWaitlistEmails.length - campaignRecipients.length,
      }
    } else if (campaign.target_type === "selected") {
      const selectedEmails = campaign.selected_recipients || []
      analysis.expectedBehavior = `Should target only ${selectedEmails.length} selected users`
      analysis.isCorrect = campaignRecipients.length === selectedEmails.length

      // Verify that all selected emails are in the recipient list
      const recipientEmails = campaignRecipients.map((r) => r.email)
      const correctlyTargeted = selectedEmails.every((email) => recipientEmails.includes(email))
      const noExtraRecipients = recipientEmails.every((email) => selectedEmails.includes(email))

      analysis.isCorrect = correctlyTargeted && noExtraRecipients

      analysis.details = {
        selectedEmails: selectedEmails,
        recipientEmails: recipientEmails,
        correctlyTargeted: correctlyTargeted,
        noExtraRecipients: noExtraRecipients,
        missingRecipients: selectedEmails.filter((email) => !recipientEmails.includes(email)),
        extraRecipients: recipientEmails.filter((email) => !selectedEmails.includes(email)),
      }
    } else if (campaign.target_type === "filtered") {
      analysis.expectedBehavior = "Should target users matching filter criteria"
      // This would need more complex logic based on the filter criteria
      analysis.details = {
        criteria: campaign.target_criteria,
        note: "Filtered targeting analysis requires specific criteria evaluation",
      }
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
      targeting: analysis,
      recipients: {
        list: campaignRecipients.map((r) => ({ email: r.email, name: r.name })),
        count: campaignRecipients.length,
      },
      validation: {
        status: analysis.isCorrect ? "PASS" : "FAIL",
        message: analysis.isCorrect
          ? "Recipient targeting is working correctly"
          : "Recipient targeting has issues - check details",
      },
    })
  } catch (error) {
    console.error("Recipient targeting verification error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify recipient targeting",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
