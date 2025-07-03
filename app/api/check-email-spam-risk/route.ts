import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not available",
    })
  }

  try {
    const spamRiskAssessment = {
      timestamp: new Date().toISOString(),
      overallRisk: {
        level: "SAFE",
        recommendation: "No spam risk detected",
      },
      summary: {
        totalCampaigns: 0,
        totalEmailsSent: 0,
        highRiskCampaigns: 0,
        campaignsWithLogs: 0,
      },
      campaignAnalysis: [] as any[],
      systemHealth: {
        databaseConnected: true,
        tablesExist: true,
      },
    }

    // Check if campaigns table exists
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_campaigns', 'email_campaign_logs')
    `

    if (tablesCheck.length < 2) {
      spamRiskAssessment.systemHealth.tablesExist = false
      spamRiskAssessment.overallRisk = {
        level: "SAFE",
        recommendation: "Campaign tables don't exist - no emails could have been sent",
      }
      return NextResponse.json({
        success: true,
        ...spamRiskAssessment,
      })
    }

    // Get all campaigns
    const campaigns = await sql`
      SELECT * FROM email_campaigns 
      ORDER BY created_at DESC
    `

    spamRiskAssessment.summary.totalCampaigns = campaigns.length

    if (campaigns.length === 0) {
      spamRiskAssessment.overallRisk = {
        level: "SAFE",
        recommendation: "No campaigns found - no spam risk",
      }
      return NextResponse.json({
        success: true,
        ...spamRiskAssessment,
      })
    }

    // Analyze each campaign
    for (const campaign of campaigns) {
      const campaignLogs = await sql`
        SELECT * FROM email_campaign_logs 
        WHERE campaign_id = ${campaign.id}
      `

      const sentEmails = campaignLogs.filter((log: any) => log.status === "sent")
      const actualEmailsSent = sentEmails.length

      spamRiskAssessment.summary.totalEmailsSent += actualEmailsSent

      if (campaignLogs.length > 0) {
        spamRiskAssessment.summary.campaignsWithLogs++
      }

      // Risk assessment for this campaign
      let riskLevel = "SAFE"
      const concerns = []

      if (actualEmailsSent > 100) {
        riskLevel = "HIGH"
        concerns.push("High volume of emails sent")
        spamRiskAssessment.summary.highRiskCampaigns++
      } else if (actualEmailsSent > 10) {
        riskLevel = "MEDIUM"
        concerns.push("Moderate volume of emails sent")
      } else if (actualEmailsSent > 0) {
        riskLevel = "LOW"
        concerns.push("Some emails were sent")
      }

      // Check if campaign failed due to updateCampaign error
      if (campaign.status === "draft" && campaignLogs.length === 0) {
        concerns.push("Campaign may have failed before sending (GOOD)")
      }

      spamRiskAssessment.campaignAnalysis.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        targetType: campaign.target_type,
        actualEmailsSent,
        totalLogs: campaignLogs.length,
        riskLevel,
        concerns,
        createdAt: campaign.created_at,
      })
    }

    // Overall risk assessment
    if (spamRiskAssessment.summary.totalEmailsSent === 0) {
      spamRiskAssessment.overallRisk = {
        level: "SAFE",
        recommendation: "No emails were sent - system is safe",
      }
    } else if (spamRiskAssessment.summary.totalEmailsSent < 10) {
      spamRiskAssessment.overallRisk = {
        level: "LOW",
        recommendation: `Only ${spamRiskAssessment.summary.totalEmailsSent} emails sent - low risk`,
      }
    } else if (spamRiskAssessment.summary.totalEmailsSent < 100) {
      spamRiskAssessment.overallRisk = {
        level: "MEDIUM",
        recommendation: `${spamRiskAssessment.summary.totalEmailsSent} emails sent - monitor for complaints`,
      }
    } else {
      spamRiskAssessment.overallRisk = {
        level: "HIGH",
        recommendation: `${spamRiskAssessment.summary.totalEmailsSent} emails sent - immediate review required`,
      }
    }

    return NextResponse.json({
      success: true,
      ...spamRiskAssessment,
    })
  } catch (error) {
    console.error("Spam risk check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Spam risk check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        overallRisk: {
          level: "UNKNOWN",
          recommendation: "Unable to assess risk due to error",
        },
      },
      { status: 500 },
    )
  }
}
