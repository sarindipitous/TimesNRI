import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { createCampaign, getCampaignById, deleteCampaign } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function GET() {
  const qaReport = {
    timestamp: new Date().toISOString(),
    overall_status: "UNKNOWN",
    critical_issues: [] as string[],
    warnings: [] as string[],
    recommendations: [] as string[],
    tests: {
      database_connectivity: { status: "UNKNOWN", details: {} },
      schema_validation: { status: "UNKNOWN", details: {} },
      api_endpoints: { status: "UNKNOWN", details: {} },
      campaign_functionality: { status: "UNKNOWN", details: {} },
      email_services: { status: "UNKNOWN", details: {} },
      security_checks: { status: "UNKNOWN", details: {} },
      performance_checks: { status: "UNKNOWN", details: {} },
    },
    deployment_readiness: false,
  }

  try {
    console.log("[QA] Starting comprehensive system review...")

    // 1. Database Connectivity Test
    try {
      if (!hasDb) {
        qaReport.critical_issues.push("DATABASE_URL not configured")
        qaReport.tests.database_connectivity.status = "FAIL"
      } else {
        await sql`SELECT 1`
        qaReport.tests.database_connectivity.status = "PASS"
        qaReport.tests.database_connectivity.details = { connected: true }
      }
    } catch (error) {
      qaReport.critical_issues.push(`Database connection failed: ${error}`)
      qaReport.tests.database_connectivity.status = "FAIL"
    }

    // 2. Schema Validation
    if (hasDb) {
      try {
        // Check email_campaigns table
        const campaignSchema = await sql`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'email_campaigns'
          ORDER BY ordinal_position
        `

        const requiredCampaignColumns = [
          "id",
          "name",
          "subject",
          "from_name",
          "from_email",
          "html_content",
          "status",
          "target_type",
          "target_criteria",
          "selected_recipients",
          "total_recipients",
          "sent_count",
          "failed_count",
          "created_at",
          "updated_at",
        ]

        const existingColumns = campaignSchema.map((col: any) => col.column_name)
        const missingColumns = requiredCampaignColumns.filter((col) => !existingColumns.includes(col))

        if (missingColumns.length > 0) {
          qaReport.critical_issues.push(`Missing campaign table columns: ${missingColumns.join(", ")}`)
          qaReport.tests.schema_validation.status = "FAIL"
        } else {
          qaReport.tests.schema_validation.status = "PASS"
        }

        // Check email_campaign_logs table
        const logsSchema = await sql`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'email_campaign_logs'
        `

        if (logsSchema.length === 0) {
          qaReport.critical_issues.push("email_campaign_logs table missing")
        }

        qaReport.tests.schema_validation.details = {
          campaign_columns: existingColumns,
          logs_table_exists: logsSchema.length > 0,
          missing_columns: missingColumns,
        }
      } catch (error) {
        qaReport.critical_issues.push(`Schema validation failed: ${error}`)
        qaReport.tests.schema_validation.status = "FAIL"
      }
    }

    // 3. API Endpoints Test
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

      // Test campaigns endpoint
      const campaignsResponse = await fetch(`${baseUrl}/api/campaigns`)
      const campaignsHealthy = campaignsResponse.ok

      // Test recipients endpoint
      const recipientsResponse = await fetch(`${baseUrl}/api/campaigns?action=recipients`)
      const recipientsHealthy = recipientsResponse.ok

      if (campaignsHealthy && recipientsHealthy) {
        qaReport.tests.api_endpoints.status = "PASS"
      } else {
        qaReport.critical_issues.push("API endpoints not responding correctly")
        qaReport.tests.api_endpoints.status = "FAIL"
      }

      qaReport.tests.api_endpoints.details = {
        campaigns_endpoint: campaignsHealthy,
        recipients_endpoint: recipientsHealthy,
      }
    } catch (error) {
      qaReport.warnings.push(`API endpoint test failed: ${error}`)
      qaReport.tests.api_endpoints.status = "WARNING"
    }

    // 4. Campaign Functionality Test
    if (hasDb && qaReport.tests.schema_validation.status === "PASS") {
      try {
        // Test campaign CRUD operations
        const testCampaign = await createCampaign({
          name: "QA_TEST_CAMPAIGN_DELETE_IMMEDIATELY",
          subject: "QA Test",
          from_name: "QA Test",
          from_email: "qa@timesnri.com",
          html_content: "<p>QA Test</p>",
          target_type: "selected",
          selected_recipients: ["qa-test@example.com"],
        })

        if (testCampaign) {
          // Test read
          const retrieved = await getCampaignById(testCampaign.id)

          // Test delete (cleanup)
          const deleted = await deleteCampaign(testCampaign.id)

          if (retrieved && deleted) {
            qaReport.tests.campaign_functionality.status = "PASS"
          } else {
            qaReport.critical_issues.push("Campaign CRUD operations incomplete")
            qaReport.tests.campaign_functionality.status = "FAIL"
          }

          qaReport.tests.campaign_functionality.details = {
            create: !!testCampaign,
            read: !!retrieved,
            delete: deleted,
            test_campaign_cleaned_up: deleted,
          }
        } else {
          qaReport.critical_issues.push("Campaign creation failed")
          qaReport.tests.campaign_functionality.status = "FAIL"
        }
      } catch (error) {
        qaReport.critical_issues.push(`Campaign functionality test failed: ${error}`)
        qaReport.tests.campaign_functionality.status = "FAIL"
      }
    }

    // 5. Email Services Check
    const emailServices = {
      resend: !!process.env.RESEND_API_KEY,
      sendgrid: !!process.env.SENDGRID_API_KEY,
      mailgun: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
    }

    const configuredServices = Object.entries(emailServices).filter(([_, configured]) => configured)

    if (configuredServices.length === 0) {
      qaReport.critical_issues.push("No email services configured")
      qaReport.tests.email_services.status = "FAIL"
    } else {
      qaReport.tests.email_services.status = "PASS"
      qaReport.warnings.push(`${configuredServices.length} email service(s) configured`)
    }

    qaReport.tests.email_services.details = emailServices

    // 6. Security Checks
    const securityIssues = []

    // Check for hardcoded credentials (basic check)
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.includes("test")) {
      qaReport.warnings.push("Using test API key for Resend")
    }

    // Check environment variables
    const requiredEnvVars = ["DATABASE_URL", "NEXT_PUBLIC_SITE_URL"]
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

    if (missingEnvVars.length > 0) {
      securityIssues.push(`Missing environment variables: ${missingEnvVars.join(", ")}`)
    }

    qaReport.tests.security_checks.status = securityIssues.length === 0 ? "PASS" : "FAIL"
    qaReport.tests.security_checks.details = { issues: securityIssues }

    if (securityIssues.length > 0) {
      qaReport.critical_issues.push(...securityIssues)
    }

    // 7. Performance Checks
    try {
      const startTime = Date.now()

      if (hasDb) {
        // Test query performance
        await sql`SELECT COUNT(*) FROM waitlist_submissions`
        await sql`SELECT COUNT(*) FROM email_campaigns`
      }

      const queryTime = Date.now() - startTime

      qaReport.tests.performance_checks.status = queryTime < 1000 ? "PASS" : "WARNING"
      qaReport.tests.performance_checks.details = {
        query_time_ms: queryTime,
        acceptable: queryTime < 1000,
      }

      if (queryTime > 1000) {
        qaReport.warnings.push(`Database queries slow: ${queryTime}ms`)
      }
    } catch (error) {
      qaReport.warnings.push(`Performance check failed: ${error}`)
      qaReport.tests.performance_checks.status = "WARNING"
    }

    // Overall Assessment
    const criticalTestsCount = Object.values(qaReport.tests).filter((test) => test.status === "FAIL").length

    const warningTestsCount = Object.values(qaReport.tests).filter((test) => test.status === "WARNING").length

    if (criticalTestsCount === 0) {
      qaReport.overall_status = warningTestsCount > 0 ? "PASS_WITH_WARNINGS" : "PASS"
      qaReport.deployment_readiness = true
    } else {
      qaReport.overall_status = "FAIL"
      qaReport.deployment_readiness = false
    }

    // Generate Recommendations
    if (qaReport.deployment_readiness) {
      qaReport.recommendations = [
        "✅ System is ready for production deployment",
        "🧪 Start with small test campaigns",
        "📊 Monitor email delivery logs",
        "🔄 Set up regular health checks",
      ]
    } else {
      qaReport.recommendations = [
        "❌ Fix all critical issues before deployment",
        "📋 Run database schema fixes if needed",
        "🔑 Configure missing environment variables",
        "📧 Set up email service credentials",
        "🔄 Re-run QA after fixes",
      ]
    }

    console.log(`[QA] Review completed. Status: ${qaReport.overall_status}`)

    return NextResponse.json({
      success: true,
      qa_report: qaReport,
      summary: {
        overall_status: qaReport.overall_status,
        deployment_ready: qaReport.deployment_readiness,
        critical_issues: qaReport.critical_issues.length,
        warnings: qaReport.warnings.length,
        tests_passed: Object.values(qaReport.tests).filter((t) => t.status === "PASS").length,
        total_tests: Object.keys(qaReport.tests).length,
      },
    })
  } catch (error) {
    console.error("[QA] Review failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "QA review failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
