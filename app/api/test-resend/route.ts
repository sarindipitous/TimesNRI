import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json({ success: false, error: "Test email is required" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, error: "Resend API key not configured" }, { status: 500 })
    }

    // Simple test email payload
    const resendPayload = {
      from: "Times NRI <onboarding@resend.dev>", // Use Resend's domain for testing
      to: [testEmail],
      subject: "Resend Test Email - Times NRI",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Resend Test Successful!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Times NRI Email Integration</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #333; margin-top: 0;">Test Details</h2>
              <p><strong>📧 Recipient:</strong> ${testEmail}</p>
              <p><strong>⏰ Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>🚀 Service:</strong> Resend API</p>
              <p><strong>✅ Status:</strong> Successfully delivered</p>
            </div>

            <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #155724; margin-top: 0;">✅ Integration Working!</h3>
              <p style="color: #155724; margin-bottom: 0;">
                If you received this email, your Resend integration is working perfectly. 
                You can now send welcome emails to your waitlist subscribers!
              </p>
            </div>

            <div style="text-align: center; padding: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                This is an automated test email from Times NRI
              </p>
            </div>
          </body>
        </html>
      `,
    }

    console.log("Resend API Key (first 10 chars):", process.env.RESEND_API_KEY?.substring(0, 10))
    console.log("Resend payload:", JSON.stringify(resendPayload, null, 2))

    // ACTUAL API CALL TO RESEND
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    })

    // LOG RESEND RESPONSE
    console.log("Resend response status:", response.status)
    console.log("Resend response headers:", Object.fromEntries(response.headers.entries()))

    const responseData = await response.json()
    console.log("Resend response data:", responseData)

    if (!response.ok) {
      console.error("Resend API error:", responseData)

      return NextResponse.json({
        success: false,
        error: `Resend API error (${response.status}): ${responseData.message || "Unknown error"}`,
        details: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseData,
          payload: resendPayload,
        },
      })
    }

    console.log("Resend success! Email ID:", responseData.id)

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully via Resend to ${testEmail}`,
      details: {
        emailId: responseData.id,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString(),
        responseData,
      },
    })
  } catch (error) {
    console.error("Resend test error:", error)
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
