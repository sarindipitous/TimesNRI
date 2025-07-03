import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json({ success: false, error: "Test email address is required" }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY environment variable not configured",
          details: {
            message: "Add RESEND_API_KEY to your environment variables",
            setup: "Go to resend.com, create an account, and generate an API key",
          },
        },
        { status: 500 },
      )
    }

    console.log("Testing Resend with email:", testEmail)

    // Simple test email payload
    const emailPayload = {
      from: "Times NRI Team <onboarding@resend.dev>",
      to: [testEmail],
      subject: "🧪 Resend Test Email - Times NRI",
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resend Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🧪 Resend Test Successful!</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Your Resend integration is working perfectly</p>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        <p style="font-size: 18px; margin-bottom: 20px;">Great news!</p>
        
        <p>Your Resend email service is configured correctly and working as expected.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #059669;">✅ Test Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;"><strong>Service:</strong> Resend</li>
                <li style="margin: 8px 0;"><strong>Test Email:</strong> ${testEmail}</li>
                <li style="margin: 8px 0;"><strong>From:</strong> onboarding@resend.dev</li>
                <li style="margin: 8px 0;"><strong>Status:</strong> ✅ Delivered</li>
                <li style="margin: 8px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
        </div>
        
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1d4ed8;">🚀 Next Steps:</h3>
            <ol style="padding-left: 20px;">
                <li>Your Resend integration is ready to use</li>
                <li>Configure your welcome email template</li>
                <li>Test the full welcome email system</li>
                <li>Consider setting up your own domain for branded emails</li>
            </ol>
        </div>
        
        <p>You can now use Resend as your primary email service for Times NRI!</p>
        
        <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>The Times NRI Team</strong>
        </p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
        <p style="margin: 0; font-size: 14px; color: #666;">
            This is a test email sent via Resend API • ${new Date().toISOString()}
        </p>
    </div>
</body>
</html>`,
    }

    console.log("Sending test email via Resend API...")

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    })

    console.log("Resend API response status:", response.status)

    const responseData = await response.json()
    console.log("Resend API response data:", responseData)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Resend API error: ${response.status}`,
          details: {
            status: response.status,
            message: responseData.message || "Unknown error",
            response: responseData,
            payload: emailPayload,
          },
        },
        { status: 500 },
      )
    }

    console.log("✅ Resend test email sent successfully!")

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully via Resend to ${testEmail}`,
      details: {
        emailId: responseData.id,
        service: "Resend",
        from: emailPayload.from,
        to: testEmail,
        subject: emailPayload.subject,
        timestamp: new Date().toISOString(),
        response: responseData,
      },
    })
  } catch (error) {
    console.error("Resend test error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test email via Resend",
        details: {
          message: error instanceof Error ? error.message : "Unknown error",
          error: error,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  }
}
