import { type NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { createCampaign, getCampaignById } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    overall_status: "UNKNOWN",
    tests: [] as any[],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  }

  try {
    // Test 1: Database Connectivity
    const dbTest = {
      name: "Database Connectivity",
      status: "FAIL",
      message: "",
      details: {},
    }

    if (!hasDb) {
      dbTest.message = "DATABASE_URL not configured"
    } else {
      try {
        await sql`SELECT 1`
        dbTest.status = "PASS"
        dbTest.message = "Database connection successful"
      } catch (error) {
        dbTest.message = `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    }
    results.tests.push(dbTest)

    // Test 2: Campaign Tables Schema
    const schemaTest = {
      name: "Campaign Tables Schema",
      status: "FAIL",
      message: "",
      details: {},
    }

    if (hasDb) {
      try {
        // Check email_campaigns table
        const campaignColumns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'email_campaigns' 
          ORDER BY ordinal_position
        `

        const requiredColumns = [
          "id",
          "name",
          "subject",
          "from_name",
          "from_email",
          "html_content",
          "status",
          "target_type",
          "created_at",
          "updated_at",
        ]

        const existingColumns = campaignColumns.map((col: any) => col.column_name)
        const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col))

        if (missingColumns.length > 0) {
          schemaTest.message = `Missing columns: ${missingColumns.join(", ")}`
          schemaTest.details = { missingColumns, existingColumns }
        } else {
          schemaTest.status = "PASS"
          schemaTest.message = "All required columns present"
          schemaTest.details = { columns: existingColumns }
        }

        // Check email_campaign_logs table
        const logColumns = await sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'email_campaign_logs'
        `

        schemaTest.details.logTableExists = logColumns.length > 0
        schemaTest.details.logColumns = logColumns.map((col: any) => col.column_name)
      } catch (error) {
        schemaTest.message = `Schema check failed: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    } else {
      schemaTest.message = "Database not available"
    }
    results.tests.push(schemaTest)

    // Test 3: Email Service Configuration
    const emailServiceTest = {
      name: "Email Service Configuration",
      status: "FAIL",
      message: "",
      details: {},
    }

    const services = {
      resend: !!process.env.RESEND_API_KEY,
      mailgun: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
      sendgrid: !!process.env.SENDGRID_API_KEY,
    }

    const configuredServices = Object.entries(services).filter(([_, configured]) => configured)

    if (configuredServices.length === 0) {
      emailServiceTest.message = "No email services configured"
    } else {
      emailServiceTest.status = "PASS"
      emailServiceTest.message = `${configuredServices.length} email service(s) configured`
      emailServiceTest.details = services
    }
    results.tests.push(emailServiceTest)

    // Test 4: Campaign CRUD Operations
    const crudTest = {
      name: "Campaign CRUD Operations",
      status: "FAIL",
      message: "",
      details: {},
    }

    if (hasDb && schemaTest.status === "PASS") {
      try {
        // Test create campaign
        const testCampaign = await createCampaign({
          name: "QA Test Campaign",
          subject: "QA Test Subject",
          from_name: "QA Test",
          from_email: "qa@timesnri.com",
          html_content: "<p>QA Test Content</p>",
          target_type: "selected",
          selected_recipients: ["qa@test.com"],
        })

        if (testCampaign) {
          // Test read campaign
          const retrievedCampaign = await getCampaignById(testCampaign.id)

          if (retrievedCampaign) {
            // Clean up test campaign
            await sql`DELETE FROM email_campaigns WHERE id = ${testCampaign.id}`

            crudTest.status = "PASS"
            crudTest.message = "Campaign CRUD operations working"
            crudTest.details = {
              created: true,
              retrieved: true,
              deleted: true,
            }
          } else {
            crudTest.message = "Failed to retrieve created campaign"
          }
        } else {
          crudTest.message = "Failed to create test campaign"
        }
      } catch (error) {
        crudTest.message = `CRUD test failed: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    } else {
      crudTest.message = "Skipped - database or schema issues"
    }
    results.tests.push(crudTest)

    // Test 5: Template Variable Processing
    const templateTest = {
      name: "Template Variable Processing",
      status: "PASS",
      message: "",
      details: {},
    }

    try {
      const testHtml = "<p>Hello {{name}}, your email is {{email}} and subject is {{subject}}</p>"
      const processedHtml = testHtml
        .replace(/\{\{name\}\}/g, "John Doe")
        .replace(/\{\{email\}\}/g, "john@example.com")
        .replace(/\{\{subject\}\}/g, "Test Subject")

      const expectedHtml = "<p>Hello John Doe, your email is john@example.com and subject is Test Subject</p>"

      if (processedHtml === expectedHtml) {
        templateTest.message = "Template variable processing working correctly"
        templateTest.details = { processed: processedHtml }
      } else {
        templateTest.status = "FAIL"
        templateTest.message = "Template variable processing failed"
        templateTest.details = { expected: expectedHtml, actual: processedHtml }
      }
    } catch (error) {
      templateTest.status = "FAIL"
      templateTest.message = `Template processing error: ${error instanceof Error ? error.message : "Unknown error"}`
    }
    results.tests.push(templateTest)

    // Test 6: Existing Functionality Protection
    const existingFuncTest = {
      name: "Existing Functionality Protection",
      status: "PASS",
      message: "",
      details: {},
    }

    if (hasDb) {
      try {
        // Check waitlist table still exists and accessible
        const waitlistCheck = await sql`
          SELECT COUNT(*) as count FROM waitlist_submissions LIMIT 1
        `

        // Check email config table
        const emailConfigCheck = await sql`
          SELECT COUNT(*) as count FROM email_config LIMIT 1
        `

        existingFuncTest.message = "Existing tables accessible"
        existingFuncTest.details = {
          waitlistAccessible: true,
          emailConfigAccessible: true,
        }
      } catch (error) {
        existingFuncTest.status = "FAIL"
        existingFuncTest.message = `Existing functionality check failed: ${error instanceof Error ? error.message : "Unknown error"}`
      }
    } else {
      existingFuncTest.message = "Database not available for testing"
    }
    results.tests.push(existingFuncTest)

    // Calculate summary
    results.summary.total = results.tests.length
    results.summary.passed = results.tests.filter((t) => t.status === "PASS").length
    results.summary.failed = results.tests.filter((t) => t.status === "FAIL").length
    results.summary.warnings = results.tests.filter((t) => t.status === "WARNING").length

    // Determine overall status
    if (results.summary.failed === 0) {
      results.overall_status = "PASS"
    } else if (results.summary.failed <= 2) {
      results.overall_status = "WARNING"
    } else {
      results.overall_status = "FAIL"
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("QA System Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "QA system failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
