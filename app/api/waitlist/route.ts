import { type NextRequest, NextResponse } from "next/server"
import { sql, hasDb, getAllWaitlistSubmissions, getWaitlistStats } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("=== WAITLIST API GET REQUEST ===")

  if (!hasDb) {
    console.log("❌ Database not configured")
    return NextResponse.json({
      success: false,
      error: "Database not configured",
      submissions: [],
      stats: { total: 0, lastWeek: 0 },
    })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "1000")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log(`📊 Fetching submissions with limit: ${limit}, offset: ${offset}`)

    // Get submissions
    const submissions = await getAllWaitlistSubmissions(limit, offset)
    console.log(`✅ Retrieved ${submissions.length} submissions`)

    // Get stats
    const stats = await getWaitlistStats()
    console.log(`✅ Retrieved stats:`, stats)

    // Calculate referral stats
    const referralSubmissions = submissions.filter((sub) => sub.referred_by)
    const uniqueReferrers = new Set(referralSubmissions.map((sub) => sub.referred_by)).size

    console.log(`📊 Referral stats: ${referralSubmissions.length} referrals from ${uniqueReferrers} unique referrers`)

    const response = {
      success: true,
      submissions,
      stats: {
        ...stats,
        totalReferrals: referralSubmissions.length,
        uniqueReferrers,
      },
      total: submissions.length,
    }

    console.log("=== WAITLIST API SUCCESS ===")
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error fetching waitlist:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch waitlist data",
      submissions: [],
      stats: { total: 0, lastWeek: 0, totalReferrals: 0, uniqueReferrers: 0 },
    })
  }
}

export async function POST(request: NextRequest) {
  console.log("=== WAITLIST API POST REQUEST ===")

  if (!hasDb) {
    console.log("❌ Database not configured")
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { email, name, source, location, parent_location, care_needs, care_plan, care_plan_interest, referred_by } =
      body

    console.log("📝 POST request body:", {
      email,
      name,
      source,
      location,
      parent_location,
      care_needs,
      care_plan: care_plan ? care_plan.substring(0, 20) + "..." : undefined,
      care_plan_interest: care_plan_interest ? care_plan_interest.substring(0, 20) + "..." : undefined,
      referred_by,
    })

    if (!email) {
      console.log("❌ Email is required")
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO waitlist_submissions (
        email, source, name, location, parent_location, care_needs, care_plan, care_plan_interest, referred_by
      ) 
      VALUES (
        ${email}, ${source || null}, ${name || null}, ${location || null}, 
        ${parent_location || null}, ${care_needs || null}, ${care_plan || null}, 
        ${care_plan_interest || null}, ${referred_by || null}
      )
      ON CONFLICT (email) DO UPDATE SET
        source = COALESCE(EXCLUDED.source, waitlist_submissions.source),
        name = COALESCE(EXCLUDED.name, waitlist_submissions.name),
        location = COALESCE(EXCLUDED.location, waitlist_submissions.location),
        parent_location = COALESCE(EXCLUDED.parent_location, waitlist_submissions.parent_location),
        care_needs = COALESCE(EXCLUDED.care_needs, waitlist_submissions.care_needs),
        care_plan = COALESCE(EXCLUDED.care_plan, waitlist_submissions.care_plan),
        care_plan_interest = COALESCE(EXCLUDED.care_plan_interest, waitlist_submissions.care_plan_interest),
        referred_by = COALESCE(EXCLUDED.referred_by, waitlist_submissions.referred_by)
      RETURNING *
    `

    console.log("✅ Database insert successful:", {
      id: result[0].id,
      email: result[0].email,
      referred_by: result[0].referred_by,
    })

    console.log("=== WAITLIST API POST SUCCESS ===")
    return NextResponse.json({
      success: true,
      submission: result[0],
      message: "Successfully added to waitlist",
    })
  } catch (error) {
    console.error("❌ Error adding to waitlist:", error)
    return NextResponse.json({ success: false, error: "Failed to add to waitlist" }, { status: 500 })
  }
}
