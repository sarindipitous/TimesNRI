import { NextResponse } from "next/server"
import { createCampaign, sendCampaign, deleteCampaign } from "@/lib/email-campaigns-fixed"

export const dynamic = "force-dynamic"

export async function POST() {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {
      create_campaign: { success: false, error: null as string | null, data: null as any },
      send_campaign: { success: false, error: null as string | null, data: null as any },
      cleanup: { success: false, error: null as string | null },
    },
    overall_success: false,
  }

  let testCampaignId: number | null = null

  try {
    // Test 1: Create a test campaign
    console.log("Testing campaign creation...")
    try {
      const testCampaign = await createCampaign({
        name: `Test Campaign ${Date.now()}`,
        subject: "Test Campaign - Do Not Reply",
        from_name: "Test Team",
        from_email: "noreply@timesnri.com",
        html_content: "<p>This is a test campaign. Please ignore.</p>",
        target_type: "selected",
        selected_recipients: ["test@resend.dev"], // Resend's test email
      })

      if (testCampaign) {
        testResults.tests.create_campaign.success = true
        testResults.tests.create_campaign.data = {
          id: testCampaign.id,
          name: testCampaign.name,
          status: testCampaign.status,
        }
        testCampaignId = testCampaign.id
        console.log(`✅ Campaign created with ID: ${testCampaignId}`)
      } else {
        testResults.tests.create_campaign.error = "Campaign creation returned null"
      }
    } catch (error) {
      testResults.tests.create_campaign.error = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ Campaign creation failed:", error)
    }

    // Test 2: Send campaign (only if creation succeeded)
    if (testCampaignId) {
      console.log("Testing campaign sending...")
      try {
        const sendResult = await sendCampaign(testCampaignId)

        testResults.tests.send_campaign.success = sendResult.success
        testResults.tests.send_campaign.data = {
          message: sendResult.message,
        }

        if (sendResult.success) {
          console.log(`✅ Campaign sent successfully`)
        } else {
          testResults.tests.send_campaign.error = sendResult.message
          console.log(`❌ Campaign sending failed: ${sendResult.message}`)
        }
      } catch (error) {
        testResults.tests.send_campaign.error = error instanceof Error ? error.message : "Unknown error"
        console.error("❌ Campaign sending failed:", error)
      }
    }

    // Test 3: Cleanup
    if (testCampaignId) {
      console.log("Cleaning up test campaign...")
      try {
        const deleteSuccess = await deleteCampaign(testCampaignId)
        testResults.tests.cleanup.success = deleteSuccess

        if (deleteSuccess) {
          console.log(`✅ Test campaign deleted successfully`)
        } else {
          testResults.tests.cleanup.error = "Delete operation returned false"
        }
      } catch (error) {
        testResults.tests.cleanup.error = error instanceof Error ? error.message : "Unknown error"
        console.error("❌ Campaign cleanup failed:", error)
      }
    }

    // Overall assessment
    const successfulTests = Object.values(testResults.tests).filter((test) => test.success).length
    const totalTests = Object.keys(testResults.tests).length
    testResults.overall_success = successfulTests >= 2 // At least create and send should work

    console.log(`\n📊 Test Results: ${successfulTests}/${totalTests} tests passed`)

    return NextResponse.json({
      success: testResults.overall_success,
      message: testResults.overall_success
        ? "Campaign system is working correctly"
        : `${successfulTests}/${totalTests} tests passed - see details for issues`,
      ...testResults,
    })
  } catch (error) {
    console.error("Test system error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test system failed",
        details: error instanceof Error ? error.message : "Unknown error",
        ...testResults,
      },
      { status: 500 },
    )
  }
}
