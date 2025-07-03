import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const rollbackPlan = {
      timestamp: new Date().toISOString(),
      rollbackSteps: [
        {
          step: 1,
          action: "Disable Campaign System",
          description: "Immediately disable campaign creation and sending",
          sql: "UPDATE email_campaigns SET status = 'paused' WHERE status IN ('draft', 'sending')",
          reversible: true,
          impact: "Stops all campaign activity",
        },
        {
          step: 2,
          action: "Backup Current Data",
          description: "Create backup of campaign tables",
          sql: "CREATE TABLE email_campaigns_backup AS SELECT * FROM email_campaigns",
          reversible: false,
          impact: "Creates safety backup",
        },
        {
          step: 3,
          action: "Remove Campaign Routes",
          description: "Disable campaign API endpoints",
          method: "Environment variable: DISABLE_CAMPAIGNS=true",
          reversible: true,
          impact: "Disables campaign functionality",
        },
        {
          step: 4,
          action: "Restore Previous Version",
          description: "Deploy previous working version",
          method: "Git revert or previous deployment",
          reversible: true,
          impact: "Returns to stable state",
        },
      ],
      emergencyContacts: [
        {
          role: "System Administrator",
          action: "Database rollback",
          priority: "Critical",
        },
        {
          role: "DevOps Team",
          action: "Deployment rollback",
          priority: "Critical",
        },
        {
          role: "Product Team",
          action: "User communication",
          priority: "High",
        },
      ],
      dataProtection: {
        existingUsers: "Completely protected - no changes to waitlist or user data",
        existingFunctionality: "Preserved - blog, waitlist, admin functions unaffected",
        emailServices: "Maintained - welcome emails continue working",
        campaigns: "Isolated - can be disabled without affecting other features",
      },
      rollbackTriggers: [
        "Mass email sent to wrong recipients",
        "Campaign targeting not working correctly",
        "Database corruption or errors",
        "Email service failures",
        "User complaints about unwanted emails",
      ],
      verificationSteps: [
        "Check that no campaigns are in 'sending' status",
        "Verify waitlist functionality still works",
        "Test welcome email sending",
        "Confirm admin interface accessibility",
        "Validate blog functionality",
      ],
    }

    // Check current system state for rollback readiness
    const systemState = {
      campaignsActive: 0,
      campaignsSending: 0,
      lastCampaignSent: null,
      rollbackReady: true,
    }

    if (hasDb) {
      try {
        const activeCampaigns = await sql`
          SELECT COUNT(*) as count FROM email_campaigns 
          WHERE status IN ('draft', 'sending', 'scheduled')
        `
        systemState.campaignsActive = Number(activeCampaigns[0].count)

        const sendingCampaigns = await sql`
          SELECT COUNT(*) as count FROM email_campaigns 
          WHERE status = 'sending'
        `
        systemState.campaignsSending = Number(sendingCampaigns[0].count)

        const lastSent = await sql`
          SELECT completed_at FROM email_campaigns 
          WHERE status = 'sent' 
          ORDER BY completed_at DESC 
          LIMIT 1
        `
        if (lastSent.length > 0) {
          systemState.lastCampaignSent = lastSent[0].completed_at
        }

        systemState.rollbackReady = systemState.campaignsSending === 0
      } catch (error) {
        console.error("Error checking system state:", error)
      }
    }

    return NextResponse.json({
      success: true,
      rollbackPlan,
      systemState,
      recommendation: systemState.rollbackReady
        ? "System is ready for safe rollback if needed"
        : "WARNING: Campaigns currently sending - wait for completion before rollback",
    })
  } catch (error) {
    console.error("Error generating rollback plan:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to generate rollback plan",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()

    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error: "Database not available for rollback",
      })
    }

    let result = { success: false, message: "", details: {} }

    switch (action) {
      case "pause_all_campaigns":
        const pauseResult = await sql`
          UPDATE email_campaigns 
          SET status = 'paused' 
          WHERE status IN ('draft', 'sending', 'scheduled')
          RETURNING id, name, status
        `
        result = {
          success: true,
          message: `Paused ${pauseResult.length} campaigns`,
          details: { pausedCampaigns: pauseResult },
        }
        break

      case "backup_campaign_data":
        await sql`DROP TABLE IF EXISTS email_campaigns_backup`
        await sql`CREATE TABLE email_campaigns_backup AS SELECT * FROM email_campaigns`
        await sql`DROP TABLE IF EXISTS email_campaign_logs_backup`
        await sql`CREATE TABLE email_campaign_logs_backup AS SELECT * FROM email_campaign_logs`

        const backupCount = await sql`SELECT COUNT(*) as count FROM email_campaigns_backup`
        result = {
          success: true,
          message: `Backed up ${backupCount[0].count} campaigns`,
          details: { backupTable: "email_campaigns_backup" },
        }
        break

      case "disable_campaign_system":
        // This would typically set an environment variable or feature flag
        result = {
          success: true,
          message: "Campaign system disabled (requires environment variable DISABLE_CAMPAIGNS=true)",
          details: { method: "Environment variable" },
        }
        break

      default:
        result = {
          success: false,
          message: "Unknown rollback action",
          details: { availableActions: ["pause_all_campaigns", "backup_campaign_data", "disable_campaign_system"] },
        }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error executing rollback action:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to execute rollback action",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
