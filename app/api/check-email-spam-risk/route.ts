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
    const analysis = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCampaigns: 0,
        totalEmailsSent: 0,
        highRiskCampaigns: 0,
        campaignsWithLogs: 0,
      },
      campaignAnalysis: [] as any[],
      overallRisk: {
        level: "SAFE",
        recommendation: "No spam risk detected",
      },
    }

    // Check all campaigns
    const campaigns = await sql`
      SELECT id, name, status, total_recipients, sent_count, failed_count, created_at, started_at, completed_at
      FROM email_campaigns 
      ORDER BY created_at DESC
    `

    analysis.summary.totalCampaigns = campaigns.length

    // Check campaign logs for actual emails sent
    const emailLogs = await sql`
      SELECT campaign_id, COUNT(*) as log_count, 
             COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
             COUNT(*) FILTER (WHERE status = 'failed') as failed_count
      FROM email_campaign_logs 
      GROUP BY campaign_id
    `

    const logsByCampaign = new Map()
    emailLogs.forEach((log: any) => {
      logsByCampaign.set(log.campaign_id, {
        logCount: Number(log.log_count),
        sentCount: Number(log.sent_count),
        failedCount: Number(log.failed_count),
      })
    })

    // Analyze each campaign
    for (const campaign of campaigns) {
      const logs = logsByCampaign.get(campaign.id) || { logCount: 0, sentCount: 0, failedCount: 0 }

      const campaignAnalysis = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        configuredRecipients: campaign.total_recipients || 0,
        reportedEmailsSent: campaign.sent_count || 0,
        actualEmailsSent: logs.sentCount,
        hasLogs: logs.logCount > 0,
        concerns: [] as string[],
        riskLevel: "SAFE",
      }

      // Check for concerns
      if (campaign.status === "sending" && !campaign.completed_at) {
        campaignAnalysis.concerns.push("Campaign stuck in sending status")
        campaignAnalysis.riskLevel = "MEDIUM"
      }

      if (campaign.status === "sent" && logs.sentCount === 0) {
        campaignAnalysis.concerns.push("Marked as sent but no email logs found")
        campaignAnalysis.riskLevel = "HIGH"
      }

      if (logs.sentCount > 0 && campaign.status === "draft") {
        campaignAnalysis.concerns.push("Emails sent but campaign still in draft")
        campaignAnalysis.riskLevel = "HIGH"
        analysis.summary.highRiskCampaigns++
      }

      if (campaign.total_recipients > 50 && logs.sentCount > 50) {
        campaignAnalysis.concerns.push("Large number of emails sent")
        campaignAnalysis.riskLevel = "MEDIUM"
      }

      analysis.summary.totalEmailsSent += logs.sentCount
      if (logs.logCount > 0) {
        analysis.summary.campaignsWithLogs++
      }

      analysis.campaignAnalysis.push(campaignAnalysis)
    }

    // Determine overall risk
    if (analysis.summary.highRiskCampaigns > 0) {
      analysis.overallRisk.level = "HIGH"
      analysis.overallRisk.recommendation = `${analysis.summary.highRiskCampaigns} campaigns have high spam risk. Review immediately.`
    } else if (analysis.summary.totalEmailsSent > 100) {
      analysis.overallRisk.level = "MEDIUM"
      analysis.overallRisk.recommendation = `${analysis.summary.totalEmailsSent} total emails sent. Monitor for user complaints.`
    } else if (analysis.summary.totalEmailsSent > 0) {
      analysis.overallRisk.level = "LOW"
      analysis.overallRisk.recommendation = `${analysis.summary.totalEmailsSent} emails sent. Low risk but monitor.`
    }

    return NextResponse.json({
      success: true,
      ...analysis,
    })
  } catch (error) {
    console.error("Spam risk check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check spam risk",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
