import { NextResponse } from "next/server"
import { getCampaignRecipients, getCampaignById } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")

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

    const recipients = await getCampaignRecipients(campaign)

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        target_type: campaign.target_type,
        selected_recipients: campaign.selected_recipients,
      },
      recipients: recipients.map((r) => ({
        email: r.email,
        name: r.name,
      })),
      targeting_analysis: {
        target_type: campaign.target_type,
        expected_count: recipients.length,
        selected_emails: campaign.target_type === "selected" ? campaign.selected_recipients : null,
        actual_recipients: recipients.map((r) => r.email),
        targeting_correct:
          campaign.target_type === "selected"
            ? campaign.selected_recipients?.every((email) => recipients.some((r) => r.email === email))
            : true,
      },
    })
  } catch (error) {
    console.error("Error testing campaign targeting:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to test campaign targeting",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
