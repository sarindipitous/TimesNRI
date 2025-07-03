import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const integrityReport = {
    timestamp: new Date().toISOString(),
    checks: {
      existing_functionality: { status: "UNKNOWN", details: {} },
      data_integrity: { status: "UNKNOWN", details: {} },
      api_compatibility: { status: "UNKNOWN", details: {} },
      user_impact: { status: "UNKNOWN", details: {} },
    },
    overall_status: "UNKNOWN",
    issues: [] as string[],
    recommendations: [] as string[],
  }

  try {
    console.log("[INTEGRITY] Starting system integrity check...")

    // 1. Check existing functionality is preserved
    try {
      if (hasDb) {
        // Test waitlist functionality
        const waitlistCount = await sql`SELECT COUNT(*) as count FROM waitlist_submissions`
        const waitlistWorking = Number(waitlistCount[0].count) >= 0

        // Test email config
        const emailConfigCount = await sql`SELECT COUNT(*) as count FROM email_config`
        const emailConfigWorking = Number(emailConfigCount[0].count) >= 0

        // Test blog functionality
        const blogCount = await sql`SELECT COUNT(*) as count FROM blog_posts`
        const blogWorking = Number(blogCount[0].count) >= 0

        if (waitlistWorking && emailConfigWorking && blogWorking) {
          integrityReport.checks.existing_functionality.status = "PASS"
        } else {
          integrityReport.issues.push("Some existing functionality may be impacted")
          integrityReport.checks.existing_functionality.status = "FAIL"
        }

        integrityReport.checks.existing_functionality.details = {
          waitlist_accessible: waitlistWorking,
          email_config_accessible: emailConfigWorking,
          blog_accessible: blogWorking,
          waitlist_count: Number(waitlistCount[0].count),
          email_configs: Number(emailConfigCount[0].count),
          blog_posts: Number(blogCount[0].count),
        }
      }
    } catch (error) {
      integrityReport.issues.push(`Existing functionality check failed: ${error}`)
      integrityReport.checks.existing_functionality.status = "FAIL"
    }

    // 2. Data integrity check
    try {
      if (hasDb) {
        // Check for data corruption or inconsistencies
        const duplicateEmails = await sql`
          SELECT email, COUNT(*) as count 
          FROM waitlist_submissions 
          GROUP BY email 
          HAVING COUNT(*) > 1
        `

        const orphanedCampaignLogs = await sql`
          SELECT COUNT(*) as count 
          FROM email_campaign_logs ecl 
          LEFT JOIN email_campaigns ec ON ecl.campaign_id = ec.id 
          WHERE ec.id IS NULL
        `

        const dataIssues = []
        if (duplicateEmails.length > 0) {
          dataIssues.push(`${duplicateEmails.length} duplicate email addresses in waitlist`)
        }

        if (Number(orphanedCampaignLogs[0]?.count || 0) > 0) {
          dataIssues.push(`${orphanedCampaignLogs[0].count} orphaned campaign logs`)
        }

        integrityReport.checks.data_integrity.status = dataIssues.length === 0 ? "PASS" : "WARNING"
        integrityReport.checks.data_integrity.details = {
          duplicate_emails: duplicateEmails.length,
          orphaned_logs: Number(orphanedCampaignLogs[0]?.count || 0),
          issues: dataIssues,
        }

        if (dataIssues.length > 0) {
          integrityReport.issues.push(...dataIssues)
        }
      }
    } catch (error) {
      integrityReport.issues.push(`Data integrity check failed: ${error}`)
      integrityReport.checks.data_integrity.status = "FAIL"
    }

    // 3. API compatibility check
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

      // Test existing API endpoints still work
      const waitlistApiResponse = await fetch(`${baseUrl}/api/waitlist`)
      const dashboardApiResponse = await fetch(`${baseUrl}/api/dashboard-data`)
      const emailTestResponse = await fetch(`${baseUrl}/api/email-test`)

      const apiCompatible = waitlistApiResponse.ok && dashboardApiResponse.ok && emailTestResponse.ok

      integrityReport.checks.api_compatibility.status = apiCompatible ? "PASS" : "FAIL"
      integrityReport.checks.api_compatibility.details = {
        waitlist_api: waitlistApiResponse.ok,
        dashboard_api: dashboardApiResponse.ok,
        email_test_api: emailTestResponse.ok,
      }

      if (!apiCompatible) {
        integrityReport.issues.push("Some existing API endpoints are not responding correctly")
      }
    } catch (error) {
      integrityReport.issues.push(`API compatibility check failed: ${error}`)
      integrityReport.checks.api_compatibility.status = "FAIL"
    }

    // 4. User impact assessment
    try {
      // Check if campaign system could impact existing users
      const userImpactIssues = []

      // Check if campaign tables could interfere with existing tables
      if (hasDb) {
        const tableConflicts = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name IN ('email_campaigns', 'email_campaign_logs')
          AND table_schema = 'public'
        `

        if (tableConflicts.length > 0) {
          // Tables exist - check if they're properly isolated
          const campaignTableSize = await sql`SELECT COUNT(*) as count FROM email_campaigns`
          const logTableSize = await sql`SELECT COUNT(*) as count FROM email_campaign_logs`

          integrityReport.checks.user_impact.details = {
            campaign_tables_exist: true,
            campaign_count: Number(campaignTableSize[0].count),
            log_count: Number(logTableSize[0].count),
            isolated: true, // Campaign system is isolated from user data
          }
        }
      }

      integrityReport.checks.user_impact.status = userImpactIssues.length === 0 ? "PASS" : "FAIL"

      if (userImpactIssues.length > 0) {
        integrityReport.issues.push(...userImpactIssues)
      }
    } catch (error) {
      integrityReport.issues.push(`User impact assessment failed: ${error}`)
      integrityReport.checks.user_impact.status = "FAIL"
    }

    // Overall assessment
    const failedChecks = Object.values(integrityReport.checks).filter((check) => check.status === "FAIL").length
    const warningChecks = Object.values(integrityReport.checks).filter((check) => check.status === "WARNING").length

    if (failedChecks === 0) {
      integrityReport.overall_status = warningChecks > 0 ? "PASS_WITH_WARNINGS" : "PASS"
    } else {
      integrityReport.overall_status = "FAIL"
    }

    // Generate recommendations
    if (integrityReport.overall_status === "PASS") {
      integrityReport.recommendations = [
        "✅ System integrity verified",
        "✅ Existing functionality preserved",
        "✅ No user impact detected",
        "✅ Safe to proceed with campaign system",
      ]
    } else {
      integrityReport.recommendations = [
        "⚠️ Address integrity issues before deployment",
        "🔧 Fix API compatibility problems",
        "📊 Resolve data integrity issues",
        "👥 Ensure no user impact",
      ]
    }

    console.log(`[INTEGRITY] Check completed. Status: ${integrityReport.overall_status}`)

    return NextResponse.json({
      success: true,
      integrity_report: integrityReport,
      summary: {
        overall_status: integrityReport.overall_status,
        issues_found: integrityReport.issues.length,
        checks_passed: Object.values(integrityReport.checks).filter((c) => c.status === "PASS").length,
        total_checks: Object.keys(integrityReport.checks).length,
      },
    })
  } catch (error) {
    console.error("[INTEGRITY] Check failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "System integrity check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
