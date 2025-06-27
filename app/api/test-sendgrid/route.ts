import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json({ success: false, error: "Test email is required" }, { status: 400 })
    }

    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({ success: false, error: "SendGrid API key not configured" }, { status: 400 })
    }

    // Simple test email
    const testPayload = {
      personalizations: [
        {
          to: [{ email: testEmail }],
          subject: "SendGrid Test Email - Times NRI",
        },
      ],
      from: {
        email: "noreply@timesnri.com", // You may need to change this to your verified sender
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

    console.log("Sending test email via SendGrid...")
    console.log("Payload:", JSON.stringify(testPayload, null, 2))

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    })

    const responseHeaders = Object.fromEntries(response.headers.entries())
    console.log("SendGrid response status:", response.status)
    console.log("SendGrid response headers:", responseHeaders)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("SendGrid error:", errorText)

      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      return NextResponse.json({
        success: false,
        error: `SendGrid API error (${response.status})`,
        details: {
          status: response.status,
          headers: responseHeaders,
          body: errorData,
          payload: testPayload,
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
        headers: responseHeaders,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("SendGrid test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 },
    )
  }
}
