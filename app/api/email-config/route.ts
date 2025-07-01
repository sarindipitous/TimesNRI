import { NextResponse } from "next/server"
import { getAllEmailConfig, updateEmailConfig } from "@/lib/email-config"

export async function GET() {
  try {
    const config = await getAllEmailConfig()

    // ✅ FIXED: Return proper structure expected by frontend
    const configObject = config.reduce(
      (acc, item) => {
        acc[item.config_key] = item.config_value
        return acc
      },
      {} as Record<string, string>,
    )

    return NextResponse.json(configObject)
  } catch (error) {
    console.error("Error fetching email config:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch email configuration",
      },
      { status: 500 },
    )
  }
}

// ✅ ADDED: Missing POST method for updating email config
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const configs = [
      "welcome_email_enabled",
      "welcome_email_subject",
      "welcome_email_from_name",
      "welcome_email_from_email",
      "welcome_email_template",
    ]

    for (const key of configs) {
      if (body[key] !== undefined) {
        const enabled = key === "welcome_email_enabled" ? body[key] === "true" : true
        await updateEmailConfig(key, body[key], enabled)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Email configuration updated successfully!",
    })
  } catch (error) {
    console.error("Error updating email config:", error)
    return NextResponse.json(
      {
        error: "Failed to update email configuration",
      },
      { status: 500 },
    )
  }
}
