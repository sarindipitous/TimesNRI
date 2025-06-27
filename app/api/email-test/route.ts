import { NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"
import { getEmailConfig } from "@/lib/email-config"

export async function GET() {
  try {
    console.log("Testing email configuration...")

    // Check environment variables
    const sendgridKey = process.env.SENDGRID_API_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    console.log("Environment check:", {
      hasSendgridKey: !!sendgridKey,
      sendgridKeyPrefix: sendgridKey ? sendgridKey.substring(0, 10) + "..." : "not found",
      siteUrl,
    })

    // Check email configuration in database
    const [enabled, subject, fromName, fromEmail, template] = await Promise.all([
      getEmailConfig("welcome_email_enabled"),
      getEmailConfig("welcome_email_subject"),
      getEmailConfig("welcome_email_from_name"),
      getEmailConfig("welcome_email_from_email"),
      getEmailConfig("welcome_email_template"),
    ])

    const emailConfig = {
      enabled,
      subject,
      fromName,
      fromEmail,
      hasTemplate: !!template,
      templateLength: template?.length || 0,
    }

    console.log("Database email config:", emailConfig)

    // Test SendGrid API directly
    let sendgridTest = null
    if (sendgridKey) {
      try {
        const testResponse = await fetch("https://api.sendgrid.com/v3/user/profile", {
          headers: {
            Authorization: `Bearer ${sendgridKey}`,
          },
        })

        sendgridTest = {
          status: testResponse.status,
          ok: testResponse.ok,
          statusText: testResponse.statusText,
        }

        if (testResponse.ok) {
          const profile = await testResponse.json()
          sendgridTest.username = profile.username
        } else {
          const error = await testResponse.text()
          sendgridTest.error = error
        }
      } catch (error) {
        sendgridTest = {
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    return NextResponse.json({
      success: true,
      environment: {
        hasSendgridKey: !!sendgridKey,
        sendgridKeyValid: sendgridTest?.ok || false,
        siteUrl,
      },
      emailConfig,
      sendgridTest,
      recommendations: [
        !sendgridKey && "❌ Add SENDGRID_API_KEY environment variable",
        sendgridTest && !sendgridTest.ok && "❌ SendGrid API key is invalid",
        enabled !== "true" && "⚠️ Enable welcome emails in admin panel",
        !subject && "⚠️ Set email subject in admin panel",
        !fromEmail && "⚠️ Set from email in admin panel",
        !template && "⚠️ Set email template in admin panel",
        sendgridTest?.ok && enabled === "true" && subject && fromEmail && template && "✅ Everything looks good!",
      ].filter(Boolean),
    })
  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export async function POST(request: Request) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json({
        success: false,
        message: "Test email address is required",
      })
    }

    console.log("Sending test email to:", testEmail)

    const result = await sendWelcomeEmail({
      name: "Test User",
      email: testEmail,
      parent_location: "Mumbai, India",
      care_plan: "Peace Plan - $50/month",
      waitlist_number: 999,
      referral_link: `${process.env.NEXT_PUBLIC_SITE_URL || "https://timesnri.com"}?ref=test`,
    })

    return NextResponse.json({
      success: result,
      message: result
        ? `Test email sent successfully to ${testEmail}!`
        : "Failed to send test email. Check server logs for details.",
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json({
      success: false,
      message: "Error sending test email",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
