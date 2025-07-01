import { type NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!hasDb) {
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

    // Simple, direct query - no fancy stuff
    const submissions = await sql`
      SELECT * FROM waitlist_submissions 
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Simple stats query
    const statsResult = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_week
      FROM waitlist_submissions
    `

    const stats = {
      total: Number(statsResult[0]?.total || 0),
      lastWeek: Number(statsResult[0]?.last_week || 0),
    }

    return NextResponse.json({
      success: true,
      submissions,
      stats,
      total: submissions.length,
    })
  } catch (error) {
    console.error("Error fetching waitlist:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch waitlist data",
      submissions: [],
      stats: { total: 0, lastWeek: 0 },
    })
  }
}

export async function POST(request: NextRequest) {
  if (!hasDb) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { email, name, source, location, parent_location, care_needs, care_plan, care_plan_interest } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO waitlist_submissions (
        email, source, name, location, parent_location, care_needs, care_plan, care_plan_interest
      ) 
      VALUES (
        ${email}, ${source || null}, ${name || null}, ${location || null}, 
        ${parent_location || null}, ${care_needs || null}, ${care_plan || null}, ${care_plan_interest || null}
      )
      ON CONFLICT (email) DO UPDATE SET
        source = COALESCE(EXCLUDED.source, waitlist_submissions.source),
        name = COALESCE(EXCLUDED.name, waitlist_submissions.name),
        location = COALESCE(EXCLUDED.location, waitlist_submissions.location),
        parent_location = COALESCE(EXCLUDED.parent_location, waitlist_submissions.parent_location),
        care_needs = COALESCE(EXCLUDED.care_needs, waitlist_submissions.care_needs),
        care_plan = COALESCE(EXCLUDED.care_plan, waitlist_submissions.care_plan),
        care_plan_interest = COALESCE(EXCLUDED.care_plan_interest, waitlist_submissions.care_plan_interest)
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      submission: result[0],
      message: "Successfully added to waitlist",
    })
  } catch (error) {
    console.error("Error adding to waitlist:", error)
    return NextResponse.json({ success: false, error: "Failed to add to waitlist" }, { status: 500 })
  }
}
