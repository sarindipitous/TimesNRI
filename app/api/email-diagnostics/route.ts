import { NextResponse } from "next/server"
import { getAllEmailConfig } from "@/lib/email-config"

export async function GET() {
  try {
    // Check email configuration
    const emailConfig = await getAllEmailConfig()
    const configMap: Record<string, string> = {}
    emailConfig.forEach((config) => {
      configMap[config.config_key] = config.config_value
    })

    // Check environment variables
    const envCheck = {
      SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      MAILGUN_API_KEY: !!process.env.MAILGUN_API_KEY,
      MAILGUN_DOMAIN: !!process.env.MAILGUN_DOMAIN,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    }

    // Test API connectivity for configured services
    const serviceTests = []

    // Test SendGrid (priority since you're using it)
    if (process.env.SENDGRID_API_KEY) {
      try {
        console.log("Testing SendGrid API connectivity...")

        // First test: Check API key validity
        const profileResponse = await fetch("https://api.sendgrid.com/v3/user/profile", {
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          },
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()

          // Second test: Check sender verification
          const sendersResponse = await fetch("https://api.sendgrid.com/v3/verified_senders", {
            headers: {
              Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            },
          })

          let senderInfo = "Could not fetch sender info"
          let sendersData = null

          if (sendersResponse.ok) {
            sendersData = await sendersResponse.json()
            const verifiedSenders = sendersData.results || []
            senderInfo = `${verifiedSenders.length} verified sender(s): ${verifiedSenders.map((s: any) => s.from_email).join(", ")}`
          }

          serviceTests.push({
            service: "SendGrid",
            status: "✅ Connected",
            details: `API key valid. Account: ${profileData.email || "Unknown"}. ${senderInfo}`,
            account: profileData,
            senders: sendersData,
          })
        } else {
          const errorText = await profileResponse.text()
          serviceTests.push({
            service: "SendGrid",
            status: `❌ Error ${profileResponse.status}`,
            details: `API key invalid or expired: ${errorText}`,
          })
        }
      } catch (error) {
        serviceTests.push({
          service: "SendGrid",
          status: "❌ Connection Failed",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Test Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch("https://api.resend.com/domains", {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
        })
        serviceTests.push({
          service: "Resend",
          status: response.ok ? "✅ Connected" : `❌ Error ${response.status}`,
          details: response.ok ? "API key valid" : await response.text(),
        })
      } catch (error) {
        serviceTests.push({
          service: "Resend",
          status: "❌ Connection Failed",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Test Mailgun
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      try {
        const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")}`,
          },
        })
        serviceTests.push({
          service: "Mailgun",
          status: response.ok ? "✅ Connected" : `❌ Error ${response.status}`,
          details: response.ok ? "API key and domain valid" : await response.text(),
        })
      } catch (error) {
        serviceTests.push({
          service: "Mailgun",
          status: "❌ Connection Failed",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Check email configuration completeness
    const requiredConfigs = [
      "welcome_email_enabled",
      "welcome_email_subject",
      "welcome_email_from_name",
      "welcome_email_from_email",
      "welcome_email_template",
    ]

    const configStatus = requiredConfigs.map((key) => ({
      config: key,
      status: configMap[key] ? "✅ Set" : "❌ Missing",
      value:
        key === "welcome_email_template"
          ? configMap[key]
            ? `${configMap[key].length} characters`
            : "Not set"
          : configMap[key] || "Not set",
    }))

    const diagnosis = []
    const recommendations = []

    // Diagnose issues
    if (configMap.welcome_email_enabled !== "true") {
      diagnosis.push("⚠️ Welcome emails are disabled in configuration")
      recommendations.push("Enable welcome emails in Email Settings tab")
    }

    if (!configMap.welcome_email_from_email) {
      diagnosis.push("❌ Missing 'From Email' configuration")
      recommendations.push("Set a 'From Email' address in Email Settings")
    } else {
      // Check if from email matches SendGrid verified senders
      const sendGridTest = serviceTests.find((t) => t.service === "SendGrid")
      if (sendGridTest?.senders?.results) {
        const verifiedEmails = sendGridTest.senders.results.map((s: any) => s.from_email)
        if (!verifiedEmails.includes(configMap.welcome_email_from_email)) {
          diagnosis.push(`⚠️ From email '${configMap.welcome_email_from_email}' may not be verified in SendGrid`)
          recommendations.push(`Verify '${configMap.welcome_email_from_email}' as a sender in SendGrid dashboard`)
        }
      }
    }

    if (!configMap.welcome_email_subject) {
      diagnosis.push("❌ Missing email subject configuration")
      recommendations.push("Set an email subject in Email Settings")
    }

    if (!configMap.welcome_email_template) {
      diagnosis.push("❌ Missing email template")
      recommendations.push("Configure an email template in HTML Template tab")
    }

    if (serviceTests.length === 0) {
      diagnosis.push("❌ No email services configured (missing API keys)")
      recommendations.push("Add at least one email service API key (SendGrid, Resend, or Mailgun)")
    }

    const failedServices = serviceTests.filter((test) => test.status.includes("❌"))
    if (failedServices.length > 0) {
      diagnosis.push(`❌ ${failedServices.length} email service(s) have connection issues`)
      failedServices.forEach((service) => {
        recommendations.push(`Fix ${service.service} configuration: ${service.details}`)
      })
    }

    // SendGrid specific recommendations
    if (process.env.SENDGRID_API_KEY) {
      recommendations.push("Check SendGrid Activity Feed for delivery status")
      recommendations.push("Verify sender identity in SendGrid dashboard")
      recommendations.push("Check SendGrid reputation and domain authentication")
    }

    // General recommendations
    recommendations.push("Check recipient's spam/junk folder")
    recommendations.push("Test with different email addresses (Gmail, Outlook, etc.)")
    recommendations.push("Monitor email service logs and dashboards")

    if (diagnosis.length === 0) {
      diagnosis.push("✅ Email system appears to be configured correctly")
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      emailConfig: configStatus,
      serviceTests,
      diagnosis,
      recommendations,
      sendgridSpecific: {
        configured: !!process.env.SENDGRID_API_KEY,
        fromEmail: configMap.welcome_email_from_email,
        troubleshooting: [
          "1. Check SendGrid Activity Feed at https://app.sendgrid.com/email_activity",
          "2. Verify sender at https://app.sendgrid.com/settings/sender_auth",
          "3. Check domain authentication status",
          "4. Review account reputation and limits",
        ],
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
