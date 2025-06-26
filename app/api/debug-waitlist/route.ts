import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export async function GET() {
  if (!hasDb) {
    return NextResponse.json({
      error: "Database not configured",
      hasDb: false,
    })
  }

  try {
    // Get table structure first
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'waitlist_submissions' 
      ORDER BY ordinal_position
    `

    // Get total count
    const countResult = await sql`SELECT COUNT(*) as total FROM waitlist_submissions`
    const totalCount = Number(countResult[0].total)

    // Get all submissions with all fields
    const submissions = await sql`
      SELECT * FROM waitlist_submissions 
      ORDER BY created_at DESC
    `

    // Get sample of first few records with all details
    const sampleSubmissions = submissions.slice(0, 5)

    return NextResponse.json({
      success: true,
      hasDb,
      tableStructure: tableInfo,
      totalCount,
      sampleCount: sampleSubmissions.length,
      allSubmissionsCount: submissions.length,
      sampleSubmissions,
      allFieldsFromFirstRecord: submissions[0] || null,
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      hasDb,
    })
  }
}
