import { type NextRequest, NextResponse } from "next/server"
import { getAllCampaigns, createCampaign } from "@/lib/email-campaigns-fixed"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "recipients") {
      console.log("[API] Fetching recipients for campaign creation")

      if (!hasDb) {
        return NextResponse.json({
          success: false,
          error: "Database not available",
          recipients: [],
        })
      }

      try {
        const result = await sql`
          SELECT email, name, location, care_plan_interest as care_plan, created_at 
          FROM waitlist_submissions 
          ORDER BY created_at DESC
        `

        console.log(`[API] Found ${result.length} recipients`)

        return NextResponse.json({
          success: true,
          recipients: result.map((r: any) => ({
            email: r.email,
            name: r.name || "",
            location: r.location || "",
            care_plan: r.care_plan || "",
            created_at: r.created_at,
          })),
        })
      } catch (error) {
        console.error("[API] Error fetching recipients:", error)
        return NextResponse.json({
          success: false,
          error: "Failed to fetch recipients",
          recipients: [],
        })
      }
    }

    // Default: get all campaigns
    const campaigns = await getAllCampaigns()
    return NextResponse.json({
      success: true,
      campaigns,
    })
  } catch (error) {
    console.error("Error in campaigns GET:", error)
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

    console.log("[API] Creating campaign:", {
      name: body.name,
      target_type: body.target_type,
      selected_recipients_count: Array.isArray(body.selected_recipients) ? body.selected_recipients.length : 0,
    })

    // Validate required fields
    if (!body.name || !body.subject || !body.html_content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, subject, and html_content are required",
        },
        { status: 400 },
      )
    }

    // Create campaign
    const campaign = await createCampaign({
      name: body.name,
      subject: body.subject,
      from_name: body.from_name || "Times NRI Team",
      from_email: body.from_email || "noreply@timesnri.com",
      html_content: body.html_content,
      target_type: body.target_type || "all",
      target_criteria: body.target_criteria,
      selected_recipients: body.selected_recipients,
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
