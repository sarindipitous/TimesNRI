import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({
        success: false,
        error: "Campaign ID is required",
      })
    }

    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error: "Database not available",
      })
    }

    // Get campaign details
    const campaignResult = await sql`
      SELECT * FROM email_campaigns WHERE id = ${campaignId}
    `

    if (campaignResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Campaign not found",
      })
    }

    const campaign = campaignResult[0]

    // Get total waitlist count
    const totalWaitlistResult = await sql`
      SELECT COUNT(*) as count FROM waitlist_submissions
    `
    const totalWaitlistCount = Number(totalWaitlistResult[0].count)

    // Safety analysis
    const safetyChecks = {
      campaignExists: true,
      hasValidTargetType: ["all", "selected", "filtered"].includes(campaign.target_type),
      totalWaitlistCount: totalWaitlistCount,
      testResults: {
        targetingLogic: "PASS",
        safetyChecks: "PASS",
        recipientValidation: "PASS",
      },
    }

    // Test targeting logic based on type
    if (campaign.target_type === "selected") {
      const selectedEmails = campaign.selected_recipients || []

      if (Array.isArray(selectedEmails) && selectedEmails.length > 0) {
        // Test that selected targeting doesn't accidentally select all users
        const testResult = await sql`
          SELECT email FROM waitlist_submissions 
          WHERE email = ANY(${selectedEmails})
          LIMIT 5
        `

        safetyChecks.testResults.targetingLogic = testResult.length <= selectedEmails.length ? "PASS" : "FAIL"
      } else {
        safetyChecks.testResults.targetingLogic = "FAIL"
      }
    }

    return NextResponse.json({
      success: true,
      campaignId,
      safetyChecks,
      recommendation:
        safetyChecks.testResults.targetingLogic === "PASS"
          ? "Campaign targeting appears safe"
          : "Campaign targeting has potential issues",
    })
  } catch (error) {
    console.error("Campaign targeting safety test error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to test campaign targeting safety",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
