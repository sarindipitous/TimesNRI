import { type NextRequest, NextResponse } from "next/server"
import { getAllCampaigns, createCampaign } from "@/lib/email-campaigns-fixed"
import { getAllWaitlistSubmissions } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "recipients") {
      console.log("[API] Fetching recipients for campaign creation")

      // Get all waitlist emails for recipient selection
      const submissions = await getAllWaitlistSubmissions(1000, 0)
      const recipients = submissions.map((sub) => ({
        email: sub.email,
        name: sub.name || "",
        location: sub.location || sub.parent_location || "",
        care_plan: sub.care_plan || "",
        created_at: sub.created_at,
      }))

      console.log(`[API] Found ${recipients.length} recipients`)

      return NextResponse.json({
        success: true,
        recipients,
      })
    }

    // Default: get all campaigns
    console.log("[API] Fetching all campaigns")
    const campaigns = await getAllCampaigns()

    return NextResponse.json({
      success: true,
      campaigns,
    })
  } catch (error) {
    console.error("Error in campaigns GET API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaigns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Campaign creation request received")

    const body = await request.json()
    console.log("[API] Request body:", {
      name: body.name,
      subject: body.subject,
      target_type: body.target_type,
      selected_recipients_count: Array.isArray(body.selected_recipients) ? body.selected_recipients.length : 0,
    })

    const { name, subject, from_name, from_email, html_content, target_type, target_criteria, selected_recipients } =
      body

    // Validate required fields
    if (!name || !subject || !from_name || !from_email || !html_content) {
      console.error("[API] Missing required fields:", {
        name: !!name,
        subject: !!subject,
        from_name: !!from_name,
        from_email: !!from_email,
        html_content: !!html_content,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, subject, from_name, from_email, and html_content are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(from_email)) {
      console.error("[API] Invalid email format:", from_email)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format for from_email",
        },
        { status: 400 },
      )
    }

    // Validate target type and recipients
    if (
      target_type === "selected" &&
      (!selected_recipients || !Array.isArray(selected_recipients) || selected_recipients.length === 0)
    ) {
      console.error("[API] Selected target type but no recipients provided")
      return NextResponse.json(
        {
          success: false,
          error: "Selected recipients target type requires at least one recipient",
        },
        { status: 400 },
      )
    }

    console.log("[API] Creating campaign with validated data")

    // Create campaign
    const campaign = await createCampaign({
      name,
      subject,
      from_name,
      from_email,
      html_content,
      target_type: target_type || "all",
      target_criteria,
      selected_recipients,
    })

    if (!campaign) {
      console.error("[API] Campaign creation returned null")
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create campaign - database operation failed",
        },
        { status: 500 },
      )
    }

    console.log("[API] Campaign created successfully:", { id: campaign.id, name: campaign.name })

    return NextResponse.json({
      success: true,
      campaign,
      message: "Campaign created successfully",
    })
  } catch (error) {
    console.error("Error creating campaign:", error)

    // Provide more specific error information
    let errorMessage = "Failed to create campaign"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        errorMessage = "Campaign with this name already exists"
        statusCode = 409
      } else if (error.message.includes("foreign key")) {
        errorMessage = "Invalid reference data"
        statusCode = 400
      } else if (error.message.includes("not null")) {
        errorMessage = "Missing required database fields"
        statusCode = 400
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: statusCode },
    )
  }
}
