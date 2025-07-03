import { type NextRequest, NextResponse } from "next/server"
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignLogs,
  getCampaignStats,
} from "@/lib/email-campaigns-fixed"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (isNaN(campaignId)) {
      return NextResponse.json({ success: false, error: "Invalid campaign ID" }, { status: 400 })
    }

    console.log(`[API] GET campaign ${campaignId}, action: ${action || "details"}`)

    if (action === "logs") {
      const limit = Number.parseInt(searchParams.get("limit") || "100")
      const offset = Number.parseInt(searchParams.get("offset") || "0")
      const logs = await getCampaignLogs(campaignId, limit, offset)

      return NextResponse.json({
        success: true,
        logs,
      })
    }

    if (action === "stats") {
      const stats = await getCampaignStats(campaignId)

      return NextResponse.json({
        success: true,
        stats,
      })
    }

    // Default: get campaign details
    const campaign = await getCampaignById(campaignId)

    if (!campaign) {
      console.log(`[API] Campaign ${campaignId} not found`)
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found",
        },
        { status: 404 },
      )
    }

    console.log(`[API] Campaign ${campaignId} found: ${campaign.name}`)

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = Number.parseInt(params.id)

    if (isNaN(campaignId)) {
      return NextResponse.json({ success: false, error: "Invalid campaign ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log(`[API] Updating campaign ${campaignId}:`, Object.keys(body))

    // Check if campaign exists first
    const existingCampaign = await getCampaignById(campaignId)
    if (!existingCampaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    // Only allow updates to draft campaigns for content changes
    if (existingCampaign.status !== "draft" && (body.name || body.subject || body.html_content)) {
      return NextResponse.json({ success: false, error: "Cannot edit content of non-draft campaigns" }, { status: 400 })
    }

    const campaign = await updateCampaign(campaignId, body)

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 })
    }

    console.log(`[API] Campaign ${campaignId} updated successfully`)

    return NextResponse.json({
      success: true,
      campaign,
      message: "Campaign updated successfully",
    })
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = Number.parseInt(params.id)

    if (isNaN(campaignId)) {
      return NextResponse.json({ success: false, error: "Invalid campaign ID" }, { status: 400 })
    }

    console.log(`[API] Deleting campaign ${campaignId}`)

    const deleted = await deleteCampaign(campaignId)

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found or cannot be deleted (only draft campaigns can be deleted)",
        },
        { status: 404 },
      )
    }

    console.log(`[API] Campaign ${campaignId} deleted successfully`)

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
