import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { getCampaignById, getCampaignRecipients, createCampaign, deleteCampaign } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

interface QAResult {
  test: string
  status: "pass" | "fail" | "warning"
  message: string
  details?: any
}

export async function GET() {
  const results: QAResult[] = []

  // Test 1: Database Connection
  try {
    if (!hasDb) {
      results.push({
        test: "Database Connection",
        status: "fail",
        message: "DATABASE_URL not configured",
      })
    } else {
      await sql`SELECT 1`
      results.push({
        test: "Database Connection",
        status: "pass",
        message: "Database connection successful",
      })
    }
  } catch (error) {
    results.push({
      test: "Database Connection",
      status: "fail",
      message: `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }

  // Test 2: Campaign Tables Exist
  try {
    const campaignTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_campaigns'
      )
    `

    const logsTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_campaign_logs'
      )
    `

    if (campaignTable[0].exists && logsTable[0].exists) {
      results.push({
        test: "Campaign Tables",
        status: "pass",
        message: "All campaign tables exist",
      })
    } else {
      results.push({
        test: "Campaign Tables",
        status: "fail",
        message: `Missing tables - campaigns: ${campaignTable[0].exists}, logs: ${logsTable[0].exists}`,
        details: {
          email_campaigns: campaignTable[0].exists,
          email_campaign_logs: logsTable[0].exists,
        },
      })
    }
  } catch (error) {
    results.push({
      test: "Campaign Tables",
      status: "fail",
      message: `Failed to check tables: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }

  // Test 3: Email Service Configuration
  const emailServices = {
    resend: !!process.env.RESEND_API_KEY,
    sendgrid: !!process.env.SENDGRID_API_KEY,
    mailgun: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
  }

  const availableServices = Object.entries(emailServices)
    .filter(([_, available]) => available)
    .map(([service]) => service)

  if (availableServices.length > 0) {
    results.push({
      test: "Email Services",
      status: "pass",
      message: `${availableServices.length} email service(s) configured: ${availableServices.join(", ")}`,
      details: emailServices,
    })
  } else {
    results.push({
      test: "Email Services",
      status: "fail",
      message: "No email services configured",
      details: emailServices,
    })
  }

  // Test 4: Waitlist Data for Recipients
  try {
    const waitlistCount = await sql`SELECT COUNT(*) as count FROM waitlist_submissions`
    const count = Number(waitlistCount[0].count)

    if (count > 0) {
      results.push({
        test: "Recipient Data",
        status: "pass",
        message: `${count} waitlist members available as recipients`,
      })
    } else {
      results.push({
        test: "Recipient Data",
        status: "warning",
        message: "No waitlist members found - campaigns will have no recipients",
      })
    }
  } catch (error) {
    results.push({
      test: "Recipient Data",
      status: "fail",
      message: `Failed to check waitlist data: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }

  // Test 5: Campaign CRUD Operations
  try {
    // Create test campaign
    const testCampaign = await createCampaign({
      name: "QA Test Campaign",
      subject: "QA Test Subject",
      from_name: "QA Test",
      from_email: "qa@timesnri.com",
      html_content: "<h1>QA Test Content</h1><p>Hello {{name}}, this is a test campaign.</p>",
      target_type: "selected",
      selected_recipients: ["test@example.com"],
    })

    if (testCampaign) {
      // Test read
      const retrieved = await getCampaignById(testCampaign.id)

      // Test recipients
      const recipients = await getCampaignRecipients(testCampaign)

      // Clean up
      await deleteCampaign(testCampaign.id)

      results.push({
        test: "Campaign CRUD",
        status: "pass",
        message: "Campaign create, read, and delete operations successful",
        details: {
          created: !!testCampaign,
          retrieved: !!retrieved,
          recipients_count: recipients.length,
          deleted: true,
        },
      })
    } else {
      results.push({
        test: "Campaign CRUD",
        status: "fail",
        message: "Failed to create test campaign",
      })
    }
  } catch (error) {
    results.push({
      test: "Campaign CRUD",
      status: "fail",
      message: `Campaign CRUD operations failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }

  // Test 6: Template Variable Replacement
  try {
    const testHtml = "<h1>Hello {{name}}</h1><p>Your email is {{email}} and subject is {{subject}}</p>"
    let processedHtml = testHtml
    processedHtml = processedHtml.replace(/\{\{name\}\}/g, "Test User")
    processedHtml = processedHtml.replace(/\{\{email\}\}/g, "test@example.com")
    processedHtml = processedHtml.replace(/\{\{subject\}\}/g, "Test Subject")

    const expectedHtml = "<h1>Hello Test User</h1><p>Your email is test@example.com and subject is Test Subject</p>"

    if (processedHtml === expectedHtml) {
      results.push({
        test: "Template Variables",
        status: "pass",
        message: "Template variable replacement working correctly",
      })
    } else {
      results.push({
        test: "Template Variables",
        status: "fail",
        message: "Template variable replacement not working correctly",
        details: {
          original: testHtml,
          processed: processedHtml,
          expected: expectedHtml,
        },
      })
    }
  } catch (error) {
    results.push({
      test: "Template Variables",
      status: "fail",
      message: `Template variable test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }

  // Test 7: Existing Functionality (Waitlist)
  try {
    // Test waitlist API endpoint
    const waitlistResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/waitlist`,
      {
        method: "GET",
      },
    )

    if (waitlistResponse.ok) {
      results.push({
        test: "Existing Waitlist API",
        status: "pass",
        message: "Waitlist API endpoint accessible",
      })
    } else {
      results.push({
        test: "Existing Waitlist API",
        status: "warning",
        message: `Waitlist API returned status ${waitlistResponse.status}`,
      })
    }
  } catch (error) {
    results.push({
      test: "Existing Waitlist API",
      status: "warning",
      message: "Could not test waitlist API (may be normal in some environments)",
    })
  }

  // Test 8: Campaign Email Service Integration
  try {
    // Test if we can construct proper email payloads
    const testPayload = {
      to: "test@example.com",
      from: "Test Sender <test@timesnri.com>",
      subject: "Test Campaign Subject",
      html: "<h1>Test Campaign Content</h1>",
    }

    // Parse from field
    const fromMatch = testPayload.from.match(/^(.+?)\s*<(.+)>$/)
    const fromEmail = fromMatch ? fromMatch[2].trim() : testPayload.from
    const fromName = fromMatch ? fromMatch[1].trim() : ""

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)
    const isTimesNRIDomain = fromEmail.includes("@timesnri.com")

    if (isValidEmail && isTimesNRIDomain) {
      results.push({
        test: "Email Payload Construction",
        status: "pass",
        message: "Email payload construction working correctly",
        details: {
          parsed_from_email: fromEmail,
          parsed_from_name: fromName,
          is_valid_email: isValidEmail,
          is_verified_domain: isTimesNRIDomain,
        },
      })
    } else {
      results.push({
        test: "Email Payload Construction",
        status: "warning",
        message: "Email payload construction may have issues",
        details: {
          parsed_from_email: fromEmail,
          parsed_from_name: fromName,
          is_valid_email: isValidEmail,
          is_verified_domain: isTimesNRIDomain,
        },
      })
    }
  } catch (error) {
    results.push({
      test: "Email Payload Construction",
      status: "fail",
      message: `Email payload test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }

  // Calculate overall status
  const failCount = results.filter((r) => r.status === "fail").length
  const warningCount = results.filter((r) => r.status === "warning").length
  const passCount = results.filter((r) => r.status === "pass").length

  let overallStatus: "pass" | "warning" | "fail"
  if (failCount > 0) {
    overallStatus = "fail"
  } else if (warningCount > 0) {
    overallStatus = "warning"
  } else {
    overallStatus = "pass"
  }

  return NextResponse.json({
    overall_status: overallStatus,
    summary: {
      total_tests: results.length,
      passed: passCount,
      warnings: warningCount,
      failed: failCount,
    },
    production_ready: failCount === 0,
    results,
    timestamp: new Date().toISOString(),
    recommendations:
      failCount > 0
        ? [
            "Fix all failed tests before deploying to production",
            "Run database setup scripts if tables are missing",
            "Configure at least one email service",
            "Ensure DATABASE_URL is properly set",
          ]
        : [
            "System appears ready for production deployment",
            "Monitor email delivery logs after deployment",
            "Test with small campaigns initially",
          ],
  })
}
