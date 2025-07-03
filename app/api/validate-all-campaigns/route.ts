import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error: "Database not available",
      })
    }

    // Get all campaigns
    const campaigns = await sql`
      SELECT id, name, target_type, selected_recipients, status, created_at
      FROM email_campaigns 
      ORDER BY created_at DESC
    `

    const validationResults = []

    for (const campaign of campaigns) {
      const validation = {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        target_type: campaign.target_type,
        isValid: true,
        issues: [] as string[],
      }

      // Validate target type
      if (!["all", "selected", "filtered"].includes(campaign.target_type)) {
        validation.isValid = false
        validation.issues.push("Invalid target type")
      }

      // Validate selected recipients if type is selected
      if (campaign.target_type === "selected") {
        const selectedEmails = campaign.selected_recipients
        if (!Array.isArray(selectedEmails) || selectedEmails.length === 0) {
          validation.isValid = false
          validation.issues.push("No recipients selected for selected targeting")
        }
      }

      validationResults.push(validation)
    }

    const totalCampaigns = validationResults.length
    const validCampaigns = validationResults.filter((c) => c.isValid).length
    const invalidCampaigns = totalCampaigns - validCampaigns

    return NextResponse.json({
      success: true,
      summary: {
        total: totalCampaigns,
        valid: validCampaigns,
        invalid: invalidCampaigns,
      },
      campaigns: validationResults,
      allValid: invalidCampaigns === 0,
    })
  } catch (error) {
    console.error("Campaign validation error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to validate campaigns",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
