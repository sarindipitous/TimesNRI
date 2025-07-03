import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const result = await sql`
      SELECT config_key, config_value FROM email_config 
      WHERE is_enabled = true
      ORDER BY created_at DESC
    `

    // Convert array of key-value pairs to object
    const config: Record<string, string> = {}
    result.forEach((row: any) => {
      config[row.config_key] = row.config_value
    })

    // Set defaults if no config exists
    const finalConfig = {
      welcome_email_enabled: config.welcome_email_enabled || "true",
      welcome_email_subject: config.welcome_email_subject || "Welcome to Times NRI!",
      welcome_email_from_name: config.welcome_email_from_name || "Times NRI Team",
      welcome_email_from_email: config.welcome_email_from_email || "noreply@timesnri.com",
      welcome_email_template:
        config.welcome_email_template ||
        `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Times NRI</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4A8B9F; margin: 0; font-size: 28px;">Welcome to Times NRI</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Dear {{name}},</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                Thank you for trusting us. This is not just a service. It is a membership designed to be reliable, personal, and built around your cross-border life.
            </p>
        </div>

        <div style="margin-bottom: 20px;">
            <h3 style="color: #4A8B9F; margin-bottom: 10px;">Your Details:</h3>
            <ul style="color: #666; line-height: 1.6;">
                <li><strong>Email:</strong> {{email}}</li>
                <li><strong>Location:</strong> {{parent_location}}</li>
                <li><strong>Care Plan:</strong> {{care_plan}}</li>
                <li><strong>Waitlist Number:</strong> #{{waitlist_number}}</li>
            </ul>
        </div>

        <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #4A8B9F; margin: 0; font-weight: bold;">
                🎉 Share Times NRI and earn rewards: <a href="{{referral_link}}" style="color: #4A8B9F;">{{referral_link}}</a>
            </p>
        </div>

        <p style="color: #666; line-height: 1.6;">
            Warmly,<br />
            <strong>The TimesNRI Team</strong>
        </p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
                © 2024 Times NRI. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
      `.trim(),
    }

    return NextResponse.json(finalConfig)
  } catch (error) {
    console.error("Error fetching email config:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch email configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      welcome_email_enabled,
      welcome_email_subject,
      welcome_email_from_name,
      welcome_email_from_email,
      welcome_email_template,
    } = body

    console.log("Saving email config:", {
      enabled: welcome_email_enabled,
      subject: welcome_email_subject,
      fromName: welcome_email_from_name,
      fromEmail: welcome_email_from_email,
      templateLength: welcome_email_template?.length || 0,
    })

    // Validate required fields
    if (!welcome_email_subject || !welcome_email_from_name || !welcome_email_from_email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: subject, from name, and from email are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(welcome_email_from_email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format for from email address",
        },
        { status: 400 },
      )
    }

    // Save each configuration item
    const configItems = [
      { key: "welcome_email_enabled", value: welcome_email_enabled || "true" },
      { key: "welcome_email_subject", value: welcome_email_subject },
      { key: "welcome_email_from_name", value: welcome_email_from_name },
      { key: "welcome_email_from_email", value: welcome_email_from_email },
      { key: "welcome_email_template", value: welcome_email_template || "" },
    ]

    for (const item of configItems) {
      await sql`
        INSERT INTO email_config (config_key, config_value, is_enabled, created_at, updated_at)
        VALUES (${item.key}, ${item.value}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (config_key) 
        DO UPDATE SET 
          config_value = EXCLUDED.config_value,
          is_enabled = EXCLUDED.is_enabled,
          updated_at = CURRENT_TIMESTAMP
      `
    }

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
