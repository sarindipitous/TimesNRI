import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== DEBUGGING WAITLIST ===")

    // First, let's see what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log("Available tables:", tables)

    // Check the structure of waitlist_submissions table
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'waitlist_submissions'
      ORDER BY ordinal_position
    `
    console.log("Waitlist table columns:", columns)

    // Get total count
    const countResult = await sql`SELECT COUNT(*) as total FROM waitlist_submissions`
    console.log("Total submissions in DB:", countResult[0])

    // Get all data with no limits
    const allData = await sql`
      SELECT * FROM waitlist_submissions 
      ORDER BY created_at DESC
    `
    console.log("All submissions:", allData)

    // Try the query from lib/db.ts
    const libQuery = await sql`
      SELECT 
        ws.*,
        ref_ws.email as referred_by
      FROM waitlist_submissions ws
      LEFT JOIN referral_details rd ON ws.id = rd.referred_id
      LEFT JOIN waitlist_submissions ref_ws ON rd.referrer_id = ref_ws.id
      ORDER BY ws.created_at DESC
    `
    console.log("Lib query result:", libQuery)

    return NextResponse.json({
      success: true,
      debug: {
        tables,
        columns,
        totalCount: countResult[0],
        allData,
        libQueryResult: libQuery,
        dataLength: allData.length,
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    })
  }
}
