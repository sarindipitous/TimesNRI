import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.SENDGRID_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: "SENDGRID_API_KEY not found in environment variables",
        configured: false,
      })
    }

    // Test the API key by calling SendGrid's user profile endpoint
    const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({
        success: false,
        message: "SendGrid API key is invalid",
        configured: false,
        error: {
          status: response.status,
          statusText: response.statusText,
          body: error,
        },
      })
    }

    const profile = await response.json()

    // Check sender verification status
    const sendersResponse = await fetch("https://api.sendgrid.com/v3/verified_senders", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    let verifiedSenders = []
    if (sendersResponse.ok) {
      const sendersData = await sendersResponse.json()
      verifiedSenders = sendersData.results || []
    }

    return NextResponse.json({
      success: true,
      message: "SendGrid is properly configured",
      configured: true,
      profile: {
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
      },
      verifiedSenders: verifiedSenders.map((sender: any) => ({
        email: sender.from_email,
        name: sender.from_name,
        verified: sender.verified,
      })),
      recommendations: [
        verifiedSenders.length === 0 && "⚠️ No verified senders found. Add a verified sender in SendGrid dashboard.",
        verifiedSenders.some((s: any) => !s.verified) && "⚠️ Some senders are not verified. Check SendGrid dashboard.",
        verifiedSenders.length > 0 &&
          verifiedSenders.every((s: any) => s.verified) &&
          "✅ All senders are verified and ready to use!",
      ].filter(Boolean),
    })
  } catch (error) {
    console.error("SendGrid verification error:", error)
    return NextResponse.json({
      success: false,
      message: "Error verifying SendGrid configuration",
      configured: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
