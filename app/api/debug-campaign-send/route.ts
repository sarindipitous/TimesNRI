import { NextResponse } from "next/server"
import { getCampaignById } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { campaignId, testEmail } = await request.json()

    if (!campaignId || !testEmail) {
      return NextResponse.json({
        success: false,
        error: "Campaign ID and test email are required",
      })
    }

    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: "Campaign not found",
      })
    }

    // Replace template variables in the campaign HTML content
    let htmlContent = campaign.html_content
    htmlContent = htmlContent.replace(/\{\{name\}\}/g, "Test User")
    htmlContent = htmlContent.replace(/\{\{email\}\}/g, testEmail)
    htmlContent = htmlContent.replace(/\{\{subject\}\}/g, campaign.subject)

    // Test sending the actual campaign content
    const testPayload = {
      to: testEmail,
      from: `${campaign.from_name} <${campaign.from_email}>`,
      subject: `[TEST] ${campaign.subject}`,
      html: htmlContent,
    }

    // Try Resend
    if (process.env.RESEND_API_KEY) {
      const fromEmail = campaign.from_email.includes("@timesnri.com") ? campaign.from_email : "noreply@timesnri.com"

      const resendPayload = {
        from: `${campaign.from_name} <${fromEmail}>`,
        to: [testEmail],
        subject: testPayload.subject,
        html: htmlContent,
      }

      console.log("Debug campaign send payload:", JSON.stringify(resendPayload, null, 2))

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendPayload),
      })

      const responseData = await response.json()

      return NextResponse.json({
        success: response.ok,
        campaign_info: {
          id: campaign.id,
          name: campaign.name,
          subject: campaign.subject,
          from: `${campaign.from_name} <${campaign.from_email}>`,
          target_type: campaign.target_type,
        },
        test_payload: testPayload,
        resend_payload: resendPayload,
        email_service_response: {
          status: response.status,
          data: responseData,
        },
        html_preview: htmlContent.substring(0, 500) + "...",
      })
    }

    return NextResponse.json({
      success: false,
      error: "No email service available",
      campaign_info: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        from: `${campaign.from_name} <${campaign.from_email}>`,
      },
      test_payload: testPayload,
      html_preview: htmlContent.substring(0, 500) + "...",
    })
  } catch (error) {
    console.error("Error in debug campaign send:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to debug campaign send",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
