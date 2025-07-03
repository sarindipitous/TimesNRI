import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

interface QATest {
  name: string
  status: "PASS" | "FAIL" | "WARNING" | "CRITICAL"
  message: string
  details?: any
  critical: boolean
  recommendation?: string
}

export async function GET() {
  const qaResults = {
    timestamp: new Date().toISOString(),
    overall_status: "UNKNOWN",
    categories: {
      database: { status: "UNKNOWN", tests: [] as any[] },
      campaigns: { status: "UNKNOWN", tests: [] as any[] },
      email_services: { status: "UNKNOWN", tests: [] as any[] },
      existing_features: { status: "UNKNOWN", tests: [] as any[] },
    },
    summary: {
      total_tests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  }

  try {
    // Database Tests
    const dbConnectTest = {
      name: "Database Connection",
      status: hasDb ? "PASS" : "FAIL",
      message: hasDb ? "Database connected" : "DATABASE_URL not configured",
    }
    qaResults.categories.database.tests.push(dbConnectTest)

    if (hasDb) {
      try {
        // Test campaign tables
        const campaignTableTest = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'email_campaigns'
          );
        `

        qaResults.categories.database.tests.push({
          name: "Campaign Tables",
          status: campaignTableTest[0]?.exists ? "PASS" : "FAIL",
          message: campaignTableTest[0]?.exists ? "Campaign tables exist" : "Campaign tables missing",
        })

        // Test waitlist table
        const waitlistTest = await sql`SELECT COUNT(*) as count FROM waitlist_submissions LIMIT 1`
        qaResults.categories.database.tests.push({
          name: "Waitlist Table",
          status: "PASS",
          message: `Waitlist accessible with ${waitlistTest[0].count} entries`,
        })
      } catch (error) {
        qaResults.categories.database.tests.push({
          name: "Table Access",
          status: "FAIL",
          message: `Table access failed: ${error}`,
        })
      }
    }

    // Campaign System Tests
    if (hasDb) {
      try {
        const campaigns = await sql`SELECT COUNT(*) as count FROM email_campaigns`
        qaResults.categories.campaigns.tests.push({
          name: "Campaign System",
          status: "PASS",
          message: `Found ${campaigns[0].count} campaigns`,
        })
      } catch (error) {
        qaResults.categories.campaigns.tests.push({
          name: "Campaign System",
          status: "FAIL",
          message: `Campaign system error: ${error}`,
        })
      }
    }

    // Email Service Tests
    const emailServices = {
      resend: !!process.env.RESEND_API_KEY,
      sendgrid: !!process.env.SENDGRID_API_KEY,
      mailgun: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
    }

    const configuredServices = Object.entries(emailServices).filter(([_, configured]) => configured)

    qaResults.categories.email_services.tests.push({
      name: "Email Service Configuration",
      status: configuredServices.length > 0 ? "PASS" : "FAIL",
      message: `${configuredServices.length} email service(s) configured`,
    })

    // Calculate category statuses
    Object.keys(qaResults.categories).forEach((category) => {
      const tests = qaResults.categories[category].tests
      const failedTests = tests.filter((t) => t.status === "FAIL")
      qaResults.categories[category].status = failedTests.length === 0 ? "PASS" : "FAIL"
    })

    // Calculate summary
    const allTests = Object.values(qaResults.categories).flatMap((cat) => cat.tests)
    qaResults.summary.total_tests = allTests.length
    qaResults.summary.passed = allTests.filter((t) => t.status === "PASS").length
    qaResults.summary.failed = allTests.filter((t) => t.status === "FAIL").length
    qaResults.summary.warnings = allTests.filter((t) => t.status === "WARNING").length

    qaResults.overall_status = qaResults.summary.failed === 0 ? "PASS" : "FAIL"

    return NextResponse.json(qaResults)
  } catch (error) {
    console.error("Comprehensive QA check error:", error)
    return NextResponse.json({
      success: false,
      error: "QA check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
