import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("Waitlist API: Starting fetch...")

    // Get all waitlist submissions
    const result = await sql`
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
    `

    const submissions = result.map((row) => ({
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

    console.log(`Waitlist API: Found ${submissions.length} submissions`)

    return NextResponse.json({
      success: true,
      submissions,
      count: submissions.length,
    })
  } catch (error) {
    console.error("Waitlist API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        submissions: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, source, location, parent_location, care_needs, care_plan, care_plan_interest, referred_by } =
      body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Get next waitlist number
    const countResult = await sql`SELECT COUNT(*) as count FROM waitlist_submissions`
    const waitlist_number = Number(countResult[0]?.count || 0) + 1

    // Insert new submission
    const result = await sql`
      INSERT INTO waitlist_submissions (
        email, name, source, location, parent_location, care_needs, 
        care_plan, care_plan_interest, waitlist_number, referred_by, created_at
      ) VALUES (
        ${email}, ${name}, ${source}, ${location}, ${parent_location}, 
        ${care_needs}, ${care_plan}, ${care_plan_interest}, ${waitlist_number}, 
        ${referred_by}, ${new Date().toISOString()}
      ) RETURNING *
    `

    return NextResponse.json({
      success: true,
      submission: result[0],
      waitlist_number,
    })
  } catch (error) {
    console.error("Waitlist POST Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
