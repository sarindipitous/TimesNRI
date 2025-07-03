import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  const rollbackPlan = {
    timestamp: new Date().toISOString(),
    steps: [
      {
        step: 1,
        action: "Backup Current Data",
        sql: `
          -- Create backup tables
          CREATE TABLE email_campaigns_backup AS SELECT * FROM email_campaigns;
          CREATE TABLE email_campaign_logs_backup AS SELECT * FROM email_campaign_logs;
        `,
        description: "Create backup of current campaign data",
        risk: "LOW",
      },
      {
        step: 2,
        action: "Stop All Active Campaigns",
        sql: `
          UPDATE email_campaigns 
          SET status = 'paused' 
          WHERE status IN ('sending', 'scheduled');
        `,
        description: "Pause any campaigns that are currently sending",
        risk: "LOW",
      },
      {
        step: 3,
        action: "Revert to Previous Schema",
        sql: `
          -- This would restore the previous table structure
          -- Only execute if you have the previous schema backed up
          DROP TABLE IF EXISTS email_campaigns CASCADE;
          DROP TABLE IF EXISTS email_campaign_logs CASCADE;
          -- Restore from backup (implementation depends on your backup strategy)
        `,
        description: "Restore previous database schema",
        risk: "HIGH",
      },
      {
        step: 4,
        action: "Restore Previous Code",
        description: "Deploy previous version of email campaign code",
        risk: "MEDIUM",
      },
      {
        step: 5,
        action: "Verify System Health",
        sql: `
          SELECT COUNT(*) as campaign_count FROM email_campaigns;
          SELECT COUNT(*) as log_count FROM email_campaign_logs;
        `,
        description: "Verify system is working with previous version",
        risk: "LOW",
      },
    ],
    estimated_downtime: "5-10 minutes",
    prerequisites: [
      "Database backup completed",
      "Previous code version available",
      "Admin access to deployment system",
    ],
    emergency_contacts: [
      "CTO: Immediate escalation for critical issues",
      "DevOps: Database and deployment issues",
      "QA Lead: Verification of rollback success",
    ],
  }

  return NextResponse.json({
    success: true,
    rollback_plan: rollbackPlan,
    message: "Rollback plan generated - execute only if critical issues occur",
  })
}

export async function GET() {
  try {
    // Check current system status
    const campaignCount = await sql`SELECT COUNT(*) as count FROM email_campaigns`
    const logCount = await sql`SELECT COUNT(*) as count FROM email_campaign_logs`
    const activeCampaigns = await sql`
      SELECT COUNT(*) as count FROM email_campaigns 
      WHERE status IN ('sending', 'scheduled')
    `

    const systemStatus = {
      timestamp: new Date().toISOString(),
      database_accessible: true,
      total_campaigns: Number(campaignCount[0]?.count || 0),
      total_logs: Number(logCount[0]?.count || 0),
      active_campaigns: Number(activeCampaigns[0]?.count || 0),
      rollback_needed: false,
    }

    return NextResponse.json({
      success: true,
      system_status: systemStatus,
      message: "System status check completed",
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      system_status: {
        timestamp: new Date().toISOString(),
        database_accessible: false,
        error: error instanceof Error ? error.message : "Unknown error",
        rollback_needed: true,
      },
      message: "System status check failed - consider rollback",
    })
  }
}
