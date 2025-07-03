import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

async function testResendService(): Promise<{ success: boolean; service: string; message: string; details?: any }> {
  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      service: "Resend",
      message: "API key not configured",
    }
  }

  try {
    // Test with a sandbox/test payload
    const testPayload = {
      from: "QA Test <noreply@timesnri.com>",
      to: ["test@resend.dev"], // Resend's test email
      subject: "QA Test Email",
      html: "<p>This is a QA test email</p>",
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      return {
        success: false,
        service: "Resend",
        message: `HTTP ${response.status}: ${responseData.message || "Unknown error"}`,
        details: responseData,
      }
    }

    return {
      success: true,
      service: "Resend",
      message: "Service is working correctly",
      details: {
        emailId: responseData.id,
        status: response.status,
      },
    }
  } catch (error) {
    return {
      success: false,
      service: "Resend",
      message: error instanceof Error ? error.message : "Network error",
    }
  }
}

async function testMailgunService(): Promise<{ success: boolean; service: string; message: string; details?: any }> {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    return {
      success: false,
      service: "Mailgun",
      message: "API key or domain not configured",
    }
  }

  try {
    // Test domain validation endpoint instead of sending actual email
    const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")}`,
      },
    })

    if (!response.ok) {
      const responseData = await response.json()
      return {
        success: false,
        service: "Mailgun",
        message: `HTTP ${response.status}: ${responseData.message || "Unknown error"}`,
      }
    }

    return {
      success: true,
      service: "Mailgun",
      message: "Service is working correctly",
      details: {
        status: response.status,
        domain: process.env.MAILGUN_DOMAIN,
      },
    }
  } catch (error) {
    return {
      success: false,
      service: "Mailgun",
      message: error instanceof Error ? error.message : "Network error",
    }
  }
}

async function testSendGridService(): Promise<{ success: boolean; service: string; message: string; details?: any }> {
  if (!process.env.SENDGRID_API_KEY) {
    return {
      success: false,
      service: "SendGrid",
      message: "API key not configured",
    }
  }

  try {
    // Test API key validation endpoint instead of sending actual email
    const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const responseData = await response.json()
      return {
        success: false,
        service: "SendGrid",
        message: `HTTP ${response.status}: ${responseData.message || "Unknown error"}`,
      }
    }

    return {
      success: true,
      service: "SendGrid",
      message: "Service is working correctly",
      details: {
        status: response.status,
      },
    }
  } catch (error) {
    return {
      success: false,
      service: "SendGrid",
      message: error instanceof Error ? error.message : "Network error",
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      services: [] as any[],
      summary: {
        total: 0,
        working: 0,
        configured: 0,
      },
    }

    // Test all email services
    const resendResult = await testResendService()
    const mailgunResult = await testMailgunService()
    const sendgridResult = await testSendGridService()

    results.services = [resendResult, mailgunResult, sendgridResult]

    // Calculate summary
    results.summary.total = results.services.length
    results.summary.working = results.services.filter((s) => s.success).length
    results.summary.configured = results.services.filter((s) => !s.message.includes("not configured")).length

    return NextResponse.json({
      success: true,
      results,
      recommendation: {
        status: results.summary.working > 0 ? "READY" : "NOT_READY",
        message:
          results.summary.working > 0
            ? `${results.summary.working} email service(s) working correctly`
            : "No email services are working - check configuration",
        workingServices: results.services.filter((s) => s.success).map((s) => s.service),
      },
    })
  } catch (error) {
    console.error("Email service integration test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test email service integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
