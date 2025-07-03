import { type NextRequest, NextResponse } from "next/server"
import { sendCampaign } from "@/lib/email-campaigns-fixed"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = Number.parseInt(params.id)

    if (isNaN(campaignId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid campaign ID",
        },
        { status: 400 },
      )
    }

    console.log(`[API] Sending campaign ${campaignId}`)

    const result = await sendCampaign(campaignId)

    console.log(`[API] Campaign ${campaignId} result:`, result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("[API] Error in send campaign:", error)
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
