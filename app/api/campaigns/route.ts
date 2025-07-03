import { type NextRequest, NextResponse } from "next/server"
import { getAllCampaigns, createCampaign } from "@/lib/email-campaigns-fixed"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[API] Fetching all campaigns")
    const campaigns = await getAllCampaigns()

    return NextResponse.json({
      success: true,
      campaigns,
    })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
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
    console.log("[API] Creating new campaign")
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["name", "subject", "from_name", "from_email", "html_content", "target_type"]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      )
    }

    console.log("[API] Campaign data:", {
      name: body.name,
      subject: body.subject,
      target_type: body.target_type,
      selected_recipients_count: body.selected_recipients?.length || 0,
    })

    const campaign = await createCampaign({
      name: body.name,
      subject: body.subject,
      from_name: body.from_name,
      from_email: body.from_email,
      html_content: body.html_content,
      target_type: body.target_type,
      target_criteria: body.target_criteria || {},
      selected_recipients: body.selected_recipients || [],
    })

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create campaign",
        },
        { status: 500 },
      )
    }

    console.log(`[API] Campaign created successfully with ID: ${campaign.id}`)

    return NextResponse.json({
      success: true,
      campaign,
      message: "Campaign created successfully",
    })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
