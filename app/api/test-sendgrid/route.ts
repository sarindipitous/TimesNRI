import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json({ success: false, error: "Test email is required" }, { status: 400 })
    }

    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({ success: false, error: "SendGrid API key not configured" }, { status: 500 })
    }

    // Simple test email payload
    const sendGridPayload = {
      personalizations: [
        {
          to: [{ email: testEmail }],
          subject: "SendGrid Test Email - Times NRI",
        },
      ],
      from: {
        email: "timesnri@timesinternet.in",
        name: "Times NRI Test",
      },
      content: [
        {
          type: "text/html",
          value: `
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>SendGrid Test Email</h2>
                <p>This is a test email from Times NRI to verify SendGrid integration.</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>Recipient:</strong> ${testEmail}</p>
                <p>If you received this email, SendGrid is working correctly!</p>
              </body>
            </html>
          `,
        },
      ],
    }

    console.log("SendGrid API Key (first 10 chars):", process.env.SENDGRID_API_KEY?.substring(0, 10))
    console.log("SendGrid payload:", JSON.stringify(sendGridPayload, null, 2))

    // ACTUAL API CALL TO SENDGRID
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendGridPayload),
    })

    // LOG SENDGRID RESPONSE
    console.log("SendGrid response status:", response.status)
    console.log("SendGrid response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("SendGrid response body:", responseText)

    if (!response.ok) {
      console.error("SendGrid API error:", responseText)

      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }

      return NextResponse.json({
        success: false,
        error: `SendGrid API error (${response.status}): ${errorData.errors?.[0]?.message || errorData.message || "Unknown error"}`,
        details: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorData,
          payload: sendGridPayload,
        },
      })
    }

    const messageId = response.headers.get("x-message-id")
    console.log("SendGrid success! Message ID:", messageId)

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully via SendGrid to ${testEmail}`,
      details: {
        messageId,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString(),
        responseBody: responseText,
      },
    })
  } catch (error) {
    console.error("SendGrid test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: { error: error },
      },
      { status: 500 },
    )
  }
}
