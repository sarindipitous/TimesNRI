import { type NextRequest, NextResponse } from "next/server"
import { getCampaignById, updateCampaign, deleteCampaign } from "@/lib/email-campaigns-fixed"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = Number.parseInt(params.id)

    if (isNaN(campaignId)) {
      return NextResponse.json({ success: false, error: "Invalid campaign ID" }, { status: 400 })
    }

    console.log(`[API] Fetching campaign ${campaignId}`)

    const campaign = await getCampaignById(campaignId)

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    console.error(`Error fetching campaign ${params.id}:`, error)
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
    console.log(`[API] Updating campaign ${campaignId}:`, body)

    // Check if campaign exists
    const existingCampaign = await getCampaignById(campaignId)
    if (!existingCampaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    // Only allow updates to draft campaigns
    if (existingCampaign.status !== "draft" && existingCampaign.status !== "paused") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot update campaign with status: ${existingCampaign.status}`,
        },
        { status: 400 },
      )
    }

    // Update campaign
    const updatedCampaign = await updateCampaign(campaignId, body)

    if (!updatedCampaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update campaign",
        },
        { status: 500 },
      )
    }

    console.log(`[API] Campaign ${campaignId} updated successfully`)

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      message: "Campaign updated successfully",
    })
  } catch (error) {
    console.error(`Error updating campaign ${params.id}:`, error)
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
          error: "Failed to delete campaign or campaign not found",
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
    console.error(`Error deleting campaign ${params.id}:`, error)
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
