import { NextResponse } from "next/server"
import { createCampaign, getCampaignById, deleteCampaign } from "@/lib/email-campaigns"
import { getAllWaitlistSubmissions } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {
      create_campaign: { success: false, error: null as string | null, data: null as any },
      get_campaign: { success: false, error: null as string | null, data: null as any },
      get_recipients: { success: false, error: null as string | null, count: 0 },
      delete_campaign: { success: false, error: null as string | null },
    },
    overall_success: false,
    cleanup_performed: false,
  }

  let testCampaignId: number | null = null

  try {
    // Test 1: Create a test campaign
    console.log("Testing campaign creation...")
    try {
      const testCampaign = await createCampaign({
        name: `QA Test Campaign ${Date.now()}`,
        subject: "QA Test - Please Ignore",
        from_name: "QA Test",
        from_email: "noreply@timesnri.com",
        html_content: "<p>This is a QA test campaign. Please ignore.</p>",
        target_type: "all",
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

    // Test 2: Get campaign by ID
    if (testCampaignId) {
      console.log("Testing campaign retrieval...")
      try {
        const retrievedCampaign = await getCampaignById(testCampaignId)
        if (retrievedCampaign) {
          testResults.tests.get_campaign.success = true
          testResults.tests.get_campaign.data = {
            id: retrievedCampaign.id,
            name: retrievedCampaign.name,
            matches_created: retrievedCampaign.id === testCampaignId,
          }
          console.log(`✅ Campaign retrieved successfully`)
        } else {
          testResults.tests.get_campaign.error = "Campaign retrieval returned null"
        }
      } catch (error) {
        testResults.tests.get_campaign.error = error instanceof Error ? error.message : "Unknown error"
        console.error("❌ Campaign retrieval failed:", error)
      }
    }

    // Test 3: Get recipients (test waitlist integration)
    console.log("Testing recipients retrieval...")
    try {
      const waitlistSubmissions = await getAllWaitlistSubmissions(10, 0)
      testResults.tests.get_recipients.success = true
      testResults.tests.get_recipients.count = waitlistSubmissions.length
      console.log(`✅ Found ${waitlistSubmissions.length} waitlist recipients`)
    } catch (error) {
      testResults.tests.get_recipients.error = error instanceof Error ? error.message : "Unknown error"
      console.error("❌ Recipients retrieval failed:", error)
    }

    // Test 4: Delete test campaign (cleanup)
    if (testCampaignId) {
      console.log("Testing campaign deletion (cleanup)...")
      try {
        const deleteSuccess = await deleteCampaign(testCampaignId)
        testResults.tests.delete_campaign.success = deleteSuccess
        testResults.cleanup_performed = deleteSuccess
        if (deleteSuccess) {
          console.log(`✅ Test campaign deleted successfully`)
        } else {
          testResults.tests.delete_campaign.error = "Delete operation returned false"
        }
      } catch (error) {
        testResults.tests.delete_campaign.error = error instanceof Error ? error.message : "Unknown error"
        console.error("❌ Campaign deletion failed:", error)
      }
    }

    // Overall assessment
    const successfulTests = Object.values(testResults.tests).filter((test) => test.success).length
    const totalTests = Object.keys(testResults.tests).length
    testResults.overall_success = successfulTests === totalTests

    console.log(`\n📊 Test Results: ${successfulTests}/${totalTests} tests passed`)

    return NextResponse.json({
      success: testResults.overall_success,
      message: testResults.overall_success
        ? "All campaign system tests passed successfully"
        : `${successfulTests}/${totalTests} tests passed - see details for issues`,
      ...testResults,
      recommendations: [
        ...(testResults.tests.create_campaign.success ? [] : ["🔧 Fix campaign creation functionality"]),
        ...(testResults.tests.get_campaign.success ? [] : ["🔧 Fix campaign retrieval functionality"]),
        ...(testResults.tests.get_recipients.success ? [] : ["🔧 Fix waitlist integration"]),
        ...(testResults.cleanup_performed ? [] : ["🧹 Manual cleanup may be needed"]),
        ...(testResults.overall_success ? ["✅ System ready for production use"] : []),
      ],
    })
  } catch (error) {
    // Emergency cleanup if something went wrong
    if (testCampaignId) {
      try {
        await deleteCampaign(testCampaignId)
        testResults.cleanup_performed = true
      } catch (cleanupError) {
        console.error("Failed to cleanup test campaign:", cleanupError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ...testResults,
        emergency_cleanup_attempted: !!testCampaignId,
      },
      { status: 500 },
    )
  }
}
