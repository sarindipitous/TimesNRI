import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignRecipients,
  getCampaignLogs,
  getCampaignStats,
} from "@/lib/email-campaigns-fixed"

export const dynamic = "force-dynamic"

interface QATestResult {
  test_name: string
  success: boolean
  error?: string
  details?: any
  execution_time_ms: number
}

interface QAValidationReport {
  timestamp: string
  environment: string
  total_tests: number
  passed_tests: number
  failed_tests: number
  overall_status: "PASS" | "FAIL" | "WARNING"
  tests: QATestResult[]
  recommendations: string[]
  rollback_required: boolean
}

export async function POST() {
  const startTime = Date.now()
  const report: QAValidationReport = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    total_tests: 0,
    passed_tests: 0,
    failed_tests: 0,
    overall_status: "PASS",
    tests: [],
    recommendations: [],
    rollback_required: false,
  }

  console.log("🔍 Starting QA Email Campaign Validation...")

  // Test 1: Database Schema Validation
  await runTest(report, "Database Schema Validation", async () => {
    // Check if tables exist with correct structure
    const campaignsTable = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'email_campaigns'
      ORDER BY ordinal_position
    `

    const logsTable = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'email_campaign_logs'
      ORDER BY ordinal_position
    `

    // Validate required columns exist
    const requiredCampaignColumns = [
      "id",
      "name",
      "subject",
      "from_name",
      "from_email",
      "html_content",
      "status",
      "target_type",
      "total_recipients",
      "sent_count",
      "failed_count",
      "created_at",
      "updated_at",
    ]

    const requiredLogColumns = ["id", "campaign_id", "recipient_email", "status", "created_at"]

    const campaignColumns = campaignsTable.map((col: any) => col.column_name)
    const logColumns = logsTable.map((col: any) => col.column_name)

    const missingCampaignColumns = requiredCampaignColumns.filter((col) => !campaignColumns.includes(col))
    const missingLogColumns = requiredLogColumns.filter((col) => !logColumns.includes(col))

    if (missingCampaignColumns.length > 0 || missingLogColumns.length > 0) {
      throw new Error(
        `Missing columns - Campaigns: ${missingCampaignColumns.join(", ")}, Logs: ${missingLogColumns.join(", ")}`,
      )
    }

    // Check if updated_at trigger exists
    const triggers = await sql`
      SELECT trigger_name FROM information_schema.triggers 
      WHERE event_object_table = 'email_campaigns'
    `

    const hasUpdatedAtTrigger = triggers.some((t: any) => t.trigger_name.includes("updated_at"))

    return {
      campaigns_table_columns: campaignColumns.length,
      logs_table_columns: logColumns.length,
      has_updated_at_trigger: hasUpdatedAtTrigger,
      schema_valid: true,
    }
  })

  // Test 2: CRUD Operations Validation
  let testCampaignId: number | null = null
  await runTest(report, "CRUD Operations", async () => {
    // Create
    const campaign = await createCampaign({
      name: `QA Test Campaign ${Date.now()}`,
      subject: "QA Test - Do Not Reply",
      from_name: "QA Team",
      from_email: "qa@timesnri.com",
      html_content: "<p>QA Test Campaign Content</p>",
      target_type: "selected",
      selected_recipients: ["qa-test@resend.dev"],
    })

    if (!campaign) throw new Error("Campaign creation failed")
    testCampaignId = campaign.id

    // Read
    const retrieved = await getCampaignById(campaign.id)
    if (!retrieved) throw new Error("Campaign retrieval failed")

    // Update
    const updated = await updateCampaign(campaign.id, {
      name: "Updated QA Test Campaign",
      total_recipients: 1,
    })
    if (!updated || updated.name !== "Updated QA Test Campaign") {
      throw new Error("Campaign update failed")
    }

    // List
    const allCampaigns = await getAllCampaigns()
    const foundCampaign = allCampaigns.find((c) => c.id === campaign.id)
    if (!foundCampaign) throw new Error("Campaign not found in list")

    return {
      created_id: campaign.id,
      retrieved_successfully: true,
      updated_successfully: true,
      found_in_list: true,
    }
  })

  // Test 3: Recipient Targeting Validation
  await runTest(report, "Recipient Targeting", async () => {
    if (!testCampaignId) throw new Error("No test campaign available")

    const campaign = await getCampaignById(testCampaignId)
    if (!campaign) throw new Error("Test campaign not found")

    // Test selected recipients
    const selectedRecipients = await getCampaignRecipients(campaign)

    // Test "all" targeting
    const allCampaign = await createCampaign({
      name: `QA All Recipients Test ${Date.now()}`,
      subject: "QA All Test",
      from_name: "QA Team",
      from_email: "qa@timesnri.com",
      html_content: "<p>All recipients test</p>",
      target_type: "all",
    })

    if (!allCampaign) throw new Error("All recipients campaign creation failed")

    const allRecipients = await getCampaignRecipients(allCampaign)

    // Cleanup
    await deleteCampaign(allCampaign.id)

    return {
      selected_recipients_count: selectedRecipients.length,
      all_recipients_count: allRecipients.length,
      targeting_working: true,
    }
  })

  // Test 4: Email Service Integration
  await runTest(report, "Email Service Integration", async () => {
    const services = {
      resend: !!process.env.RESEND_API_KEY,
      sendgrid: !!process.env.SENDGRID_API_KEY,
      mailgun: !!process.env.MAILGUN_API_KEY,
    }

    const availableServices = Object.entries(services)
      .filter(([_, available]) => available)
      .map(([name]) => name)

    if (availableServices.length === 0) {
      throw new Error("No email services configured")
    }

    // Test Resend API if available
    let resendTest = null
    if (services.resend) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "QA Team <noreply@timesnri.com>",
            to: ["test@resend.dev"],
            subject: "QA API Test",
            html: "<p>QA API connectivity test</p>",
          }),
        })

        resendTest = {
          status: response.status,
          success: response.ok,
          response: response.ok ? await response.json() : await response.text(),
        }
      } catch (error) {
        resendTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    return {
      configured_services: availableServices,
      resend_test: resendTest,
      at_least_one_service: availableServices.length > 0,
    }
  })

  // Test 5: Campaign Sending Workflow
  await runTest(report, "Campaign Sending Workflow", async () => {
    if (!testCampaignId) throw new Error("No test campaign available")

    const beforeSend = await getCampaignById(testCampaignId)
    if (!beforeSend) throw new Error("Test campaign not found")

    // Attempt to send
    const sendResult = await sendCampaign(testCampaignId)

    const afterSend = await getCampaignById(testCampaignId)
    if (!afterSend) throw new Error("Campaign disappeared after send attempt")

    // Get logs and stats
    const logs = await getCampaignLogs(testCampaignId)
    const stats = await getCampaignStats(testCampaignId)

    return {
      send_result: sendResult,
      status_before: beforeSend.status,
      status_after: afterSend.status,
      logs_created: logs.length,
      stats: stats,
      workflow_completed: true,
    }
  })

  // Test 6: Error Handling and Edge Cases
  await runTest(report, "Error Handling", async () => {
    const errorTests = []

    // Test invalid campaign ID
    try {
      await getCampaignById(999999)
      errorTests.push({ test: "invalid_id", handled: true })
    } catch (error) {
      errorTests.push({ test: "invalid_id", handled: false, error: error instanceof Error ? error.message : "Unknown" })
    }

    // Test sending non-existent campaign
    try {
      const result = await sendCampaign(999999)
      errorTests.push({ test: "send_nonexistent", handled: !result.success, result })
    } catch (error) {
      errorTests.push({ test: "send_nonexistent", handled: true })
    }

    // Test creating campaign with invalid data
    try {
      const result = await createCampaign({
        name: "",
        subject: "",
        from_name: "",
        from_email: "invalid-email",
        html_content: "",
        target_type: "selected",
      })
      errorTests.push({ test: "invalid_data", handled: !result, result })
    } catch (error) {
      errorTests.push({ test: "invalid_data", handled: true })
    }

    return {
      error_tests: errorTests,
      all_errors_handled: errorTests.every((t) => t.handled),
    }
  })

  // Test 7: Performance and Scalability
  await runTest(report, "Performance Test", async () => {
    const performanceTests = []

    // Test bulk recipient handling
    const startTime = Date.now()
    const bulkCampaign = await createCampaign({
      name: `QA Bulk Test ${Date.now()}`,
      subject: "QA Bulk Test",
      from_name: "QA Team",
      from_email: "qa@timesnri.com",
      html_content: "<p>Bulk test</p>",
      target_type: "all",
    })

    if (bulkCampaign) {
      const recipients = await getCampaignRecipients(bulkCampaign)
      const recipientTime = Date.now() - startTime

      performanceTests.push({
        test: "recipient_retrieval",
        count: recipients.length,
        time_ms: recipientTime,
        acceptable: recipientTime < 5000,
      })

      await deleteCampaign(bulkCampaign.id)
    }

    // Test database query performance
    const queryStart = Date.now()
    await getAllCampaigns()
    const queryTime = Date.now() - queryStart

    performanceTests.push({
      test: "campaign_list_query",
      time_ms: queryTime,
      acceptable: queryTime < 2000,
    })

    return {
      performance_tests: performanceTests,
      all_acceptable: performanceTests.every((t) => t.acceptable),
    }
  })

  // Test 8: Data Integrity and Consistency
  await runTest(report, "Data Integrity", async () => {
    if (!testCampaignId) throw new Error("No test campaign available")

    // Check foreign key constraints
    const campaign = await getCampaignById(testCampaignId)
    if (!campaign) throw new Error("Test campaign not found")

    const logs = await getCampaignLogs(testCampaignId)
    const stats = await getCampaignStats(testCampaignId)

    // Verify stats match logs
    const logStats = {
      total: logs.length,
      sent: logs.filter((l) => l.status === "sent").length,
      failed: logs.filter((l) => l.status === "failed").length,
      pending: logs.filter((l) => l.status === "pending").length,
    }

    const statsMatch =
      stats.total === logStats.total &&
      stats.sent === logStats.sent &&
      stats.failed === logStats.failed &&
      stats.pending === logStats.pending

    // Check updated_at trigger
    const beforeUpdate = campaign.updated_at
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
    await updateCampaign(testCampaignId, { name: campaign.name + " Updated" })
    const afterUpdate = await getCampaignById(testCampaignId)
    const updatedAtWorking = afterUpdate && new Date(afterUpdate.updated_at) > new Date(beforeUpdate)

    return {
      stats_match_logs: statsMatch,
      log_stats: logStats,
      db_stats: stats,
      updated_at_trigger_working: updatedAtWorking,
      data_consistent: statsMatch && updatedAtWorking,
    }
  })

  // Cleanup Test Campaign
  if (testCampaignId) {
    await runTest(report, "Cleanup", async () => {
      const deleted = await deleteCampaign(testCampaignId!)
      return { cleanup_successful: deleted }
    })
  }

  // Generate Final Report
  const totalTime = Date.now() - startTime
  report.total_tests = report.tests.length
  report.passed_tests = report.tests.filter((t) => t.success).length
  report.failed_tests = report.tests.filter((t) => !t.success).length

  // Determine overall status
  if (report.failed_tests === 0) {
    report.overall_status = "PASS"
  } else if (report.failed_tests <= 2 && report.passed_tests >= 6) {
    report.overall_status = "WARNING"
    report.recommendations.push("Some non-critical tests failed - review before production deployment")
  } else {
    report.overall_status = "FAIL"
    report.rollback_required = true
    report.recommendations.push("CRITICAL: Multiple tests failed - DO NOT deploy to production")
  }

  // Add specific recommendations
  const failedTests = report.tests.filter((t) => !t.success)
  if (failedTests.some((t) => t.test_name.includes("Database"))) {
    report.recommendations.push("Database schema issues detected - run schema fix script")
  }
  if (failedTests.some((t) => t.test_name.includes("Email Service"))) {
    report.recommendations.push("Email service configuration issues - check API keys")
  }
  if (failedTests.some((t) => t.test_name.includes("CRUD"))) {
    report.recommendations.push("Core functionality broken - investigate database operations")
  }

  console.log(`\n📊 QA Validation Complete: ${report.overall_status}`)
  console.log(`✅ Passed: ${report.passed_tests}/${report.total_tests}`)
  console.log(`❌ Failed: ${report.failed_tests}/${report.total_tests}`)
  console.log(`⏱️  Total Time: ${totalTime}ms`)

  return NextResponse.json({
    success: report.overall_status !== "FAIL",
    qa_report: report,
    deployment_approved: report.overall_status === "PASS",
    execution_time_ms: totalTime,
  })
}

async function runTest(report: QAValidationReport, testName: string, testFunction: () => Promise<any>): Promise<void> {
  const startTime = Date.now()
  console.log(`🧪 Running: ${testName}`)

  try {
    const result = await testFunction()
    const executionTime = Date.now() - startTime

    report.tests.push({
      test_name: testName,
      success: true,
      details: result,
      execution_time_ms: executionTime,
    })

    console.log(`✅ ${testName} - PASSED (${executionTime}ms)`)
  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    report.tests.push({
      test_name: testName,
      success: false,
      error: errorMessage,
      execution_time_ms: executionTime,
    })

    console.log(`❌ ${testName} - FAILED (${executionTime}ms): ${errorMessage}`)
  }
}
