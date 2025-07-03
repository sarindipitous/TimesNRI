import { NextResponse } from "next/server"
import { getCampaignById, updateCampaign, createCampaign } from "@/lib/email-campaigns-fixed"

export const dynamic = "force-dynamic"

export async function GET() {
  const results = []
  let allPassed = true

  try {
    // Test 1: Create a test campaign
    results.push("🧪 Testing campaign edit functionality...")

    const testCampaign = await createCampaign({
      name: "QA Test Campaign - Edit Test",
      subject: "QA Test Subject",
      from_name: "QA Test",
      from_email: "qa@timesnri.com",
      html_content: "<h1>Original Content</h1><p>This is the original content.</p>",
      target_type: "all",
    })

    if (!testCampaign) {
      results.push("❌ Failed to create test campaign")
      allPassed = false
      return NextResponse.json({ success: false, results })
    }

    results.push(`✅ Test campaign created with ID: ${testCampaign.id}`)

    // Test 2: Fetch the campaign
    const fetchedCampaign = await getCampaignById(testCampaign.id)
    if (!fetchedCampaign) {
      results.push("❌ Failed to fetch created campaign")
      allPassed = false
    } else {
      results.push("✅ Campaign fetched successfully")
    }

    // Test 3: Update the campaign
    const updatedCampaign = await updateCampaign(testCampaign.id, {
      name: "QA Test Campaign - UPDATED",
      subject: "QA Test Subject - UPDATED",
      html_content: "<h1>Updated Content</h1><p>This content has been updated.</p>",
    })

    if (!updatedCampaign) {
      results.push("❌ Failed to update campaign")
      allPassed = false
    } else {
      results.push("✅ Campaign updated successfully")

      // Verify the updates
      if (updatedCampaign.name === "QA Test Campaign - UPDATED") {
        results.push("✅ Campaign name updated correctly")
      } else {
        results.push("❌ Campaign name not updated correctly")
        allPassed = false
      }

      if (updatedCampaign.subject === "QA Test Subject - UPDATED") {
        results.push("✅ Campaign subject updated correctly")
      } else {
        results.push("❌ Campaign subject not updated correctly")
        allPassed = false
      }
    }

    // Test 4: Test API endpoints
    const apiTests = []

    // Test GET endpoint
    try {
      const getResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/campaigns/${testCampaign.id}`)
      if (getResponse.ok) {
        apiTests.push("✅ GET /api/campaigns/[id] endpoint working")
      } else {
        apiTests.push("❌ GET /api/campaigns/[id] endpoint failed")
        allPassed = false
      }
    } catch (error) {
      apiTests.push("❌ GET /api/campaigns/[id] endpoint error")
      allPassed = false
    }

    results.push(...apiTests)

    // Test 5: Clean up - delete test campaign
    try {
      const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/campaigns/${testCampaign.id}`, {
        method: "DELETE",
      })
      if (deleteResponse.ok) {
        results.push("✅ Test campaign cleaned up successfully")
      } else {
        results.push("⚠️ Failed to clean up test campaign")
      }
    } catch (error) {
      results.push("⚠️ Error cleaning up test campaign")
    }

    results.push("")
    results.push(
      allPassed
        ? "🎉 ALL TESTS PASSED - Campaign editing is working!"
        : "❌ SOME TESTS FAILED - Check the issues above",
    )

    return NextResponse.json({
      success: allPassed,
      results,
      summary: {
        total_tests: 5,
        passed: allPassed,
        message: allPassed
          ? "Campaign edit functionality is working correctly"
          : "Campaign edit functionality has issues",
      },
    })
  } catch (error) {
    results.push(`❌ Critical error during testing: ${error instanceof Error ? error.message : "Unknown error"}`)

    return NextResponse.json({
      success: false,
      results,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
