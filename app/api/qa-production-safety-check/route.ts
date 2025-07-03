import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  const safetyChecks = []
  let overallSafe = true

  // Check 1: No campaigns with real email addresses in test mode
  try {
    const testCampaigns = await sql`
      SELECT id, name, selected_recipients, target_type
      FROM email_campaigns 
      WHERE name ILIKE '%test%' OR name ILIKE '%qa%'
    `

    const realEmailsInTest = []
    for (const campaign of testCampaigns) {
      if (campaign.target_type === "selected" && campaign.selected_recipients) {
        const recipients = Array.isArray(campaign.selected_recipients)
          ? campaign.selected_recipients
          : JSON.parse(campaign.selected_recipients as string)

        const realEmails = recipients.filter(
          (email: string) =>
            !email.includes("test") &&
            !email.includes("example") &&
            !email.includes("resend.dev") &&
            !email.includes("qa"),
        )

        if (realEmails.length > 0) {
          realEmailsInTest.push({
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            real_emails: realEmails,
          })
        }
      }
    }

    safetyChecks.push({
      check: "Test Campaigns Email Safety",
      passed: realEmailsInTest.length === 0,
      details:
        realEmailsInTest.length === 0
          ? "No real emails found in test campaigns"
          : `Found ${realEmailsInTest.length} test campaigns with real emails`,
      data: realEmailsInTest,
    })

    if (realEmailsInTest.length > 0) overallSafe = false
  } catch (error) {
    safetyChecks.push({
      check: "Test Campaigns Email Safety",
      passed: false,
      details: `Error checking test campaigns: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
    overallSafe = false
  }

  // Check 2: No campaigns in sending status that shouldn't be
  try {
    const sendingCampaigns = await sql`
      SELECT id, name, status, total_recipients, started_at
      FROM email_campaigns 
      WHERE status = 'sending' AND started_at < NOW() - INTERVAL '1 hour'
    `

    safetyChecks.push({
      check: "Stuck Sending Campaigns",
      passed: sendingCampaigns.length === 0,
      details:
        sendingCampaigns.length === 0
          ? "No campaigns stuck in sending status"
          : `Found ${sendingCampaigns.length} campaigns stuck in sending status`,
      data: sendingCampaigns,
    })

    if (sendingCampaigns.length > 0) overallSafe = false
  } catch (error) {
    safetyChecks.push({
      check: "Stuck Sending Campaigns",
      passed: false,
      details: `Error checking sending campaigns: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
    overallSafe = false
  }

  // Check 3: Email service configuration
  const emailServices = {
    resend: !!process.env.RESEND_API_KEY,
    sendgrid: !!process.env.SENDGRID_API_KEY,
    mailgun: !!process.env.MAILGUN_API_KEY,
  }

  const configuredServices = Object.entries(emailServices).filter(([_, configured]) => configured)

  safetyChecks.push({
    check: "Email Service Configuration",
    passed: configuredServices.length > 0,
    details:
      configuredServices.length > 0
        ? `${configuredServices.length} email services configured: ${configuredServices.map(([name]) => name).join(", ")}`
        : "No email services configured",
    data: emailServices,
  })

  if (configuredServices.length === 0) overallSafe = false

  // Check 4: Database schema integrity
  try {
    const campaignColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'email_campaigns'
      ORDER BY ordinal_position
    `

    const logColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'email_campaign_logs'
      ORDER BY ordinal_position
    `

    const requiredCampaignColumns = ["id", "name", "subject", "html_content", "status", "created_at", "updated_at"]
    const requiredLogColumns = ["id", "campaign_id", "recipient_email", "status", "created_at"]

    const campaignColumnNames = campaignColumns.map((col: any) => col.column_name)
    const logColumnNames = logColumns.map((col: any) => col.column_name)

    const missingCampaignColumns = requiredCampaignColumns.filter((col) => !campaignColumnNames.includes(col))
    const missingLogColumns = requiredLogColumns.filter((col) => !logColumnNames.includes(col))

    const schemaValid = missingCampaignColumns.length === 0 && missingLogColumns.length === 0

    safetyChecks.push({
      check: "Database Schema Integrity",
      passed: schemaValid,
      details: schemaValid
        ? "All required database columns present"
        : `Missing columns - Campaigns: ${missingCampaignColumns.join(", ")}, Logs: ${missingLogColumns.join(", ")}`,
      data: {
        campaign_columns: campaignColumnNames.length,
        log_columns: logColumnNames.length,
        missing_campaign_columns: missingCampaignColumns,
        missing_log_columns: missingLogColumns,
      },
    })

    if (!schemaValid) overallSafe = false
  } catch (error) {
    safetyChecks.push({
      check: "Database Schema Integrity",
      passed: false,
      details: `Error checking database schema: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
    overallSafe = false
  }

  // Check 5: Recent error rates
  try {
    const recentLogs = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM email_campaign_logs 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `

    const totalRecent = recentLogs.reduce((sum: number, log: any) => sum + Number(log.count), 0)
    const failedRecent = recentLogs.find((log: any) => log.status === "failed")?.count || 0
    const errorRate = totalRecent > 0 ? (Number(failedRecent) / totalRecent) * 100 : 0

    safetyChecks.push({
      check: "Recent Error Rates",
      passed: errorRate < 10, // Less than 10% error rate
      details:
        totalRecent > 0
          ? `Error rate: ${errorRate.toFixed(1)}% (${failedRecent}/${totalRecent} emails in last 24h)`
          : "No recent email activity",
      data: {
        total_recent: totalRecent,
        failed_recent: Number(failedRecent),
        error_rate_percent: errorRate,
        status_breakdown: recentLogs,
      },
    })

    if (errorRate >= 10) overallSafe = false
  } catch (error) {
    safetyChecks.push({
      check: "Recent Error Rates",
      passed: false,
      details: `Error checking recent error rates: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }

  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    overall_safe: overallSafe,
    deployment_approved: overallSafe,
    total_checks: safetyChecks.length,
    passed_checks: safetyChecks.filter((check) => check.passed).length,
    failed_checks: safetyChecks.filter((check) => !check.passed).length,
    safety_checks: safetyChecks,
    recommendations: overallSafe
      ? ["System appears safe for production deployment"]
      : [
          "CRITICAL: Safety checks failed - DO NOT deploy to production",
          "Review failed checks and resolve issues before deployment",
          "Consider running rollback procedures if already deployed",
        ],
  }

  return NextResponse.json({
    success: overallSafe,
    safety_report: report,
    message: overallSafe
      ? "All safety checks passed - safe for production"
      : "Safety checks failed - deployment not recommended",
  })
}
