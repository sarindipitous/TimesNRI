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
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found",
        },
        { status: 404 },
      )
    }

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
    const body = await request.json()

    console.log(`[API] Updating campaign ${campaignId}:`, body)

    const campaign = await updateCampaign(campaignId, body)

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update campaign or campaign not found",
        },
        { status: 404 },
      )
    }

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

    const success = await deleteCampaign(campaignId)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete campaign or campaign not in draft status",
        },
        { status: 400 },
      )
    }

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
