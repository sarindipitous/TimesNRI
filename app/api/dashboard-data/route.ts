import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("Dashboard API: Starting data fetch...")

    // Test database connection first
    const testResult = await sql`SELECT 1 as test`
    console.log("Database connection test:", testResult)

    // Get total waitlist count
    const totalResult = await sql`
      SELECT COUNT(*) as count 
      FROM waitlist_submissions
    `
    console.log("Total count query result:", totalResult)
    const total = Number.parseInt(totalResult[0]?.count || "0")

    // Get this week's count
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    console.log("Week ago date:", weekAgo.toISOString())

    const thisWeekResult = await sql`
      SELECT COUNT(*) as count 
      FROM waitlist_submissions 
      WHERE created_at >= ${weekAgo.toISOString()}
    `
    console.log("This week query result:", thisWeekResult)
    const thisWeek = Number.parseInt(thisWeekResult[0]?.count || "0")

    // Get count with referrals
    const referralsResult = await sql`
      SELECT COUNT(*) as count 
      FROM waitlist_submissions 
      WHERE referred_by IS NOT NULL AND referred_by != ''
    `
    console.log("Referrals query result:", referralsResult)
    const withReferrals = Number.parseInt(referralsResult[0]?.count || "0")

    // Get recent submissions (last 10)
    const recentResult = await sql`
      SELECT 
        id,
        email,
        name,
        source,
        location,
        parent_location,
        care_needs,
        care_plan,
        care_plan_interest,
        waitlist_number,
        referred_by,
        created_at
      FROM waitlist_submissions 
      ORDER BY created_at DESC 
      LIMIT 10
    `
    console.log("Recent submissions count:", recentResult.length)

    const recentSubmissions = recentResult.map((row) => ({
      id: row.id,
      email: row.email || "",
      name: row.name || null,
      source: row.source || null,
      location: row.location || null,
      parent_location: row.parent_location || null,
      care_needs: row.care_needs || null,
      care_plan: row.care_plan || null,
      care_plan_interest: row.care_plan_interest || null,
      waitlist_number: row.waitlist_number || null,
      referred_by: row.referred_by || null,
      created_at: row.created_at,
    }))

    const response = {
      waitlist: {
        total,
        thisWeek,
        withReferrals,
      },
      recentSubmissions,
    }

    console.log("Dashboard API: Final response", {
      total,
      thisWeek,
      withReferrals,
      recentCount: recentSubmissions.length,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Dashboard API Error:", error)

    // Return error response so we can debug
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        waitlist: {
          total: 0,
          thisWeek: 0,
          withReferrals: 0,
        },
        recentSubmissions: [],
      },
      { status: 500 },
    )
  }
}
