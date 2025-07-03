import { type NextRequest, NextResponse } from "next/server"
import { sendCampaign } from "@/lib/email-campaigns-fixed"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = Number.parseInt(params.id)

    if (isNaN(campaignId)) {
      return NextResponse.json({ success: false, error: "Invalid campaign ID" }, { status: 400 })
    }

    console.log(`[API] Starting send for campaign ${campaignId}`)

    // This will now send ONE EMAIL PER API CALL with proper rate limiting
    const result = await sendCampaign(campaignId)

    if (result.success) {
      console.log(`[API] Campaign ${campaignId} completed: ${result.message}`)
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      console.log(`[API] Campaign ${campaignId} failed: ${result.message}`)
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error(`[API] Error sending campaign ${params.id}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
