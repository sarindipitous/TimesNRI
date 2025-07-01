import { type NextRequest, NextResponse } from "next/server"
import { submitToWaitlist } from "@/app/actions/waitlist"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("=== REFERRAL TEST API ===")

  try {
    const body = await request.json()
    const { referrerEmail, referredEmail, referredName } = body

    console.log("🧪 Testing referral flow:", {
      referrerEmail,
      referredEmail,
      referredName,
    })

    // Step 1: Create referrer if they don't exist
    console.log("👤 Step 1: Creating referrer...")
    const referrerFormData = new FormData()
    referrerFormData.append("email", referrerEmail)
    referrerFormData.append("name", "Test Referrer")
    referrerFormData.append("source", "test-referrer")

    const referrerResult = await submitToWaitlist(referrerFormData)
    console.log("👤 Referrer result:", referrerResult)

    if (!referrerResult.success) {
      return NextResponse.json({
        success: false,
        error: "Failed to create referrer",
        details: referrerResult,
      })
    }

    // Step 2: Create referred user with referral
    console.log("🔗 Step 2: Creating referred user...")
    const referredFormData = new FormData()
    referredFormData.append("email", referredEmail)
    referredFormData.append("name", referredName)
    referredFormData.append("source", "test-referred")
    referredFormData.append("referredBy", referrerEmail)

    const referredResult = await submitToWaitlist(referredFormData)
    console.log("🔗 Referred result:", referredResult)

    if (!referredResult.success) {
      return NextResponse.json({
        success: false,
        error: "Failed to create referred user",
        details: referredResult,
      })
    }

    // Step 3: Verify the referral was recorded
    console.log("✅ Step 3: Verifying referral...")
    const { sql } = await import("@/lib/db")

    const verificationResult = await sql`
      SELECT 
        ws.id,
        ws.email,
        ws.name,
        ws.referred_by,
        r.id as referral_id,
        rd.id as referral_detail_id
      FROM waitlist_submissions ws
      LEFT JOIN referrals r ON r.referred_email = ws.email
      LEFT JOIN referral_details rd ON rd.referred_email = ws.email
      WHERE ws.email = ${referredEmail}
    `

    console.log("✅ Verification result:", verificationResult[0])

    return NextResponse.json({
      success: true,
      message: "Referral test completed successfully",
      results: {
        referrer: referrerResult,
        referred: referredResult,
        verification: verificationResult[0],
      },
    })
  } catch (error) {
    console.error("❌ Referral test error:", error)
    return NextResponse.json({
      success: false,
      error: "Referral test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export async function GET() {
  console.log("=== REFERRAL TEST GET ===")

  try {
    const { sql } = await import("@/lib/db")

    // Get referral statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE referred_by IS NOT NULL) as referred_submissions,
        COUNT(DISTINCT referred_by) FILTER (WHERE referred_by IS NOT NULL) as unique_referrers
      FROM waitlist_submissions
    `

    // Get sample referrals
    const sampleReferrals = await sql`
      SELECT 
        ws.email,
        ws.name,
        ws.referred_by,
        ws.created_at
      FROM waitlist_submissions ws
      WHERE ws.referred_by IS NOT NULL
      ORDER BY ws.created_at DESC
      LIMIT 5
    `

    // Get referral tables info
    const referralsCount = await sql`SELECT COUNT(*) as count FROM referrals`
    const referralDetailsCount = await sql`SELECT COUNT(*) as count FROM referral_details`

    return NextResponse.json({
      success: true,
      stats: stats[0],
      sampleReferrals,
      tableStats: {
        referrals: referralsCount[0].count,
        referralDetails: referralDetailsCount[0].count,
      },
    })
  } catch (error) {
    console.error("❌ Referral test GET error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
