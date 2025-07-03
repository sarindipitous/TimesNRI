import { type NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { sendCampaign, createCampaign } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not available",
    })
  }

  try {
    console.log("🧪 Testing complete campaign flow...")

    const testResults = {
      steps: [],
      emailsSent: 0,
      campaignId: null,
      success: false,
    }

    // Step 1: Create a test campaign
    console.log("Step 1: Creating test campaign...")
    const campaign = await createCampaign({
      name: "QA Test Campaign - Flow Test",
      subject: "QA Test - Do Not Reply",
      from_name: "QA Test",
      from_email: "qa-test@timesnri.com",
      html_content: "<p>This is a QA test email. Please ignore.</p>",
      target_type: "selected",
      selected_recipients: ["qa-test@example.com"], // Non-existent email to prevent actual sending
    })

    if (!campaign) {
      testResults.steps.push({
        step: "Create Campaign",
        status: "FAILED",
        error: "Failed to create test campaign",
      })
      return NextResponse.json({ success: false, testResults })
    }

    testResults.campaignId = campaign.id
    testResults.steps.push({
      step: "Create Campaign",
      status: "PASSED",
      details: `Created campaign ${campaign.id}`,
    })

    // Step 2: Attempt to send the campaign (this should trigger the updateCampaign call)
    console.log("Step 2: Attempting to send campaign...")
    try {
      const sendResult = await sendCampaign(campaign.id)

      testResults.steps.push({
        step: "Send Campaign",
        status: sendResult.success ? "PASSED" : "FAILED",
        details: sendResult.message,
      })

      // Step 3: Check if any emails were actually sent
      console.log("Step 3: Checking for sent emails...")
      const emailLogs = await sql`
        SELECT COUNT(*) as sent_count
        FROM email_campaign_logs 
        WHERE campaign_id = ${campaign.id} AND status = 'sent'
      `

      const actualEmailsSent = Number(emailLogs[0]?.sent_count || 0)
      testResults.emailsSent = actualEmailsSent

      testResults.steps.push({
        step: "Check Email Logs",
        status: actualEmailsSent === 0 ? "PASSED" : "WARNING",
        details: `${actualEmailsSent} emails were actually sent`,
      })

      // Step 4: Verify campaign status
      console.log("Step 4: Checking campaign status...")
      const updatedCampaign = await sql`
        SELECT status, sent_count, failed_count 
        FROM email_campaigns 
        WHERE id = ${campaign.id}
      `

      if (updatedCampaign.length > 0) {
        testResults.steps.push({
          step: "Check Campaign Status",
          status: "PASSED",
          details: `Campaign status: ${updatedCampaign[0].status}, sent: ${updatedCampaign[0].sent_count}, failed: ${updatedCampaign[0].failed_count}`,
        })
      }

      testResults.success = true
    } catch (error) {
      testResults.steps.push({
        step: "Send Campaign",
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Cleanup: Delete the test campaign
    console.log("Cleanup: Deleting test campaign...")
    try {
      await sql`DELETE FROM email_campaign_logs WHERE campaign_id = ${campaign.id}`
      await sql`DELETE FROM email_campaigns WHERE id = ${campaign.id}`
      testResults.steps.push({
        step: "Cleanup",
        status: "PASSED",
        details: "Test campaign deleted",
      })
    } catch (error) {
      testResults.steps.push({
        step: "Cleanup",
        status: "WARNING",
        error: "Failed to cleanup test campaign",
      })
    }

    return NextResponse.json({
      success: true,
      message: testResults.success ? "Campaign flow test completed successfully" : "Campaign flow test had issues",
      testResults,
      spamRisk: testResults.emailsSent === 0 ? "SAFE - No emails sent" : `RISK - ${testResults.emailsSent} emails sent`,
    })
  } catch (error) {
    console.error("Campaign flow test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Campaign flow test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
