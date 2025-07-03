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
      count: campaigns.length,
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
    const body = await request.json()
    console.log("[API] Creating campaign:", body)

    // Validate required fields
    const requiredFields = ["name", "subject", "html_content", "target_type"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 },
        )
      }
    }

    // Set defaults
    const campaignData = {
      name: body.name,
      subject: body.subject,
      from_name: body.from_name || "Times NRI Team",
      from_email: body.from_email || "noreply@timesnri.com",
      html_content: body.html_content,
      target_type: body.target_type,
      target_criteria: body.target_criteria || {},
      selected_recipients: body.selected_recipients || [],
    }

    const campaign = await createCampaign(campaignData)

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create campaign",
        },
        { status: 500 },
      )
    }

    console.log("[API] Campaign created successfully:", campaign.id)

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
