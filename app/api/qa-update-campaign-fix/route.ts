import { type NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { updateCampaign } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not available",
    })
  }

  try {
    const results = {
      updateCampaignTests: [],
      sqlQueryTests: [],
      errorScenarios: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
      },
    }

    // Test 1: Test the exact scenario that was failing
    console.log("Testing updateCampaign with sending status...")
    try {
      // Create a test campaign first
      const testCampaign = await sql`
        INSERT INTO email_campaigns (
          name, subject, from_name, from_email, html_content, 
          target_type, target_criteria, selected_recipients
        ) VALUES (
          'QA Test Campaign', 'Test Subject', 'Test Name', 'test@example.com', 
          '<p>Test content</p>', 'all', '{}', '[]'
        )
        RETURNING *
      `

      const campaignId = testCampaign[0].id

      // Test the exact update that was failing
      const updateResult = await updateCampaign(campaignId, {
        status: "sending",
        total_recipients: 5,
        started_at: new Date(),
      })

      if (updateResult) {
        results.updateCampaignTests.push({
          test: "Update to sending status",
          status: "PASSED",
          details: "Successfully updated campaign to sending status",
        })
        results.summary.passed++
      } else {
        results.updateCampaignTests.push({
          test: "Update to sending status",
          status: "FAILED",
          details: "Failed to update campaign to sending status",
        })
        results.summary.failed++
      }

      // Clean up test campaign
      await sql`DELETE FROM email_campaigns WHERE id = ${campaignId}`
      results.summary.totalTests++
    } catch (error) {
      results.updateCampaignTests.push({
        test: "Update to sending status",
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      results.summary.failed++
      results.summary.totalTests++
    }

    // Test 2: Test completion status update
    console.log("Testing updateCampaign with completion status...")
    try {
      const testCampaign = await sql`
        INSERT INTO email_campaigns (
          name, subject, from_name, from_email, html_content, 
          target_type, target_criteria, selected_recipients, status
        ) VALUES (
          'QA Test Campaign 2', 'Test Subject', 'Test Name', 'test@example.com', 
          '<p>Test content</p>', 'all', '{}', '[]', 'sending'
        )
        RETURNING *
      `

      const campaignId = testCampaign[0].id

      const updateResult = await updateCampaign(campaignId, {
        status: "sent",
        sent_count: 3,
        failed_count: 2,
        completed_at: new Date(),
      })

      if (updateResult) {
        results.updateCampaignTests.push({
          test: "Update to sent status",
          status: "PASSED",
          details: "Successfully updated campaign to sent status",
        })
        results.summary.passed++
      } else {
        results.updateCampaignTests.push({
          test: "Update to sent status",
          status: "FAILED",
          details: "Failed to update campaign to sent status",
        })
        results.summary.failed++
      }

      await sql`DELETE FROM email_campaigns WHERE id = ${campaignId}`
      results.summary.totalTests++
    } catch (error) {
      results.updateCampaignTests.push({
        test: "Update to sent status",
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      results.summary.failed++
      results.summary.totalTests++
    }

    // Test 3: Test draft reset
    console.log("Testing updateCampaign with draft reset...")
    try {
      const testCampaign = await sql`
        INSERT INTO email_campaigns (
          name, subject, from_name, from_email, html_content, 
          target_type, target_criteria, selected_recipients, status
        ) VALUES (
          'QA Test Campaign 3', 'Test Subject', 'Test Name', 'test@example.com', 
          '<p>Test content</p>', 'all', '{}', '[]', 'sending'
        )
        RETURNING *
      `

      const campaignId = testCampaign[0].id

      const updateResult = await updateCampaign(campaignId, {
        status: "draft",
      })

      if (updateResult) {
        results.updateCampaignTests.push({
          test: "Reset to draft status",
          status: "PASSED",
          details: "Successfully reset campaign to draft status",
        })
        results.summary.passed++
      } else {
        results.updateCampaignTests.push({
          test: "Reset to draft status",
          status: "FAILED",
          details: "Failed to reset campaign to draft status",
        })
        results.summary.failed++
      }

      await sql`DELETE FROM email_campaigns WHERE id = ${campaignId}`
      results.summary.totalTests++
    } catch (error) {
      results.updateCampaignTests.push({
        test: "Reset to draft status",
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      results.summary.failed++
      results.summary.totalTests++
    }

    // Test 4: Direct SQL query test
    console.log("Testing direct SQL queries...")
    try {
      const directTest = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'email_campaigns'
        ORDER BY ordinal_position
      `

      results.sqlQueryTests.push({
        test: "Database schema check",
        status: "PASSED",
        details: `Found ${directTest.length} columns in email_campaigns table`,
        columns: directTest.map((col: any) => `${col.column_name} (${col.data_type})`),
      })
      results.summary.passed++
      results.summary.totalTests++
    } catch (error) {
      results.sqlQueryTests.push({
        test: "Database schema check",
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      results.summary.failed++
      results.summary.totalTests++
    }

    return NextResponse.json({
      success: true,
      message: `QA Complete: ${results.summary.passed}/${results.summary.totalTests} tests passed`,
      results,
    })
  } catch (error) {
    console.error("QA test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "QA test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
