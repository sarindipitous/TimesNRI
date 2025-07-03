import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { createCampaign, sendCampaign, getCampaignById } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function POST() {
  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not available",
    })
  }

  const testResults = {
    timestamp: new Date().toISOString(),
    steps: [] as any[],
    campaignId: null as number | null,
    spamRisk: "SAFE",
  }

  try {
    // Step 1: Create test campaign
    testResults.steps.push({
      step: 1,
      action: "Create test campaign",
      status: "started",
    })

    const campaign = await createCampaign({
      name: "QA Flow Test Campaign",
      subject: "QA Test - Do Not Reply",
      from_name: "QA Test",
      from_email: "qa@timesnri.com",
      html_content: "<p>This is a QA test email. Please ignore.</p>",
      target_type: "selected",
      selected_recipients: ["qa-test@example.com"], // Safe test email
    })

    if (!campaign) {
      testResults.steps[0].status = "failed"
      testResults.steps[0].error = "Failed to create campaign"
      return NextResponse.json({
        success: false,
        message: "Campaign creation failed",
        testResults,
      })
    }

    testResults.campaignId = campaign.id
    testResults.steps[0].status = "completed"
    testResults.steps[0].details = `Campaign created with ID: ${campaign.id}`

    // Step 2: Verify campaign exists
    testResults.steps.push({
      step: 2,
      action: "Verify campaign exists",
      status: "started",
    })

    const retrievedCampaign = await getCampaignById(campaign.id)
    if (!retrievedCampaign) {
      testResults.steps[1].status = "failed"
      testResults.steps[1].error = "Campaign not found after creation"
      return NextResponse.json({
        success: false,
        message: "Campaign verification failed",
        testResults,
      })
    }

    testResults.steps[1].status = "completed"
    testResults.steps[1].details = `Campaign verified: ${retrievedCampaign.name}`

    // Step 3: Test campaign sending (this is where the updateCampaign error occurs)
    testResults.steps.push({
      step: 3,
      action: "Test campaign sending",
      status: "started",
    })

    const sendResult = await sendCampaign(campaign.id)

    if (!sendResult.success) {
      testResults.steps[2].status = "failed"
      testResults.steps[2].error = sendResult.message

      // Check if it's the specific updateCampaign error
      if (sendResult.message.includes("updated_at")) {
        testResults.spamRisk = "SAFE - Error prevented sending"
        testResults.steps[2].details = "updateCampaign error prevented email sending (GOOD)"
      } else {
        testResults.spamRisk = "UNKNOWN - Different error"
      }

      // Clean up even if sending failed
      await sql`DELETE FROM email_campaigns WHERE id = ${campaign.id}`

      return NextResponse.json({
        success: false,
        message: `Campaign sending failed: ${sendResult.message}`,
        testResults,
        spamRisk: testResults.spamRisk,
      })
    }

    testResults.steps[2].status = "completed"
    testResults.steps[2].details = sendResult.message

    // Step 4: Check if emails were actually sent
    testResults.steps.push({
      step: 4,
      action: "Check email logs",
      status: "started",
    })

    const emailLogs = await sql`
      SELECT * FROM email_campaign_logs 
      WHERE campaign_id = ${campaign.id}
    `

    testResults.steps[3].status = "completed"
    testResults.steps[3].details = `Found ${emailLogs.length} email log entries`

    if (emailLogs.length > 0) {
      const sentEmails = emailLogs.filter((log: any) => log.status === "sent")
      if (sentEmails.length > 0) {
        testResults.spamRisk = "LOW - Test emails sent to safe addresses"
      }
    }

    // Step 5: Cleanup
    testResults.steps.push({
      step: 5,
      action: "Cleanup test data",
      status: "started",
    })

    await sql`DELETE FROM email_campaign_logs WHERE campaign_id = ${campaign.id}`
    await sql`DELETE FROM email_campaigns WHERE id = ${campaign.id}`

    testResults.steps[4].status = "completed"
    testResults.steps[4].details = "Test data cleaned up successfully"

    return NextResponse.json({
      success: true,
      message: "Campaign flow test completed successfully",
      testResults,
      spamRisk: testResults.spamRisk,
      conclusion: "✅ Campaign system is working correctly. No spam risk detected.",
    })
  } catch (error) {
    console.error("Campaign flow test error:", error)

    // Cleanup on error
    if (testResults.campaignId) {
      try {
        await sql`DELETE FROM email_campaign_logs WHERE campaign_id = ${testResults.campaignId}`
        await sql`DELETE FROM email_campaigns WHERE id = ${testResults.campaignId}`
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Campaign flow test failed",
        testResults,
        error: error instanceof Error ? error.message : "Unknown error",
        spamRisk: "UNKNOWN - Test failed",
      },
      { status: 500 },
    )
  }
}
