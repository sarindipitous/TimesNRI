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
    // Check for any campaigns that might have sent emails
    const campaignStats = await sql`
      SELECT 
        COUNT(*) as total_campaigns,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_campaigns,
        COUNT(*) FILTER (WHERE status = 'sending') as sending_campaigns
      FROM email_campaigns
    `

    // Check for any email logs that indicate emails were sent
    const emailStats = await sql`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE status = 'sent') as emails_sent,
        COUNT(*) FILTER (WHERE status = 'failed') as emails_failed,
        COUNT(*) FILTER (WHERE status = 'pending') as emails_pending
      FROM email_campaign_logs
    `

    // Check for high-risk scenarios (campaigns with many recipients)
    const highRiskCampaigns = await sql`
      SELECT id, name, total_recipients, status, created_at
      FROM email_campaigns 
      WHERE total_recipients > 10 AND status IN ('sent', 'sending')
      ORDER BY total_recipients DESC
      LIMIT 5
    `

    // Check for campaigns with email logs (indicating actual sending attempts)
    const campaignsWithLogs = await sql`
      SELECT DISTINCT c.id, c.name, c.status, COUNT(l.id) as log_count
      FROM email_campaigns c
      LEFT JOIN email_campaign_logs l ON c.id = l.campaign_id
      WHERE l.id IS NOT NULL
      GROUP BY c.id, c.name, c.status
      ORDER BY log_count DESC
    `

    const totalCampaigns = Number(campaignStats[0]?.total_campaigns || 0)
    const emailsSent = Number(emailStats[0]?.emails_sent || 0)
    const highRiskCount = highRiskCampaigns.length
    const campaignsWithLogsCount = campaignsWithLogs.length

    // Determine spam risk level
    let riskLevel = "SAFE"
    let riskMessage = "No spam risk detected"

    if (emailsSent > 100) {
      riskLevel = "HIGH"
      riskMessage = `${emailsSent} emails sent - requires immediate review`
    } else if (emailsSent > 10) {
      riskLevel = "MEDIUM"
      riskMessage = `${emailsSent} emails sent - monitor closely`
    } else if (emailsSent > 0) {
      riskLevel = "LOW"
      riskMessage = `${emailsSent} emails sent - within safe limits`
    }

    return NextResponse.json({
      success: true,
      riskLevel,
      message: riskMessage,
      stats: {
        totalCampaigns,
        emailsSent,
        highRiskCount,
        campaignsWithLogsCount,
      },
      details: {
        campaignStats: campaignStats[0],
        emailStats: emailStats[0],
        highRiskCampaigns,
        campaignsWithLogs,
      },
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
