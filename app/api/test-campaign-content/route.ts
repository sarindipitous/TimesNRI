import { NextResponse } from "next/server"
import { getCampaignById } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { campaignId, testRecipient } = await request.json()

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

    // Test recipient data
    const recipient = testRecipient || {
      email: "test@example.com",
      name: "Test User",
    }

    // Process template variables exactly as the campaign system does
    let htmlContent = campaign.html_content
    htmlContent = htmlContent.replace(/\{\{name\}\}/g, recipient.name || "Valued Member")
    htmlContent = htmlContent.replace(/\{\{email\}\}/g, recipient.email)
    htmlContent = htmlContent.replace(/\{\{subject\}\}/g, campaign.subject)

    // Construct email payload exactly as campaign system does
    const emailPayload = {
      to: recipient.email,
      from: `${campaign.from_name} <${campaign.from_email}>`,
      subject: campaign.subject,
      html: htmlContent,
    }

    // Parse from field for verification
    const fromMatch = emailPayload.from.match(/^(.+?)\s*<(.+)>$/)
    const fromEmail = fromMatch ? fromMatch[2].trim() : emailPayload.from
    const fromName = fromMatch ? fromMatch[1].trim() : ""

    // Check if domain switching would occur
    const finalFromEmail = fromEmail.includes("@timesnri.com") ? fromEmail : "noreply@timesnri.com"
    const domainSwitched = finalFromEmail !== fromEmail

    return NextResponse.json({
      success: true,
      campaign_info: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        from_name: campaign.from_name,
        from_email: campaign.from_email,
        target_type: campaign.target_type,
        status: campaign.status,
      },
      test_recipient: recipient,
      processed_content: {
        subject: emailPayload.subject,
        from: emailPayload.from,
        to: emailPayload.to,
        html_preview: htmlContent.substring(0, 500) + (htmlContent.length > 500 ? "..." : ""),
        html_length: htmlContent.length,
      },
      email_service_details: {
        original_from_email: fromEmail,
        final_from_email: finalFromEmail,
        domain_switched: domainSwitched,
        parsed_from_name: fromName,
      },
      template_variables_found: {
        name_placeholders: (campaign.html_content.match(/\{\{name\}\}/g) || []).length,
        email_placeholders: (campaign.html_content.match(/\{\{email\}\}/g) || []).length,
        subject_placeholders: (campaign.html_content.match(/\{\{subject\}\}/g) || []).length,
      },
      content_analysis: {
        contains_html: htmlContent.includes("<"),
        contains_styling: htmlContent.includes("style=") || htmlContent.includes("<style"),
        estimated_size_kb: Math.round((htmlContent.length / 1024) * 100) / 100,
      },
    })
  } catch (error) {
    console.error("Error testing campaign content:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to test campaign content",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
