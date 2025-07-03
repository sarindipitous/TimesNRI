import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM email_config 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    const config = result[0] || {
      enable_welcome_emails: true,
      email_subject: "Welcome to Times NRI!",
      from_name: "Times NRI Team",
      from_email: "onboarding@resend.dev",
      email_template: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4A8B9F;">Welcome to Times NRI!</h2>
          <p>Dear {{name}},</p>
          <p>Thank you for joining our waitlist. We're excited to help you provide the best care for your loved ones in India.</p>
          <p>We'll keep you updated on our launch progress and notify you as soon as we're available in your area.</p>
          <p>Best regards,<br>The Times NRI Team</p>
        </div>
      `,
    }

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("Error fetching email config:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch email configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enable_welcome_emails, email_subject, from_name, from_email, email_template } = body

    // Validate required fields
    if (!email_subject || !from_name || !from_email) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(from_email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    // Insert or update email configuration
    await sql`
      INSERT INTO email_config (
        enable_welcome_emails,
        email_subject,
        from_name,
        from_email,
        email_template,
        created_at,
        updated_at
      ) VALUES (
        ${enable_welcome_emails},
        ${email_subject},
        ${from_name},
        ${from_email},
        ${
          email_template ||
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4A8B9F;">Welcome to Times NRI!</h2>
            <p>Dear {{name}},</p>
            <p>Thank you for joining our waitlist. We're excited to help you provide the best care for your loved ones in India.</p>
            <p>We'll keep you updated on our launch progress and notify you as soon as we're available in your area.</p>
            <p>Best regards,<br>The Times NRI Team</p>
          </div>
        `
        },
        NOW(),
        NOW()
      )
    `

    console.log("Email configuration saved successfully")

    return NextResponse.json({
      success: true,
      message: "Email configuration saved successfully",
    })
  } catch (error) {
    console.error("Error saving email config:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save email configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
