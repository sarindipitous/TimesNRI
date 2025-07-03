import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  const safetyChecks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: [] as any[],
    overall_safe: true,
    critical_issues: [] as string[],
    warnings: [] as string[],
  }

  // Check 1: Verify we're not accidentally sending to real users
  try {
    const realUserCount = await sql`
      SELECT COUNT(*) as count FROM waitlist_submissions 
      WHERE email NOT LIKE '%test%' 
      AND email NOT LIKE '%@resend.dev' 
      AND email NOT LIKE '%@example.com'
    `

    const realUsers = Number(realUserCount[0]?.count || 0)

    safetyChecks.checks.push({
      name: "Real User Data Check",
      status: "PASS",
      details: { real_users_in_db: realUsers },
      safe: true,
    })

    if (realUsers > 0) {
      safetyChecks.warnings.push(
        `${realUsers} real user emails in database - ensure test campaigns use test emails only`,
      )
    }
  } catch (error) {
    safetyChecks.checks.push({
      name: "Real User Data Check",
      status: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
      safe: false,
    })
    safetyChecks.critical_issues.push("Cannot verify user data safety")
  }

  // Check 2: Verify email service configuration
  try {
    const emailServices = {
      resend: !!process.env.RESEND_API_KEY,
      sendgrid: !!process.env.SENDGRID_API_KEY,
      mailgun: !!process.env.MAILGUN_API_KEY,
    }

    const configuredServices = Object.entries(emailServices).filter(([_, configured]) => configured)

    safetyChecks.checks.push({
      name: "Email Service Configuration",
      status: configuredServices.length > 0 ? "PASS" : "FAIL",
      details: { configured_services: configuredServices.map(([name]) => name) },
      safe: configuredServices.length > 0,
    })

    if (configuredServices.length === 0) {
      safetyChecks.critical_issues.push("No email services configured - campaigns will fail")
    }
  } catch (error) {
    safetyChecks.checks.push({
      name: "Email Service Configuration",
      status: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
      safe: false,
    })
  }

  // Check 3: Database connection and table integrity
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_campaigns', 'email_campaign_logs', 'waitlist_submissions')
    `

    const requiredTables = ["email_campaigns", "email_campaign_logs", "waitlist_submissions"]
    const existingTables = tables.map((t: any) => t.table_name)
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

    safetyChecks.checks.push({
      name: "Database Table Integrity",
      status: missingTables.length === 0 ? "PASS" : "FAIL",
      details: { existing_tables: existingTables, missing_tables: missingTables },
      safe: missingTables.length === 0,
    })

    if (missingTables.length > 0) {
      safetyChecks.critical_issues.push(`Missing required tables: ${missingTables.join(", ")}`)
    }
  } catch (error) {
    safetyChecks.checks.push({
      name: "Database Table Integrity",
      status: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
      safe: false,
    })
    safetyChecks.critical_issues.push("Cannot verify database integrity")
  }

  // Check 4: Verify no campaigns are currently sending
  try {
    const activeCampaigns = await sql`
      SELECT id, name, status FROM email_campaigns 
      WHERE status IN ('sending', 'scheduled')
    `

    safetyChecks.checks.push({
      name: "Active Campaign Check",
      status: activeCampaigns.length === 0 ? "PASS" : "WARNING",
      details: { active_campaigns: activeCampaigns },
      safe: true,
    })

    if (activeCampaigns.length > 0) {
      safetyChecks.warnings.push(`${activeCampaigns.length} campaigns currently active - deployment may affect them`)
    }
  } catch (error) {
    safetyChecks.checks.push({
      name: "Active Campaign Check",
      status: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
      safe: false,
    })
  }

  // Check 5: Environment validation
  const isProduction = process.env.NODE_ENV === "production"
  const hasQAMode = process.env.QA_MODE === "true"

  safetyChecks.checks.push({
    name: "Environment Safety",
    status: isProduction && !hasQAMode ? "WARNING" : "PASS",
    details: {
      environment: process.env.NODE_ENV,
      qa_mode: hasQAMode,
      is_production: isProduction,
    },
    safe: true,
  })

  if (isProduction && !hasQAMode) {
    safetyChecks.warnings.push("Deploying to production without QA_MODE=true - ensure thorough testing")
  }

  // Overall safety assessment
  const failedChecks = safetyChecks.checks.filter((check) => !check.safe)
  safetyChecks.overall_safe = failedChecks.length === 0 && safetyChecks.critical_issues.length === 0

  // Generate recommendations
  const recommendations = []
  if (safetyChecks.critical_issues.length > 0) {
    recommendations.push("🚨 CRITICAL: Do not deploy - resolve critical issues first")
  }
  if (safetyChecks.warnings.length > 0) {
    recommendations.push("⚠️  Review warnings before deployment")
  }
  if (safetyChecks.overall_safe) {
    recommendations.push("✅ Safety checks passed - deployment approved from safety perspective")
  }

  return NextResponse.json({
    success: safetyChecks.overall_safe,
    deployment_safe: safetyChecks.overall_safe && safetyChecks.critical_issues.length === 0,
    safety_report: safetyChecks,
    recommendations,
  })
}
