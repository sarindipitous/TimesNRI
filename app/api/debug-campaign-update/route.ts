import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not available",
    })
  }

  try {
    // Check if email_campaigns table exists and its structure
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'email_campaigns'
      ) AS table_exists
    `

    if (!tableExists[0].table_exists) {
      return NextResponse.json({
        success: false,
        error: "email_campaigns table does not exist",
      })
    }

    // Get all columns in the email_campaigns table
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'email_campaigns'
      ORDER BY ordinal_position
    `

    // Check if updated_at column exists
    const hasUpdatedAt = columns.some((col: any) => col.column_name === "updated_at")

    // Get sample campaign data
    const campaigns = await sql`
      SELECT id, name, status, created_at 
      FROM email_campaigns 
      ORDER BY id DESC 
      LIMIT 3
    `

    return NextResponse.json({
      success: true,
      tableExists: true,
      hasUpdatedAtColumn: hasUpdatedAt,
      columns: columns.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable,
        default: col.column_default,
      })),
      sampleCampaigns: campaigns,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug campaign update error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
