import { type NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not available",
    })
  }

  try {
    console.log("🔍 Checking for potential email spam risk...")

    // Check 1: Look for campaigns that might have sent emails despite errors
    const campaignsWithErrors = await sql`
      SELECT 
        id, name, status, total_recipients, sent_count, failed_count,
        created_at, started_at, completed_at
      FROM email_campaigns 
      WHERE status IN ('sending', 'sent') 
      ORDER BY created_at DESC
    `

    // Check 2: Look for campaign logs that indicate emails were sent
    const emailLogs = await sql`
      SELECT 
        campaign_id, 
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_emails,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_emails,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_emails
      FROM email_campaign_logs 
      GROUP BY campaign_id
      ORDER BY campaign_id DESC
    `

    // Check 3: Cross-reference campaigns with their logs
    const riskAnalysis = []

    for (const campaign of campaignsWithErrors) {
      const logs = emailLogs.find((log: any) => log.campaign_id === campaign.id)

      const analysis = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        totalRecipients: campaign.total_recipients || 0,
        sentCount: campaign.sent_count || 0,
        failedCount: campaign.failed_count || 0,
        actualEmailsSent: logs ? Number(logs.sent_emails) : 0,
        actualEmailsFailed: logs ? Number(logs.failed_emails) : 0,
        actualEmailsPending: logs ? Number(logs.pending_emails) : 0,
        createdAt: campaign.created_at,
        startedAt: campaign.started_at,
        completedAt: campaign.completed_at,
        riskLevel: "LOW",
        concerns: [] as string[],
      }

      // Analyze risk factors
      if (analysis.actualEmailsSent > 0) {
        analysis.riskLevel = "HIGH"
        analysis.concerns.push(`${analysis.actualEmailsSent} emails were actually sent`)
      }

      if (analysis.status === "sending" && !analysis.completedAt) {
        analysis.riskLevel = analysis.riskLevel === "HIGH" ? "HIGH" : "MEDIUM"
        analysis.concerns.push("Campaign stuck in 'sending' status")
      }

      if (analysis.sentCount !== analysis.actualEmailsSent) {
        analysis.concerns.push(
          `Mismatch: campaign shows ${analysis.sentCount} sent, logs show ${analysis.actualEmailsSent} sent`,
        )
      }

      riskAnalysis.push(analysis)
    }

    // Check 4: Recent email activity
    const recentEmailActivity = await sql`
      SELECT 
        DATE(sent_at) as date,
        COUNT(*) as emails_sent,
        COUNT(DISTINCT campaign_id) as campaigns
      FROM email_campaign_logs 
      WHERE status = 'sent' 
        AND sent_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(sent_at)
      ORDER BY date DESC
    `

    // Overall risk assessment
    const totalEmailsSent = riskAnalysis.reduce((sum, campaign) => sum + campaign.actualEmailsSent, 0)
    const highRiskCampaigns = riskAnalysis.filter((c) => c.riskLevel === "HIGH")

    const overallRisk = {
      level: totalEmailsSent === 0 ? "SAFE" : totalEmailsSent < 10 ? "LOW" : "HIGH",
      totalEmailsSent,
      highRiskCampaigns: highRiskCampaigns.length,
      recommendation:
        totalEmailsSent === 0
          ? "✅ No emails were sent despite the errors. Users were not spammed."
          : `⚠️ ${totalEmailsSent} emails were sent. Review the campaigns to ensure no spam occurred.`,
    }

    return NextResponse.json({
      success: true,
      overallRisk,
      campaignAnalysis: riskAnalysis,
      recentActivity: recentEmailActivity,
      summary: {
        totalCampaigns: campaignsWithErrors.length,
        campaignsWithLogs: emailLogs.length,
        totalEmailsSent,
        highRiskCampaigns: highRiskCampaigns.length,
      },
    })
  } catch (error) {
    console.error("Email spam risk check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check email spam risk",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
