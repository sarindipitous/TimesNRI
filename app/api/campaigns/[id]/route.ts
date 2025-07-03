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

    console.log(`[API] Campaign ${campaignId} found: ${campaign.name}`)

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

    console.log(`[API] Updating campaign ${campaignId}`)

    const body = await request.json()

    // Check if campaign exists and is editable
    const existingCampaign = await getCampaignById(campaignId)
    if (!existingCampaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    if (existingCampaign.status !== "draft") {
      return NextResponse.json({ success: false, error: "Only draft campaigns can be edited" }, { status: 400 })
    }

    // Update campaign
    const updatedCampaign = await updateCampaign(campaignId, body)

    if (!updatedCampaign) {
      return NextResponse.json({ success: false, error: "Failed to update campaign" }, { status: 500 })
    }

    console.log(`[API] Campaign ${campaignId} updated successfully`)

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
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

    const success = await deleteCampaign(campaignId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete campaign or campaign not found" },
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
