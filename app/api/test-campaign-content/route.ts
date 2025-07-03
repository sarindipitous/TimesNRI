import { type NextRequest, NextResponse } from "next/server"
import { getCampaignById, getCampaignRecipients } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, testEmail } = await request.json()

    if (!campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign ID is required",
        },
        { status: 400 },
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

    // Get recipients for this campaign
    const recipients = await getCampaignRecipients(campaign)

    // Process template variables with test data
    const testRecipient = {
      name: "John Doe",
      email: testEmail || "test@example.com",
    }

    let processedHtml = campaign.html_content
    processedHtml = processedHtml.replace(/\{\{name\}\}/g, testRecipient.name)
    processedHtml = processedHtml.replace(/\{\{email\}\}/g, testRecipient.email)
    processedHtml = processedHtml.replace(/\{\{subject\}\}/g, campaign.subject)

    // Construct email payload that would be sent
    const emailPayload = {
      to: testRecipient.email,
      from: `${campaign.from_name} <${campaign.from_email}>`,
      subject: campaign.subject,
      html: processedHtml,
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        from_name: campaign.from_name,
        from_email: campaign.from_email,
        target_type: campaign.target_type,
        status: campaign.status,
      },
      recipients: {
        total: recipients.length,
        sample: recipients.slice(0, 5).map((r) => ({ email: r.email, name: r.name })),
      },
      processedContent: {
        originalHtml: campaign.html_content,
        processedHtml: processedHtml,
        templateVariables: {
          "{{name}}": testRecipient.name,
          "{{email}}": testRecipient.email,
          "{{subject}}": campaign.subject,
        },
      },
      emailPayload: emailPayload,
      contentAnalysis: {
        hasNameVariable: campaign.html_content.includes("{{name}}"),
        hasEmailVariable: campaign.html_content.includes("{{email}}"),
        hasSubjectVariable: campaign.html_content.includes("{{subject}}"),
        htmlLength: processedHtml.length,
        isWelcomeEmail:
          processedHtml.toLowerCase().includes("welcome") && processedHtml.toLowerCase().includes("waitlist"),
        isCampaignEmail: !processedHtml.toLowerCase().includes("welcome to our waitlist"),
      },
    })
  } catch (error) {
    console.error("Campaign content test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test campaign content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
