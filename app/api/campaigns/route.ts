import { type NextRequest, NextResponse } from "next/server"
import { getAllCampaigns, createCampaign } from "@/lib/email-campaigns-fixed"
import { getAllWaitlistSubmissions } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "recipients") {
      // Get all waitlist emails for recipient selection
      const submissions = await getAllWaitlistSubmissions(1000, 0)
      const recipients = submissions.map((sub) => ({
        email: sub.email,
        name: sub.name || "",
        location: sub.location || sub.parent_location || "",
        care_plan: sub.care_plan || "",
        created_at: sub.created_at,
      }))

      return NextResponse.json({
        success: true,
        recipients,
      })
    }

    // Default: get all campaigns
    const campaigns = await getAllCampaigns()

    return NextResponse.json({
      success: true,
      campaigns,
    })
  } catch (error) {
    console.error("Error in campaigns API:", error)
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
    const { name, subject, from_name, from_email, html_content, target_type, target_criteria, selected_recipients } =
      body

    console.log("[API] Creating campaign:", { name, subject, target_type, selected_recipients })

    // Validate required fields
    if (!name || !subject || !from_name || !from_email || !html_content) {
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
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format for from_email",
        },
        { status: 400 },
      )
    }

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
