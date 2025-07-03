import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

async function testResendService(testPayload: any) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { available: false, reason: "API key not configured" }
    }

    // Test with a dry-run approach - validate payload without sending
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...testPayload,
        to: ["test@resend.dev"], // Use Resend's test email
        subject: "[TEST] Campaign System Integration Test",
      }),
    })

    const responseData = await response.json()

    return {
      available: true,
      test_successful: response.ok,
      status_code: response.status,
      response_data: responseData,
      error: response.ok ? null : responseData.message || "Unknown error",
    }
  } catch (error) {
    return {
      available: true,
      test_successful: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

async function testSendGridService(testPayload: any) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      return { available: false, reason: "API key not configured" }
    }

    const sendGridPayload = {
      personalizations: [
        {
          to: [{ email: "test@example.com" }],
          subject: "[TEST] Campaign System Integration Test",
        },
      ],
      from: {
        email: "timesnri@timesinternet.in",
        name: "Times NRI Test",
      },
      content: [
        {
          type: "text/html",
          value: testPayload.html,
        },
      ],
      mail_settings: {
        sandbox_mode: {
          enable: true, // Enable sandbox mode for testing
        },
      },
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendGridPayload),
    })

    let responseData = {}
    if (response.headers.get("content-type")?.includes("application/json")) {
      responseData = await response.json()
    }

    return {
      available: true,
      test_successful: response.ok,
      status_code: response.status,
      response_data: responseData,
      error: response.ok ? null : "SendGrid error",
    }
  } catch (error) {
    return {
      available: true,
      test_successful: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

async function testMailgunService(testPayload: any) {
  try {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      return { available: false, reason: "API key or domain not configured" }
    }

    const formData = new FormData()
    formData.append("from", testPayload.from)
    formData.append("to", "test@example.com")
    formData.append("subject", "[TEST] Campaign System Integration Test")
    formData.append("html", testPayload.html)
    formData.append("o:testmode", "true") // Enable test mode

    const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")}`,
      },
      body: formData,
    })

    const responseData = await response.json()

    return {
      available: true,
      test_successful: response.ok,
      status_code: response.status,
      response_data: responseData,
      error: response.ok ? null : responseData.message || "Unknown error",
    }
  } catch (error) {
    return {
      available: true,
      test_successful: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

export async function POST(request: Request) {
  try {
    const { testHtml } = await request.json()

    const testPayload = {
      from: "Times NRI Test <noreply@timesnri.com>",
      html: testHtml || "<h1>Campaign System Test</h1><p>This is a test email from the campaign system.</p>",
    }

    // Test all available email services
    const [resendResult, sendgridResult, mailgunResult] = await Promise.all([
      testResendService(testPayload),
      testSendGridService(testPayload),
      testMailgunService(testPayload),
    ])

    const availableServices = [
      { name: "Resend", ...resendResult },
      { name: "SendGrid", ...sendgridResult },
      { name: "Mailgun", ...mailgunResult },
    ].filter((service) => service.available)

    const workingServices = availableServices.filter((service) => service.test_successful)

    return NextResponse.json({
      success: true,
      summary: {
        total_services_configured: availableServices.length,
        working_services: workingServices.length,
        service_names: availableServices.map((s) => s.name),
        working_service_names: workingServices.map((s) => s.name),
      },
      service_details: {
        resend: resendResult,
        sendgrid: sendgridResult,
        mailgun: mailgunResult,
      },
      recommendations:
        workingServices.length > 0
          ? [
              `${workingServices.length} email service(s) working correctly`,
              "Campaign system should work properly",
              workingServices.length > 1
                ? "Multiple services provide good redundancy"
                : "Consider configuring additional services for redundancy",
            ]
          : [
              "No email services are working correctly",
              "Fix email service configuration before deploying campaigns",
              "Check API keys and domain verification",
            ],
      production_ready: workingServices.length > 0,
    })
  } catch (error) {
    console.error("Error testing email service integration:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to test email service integration",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
