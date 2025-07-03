import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not available",
    })
  }

  try {
    console.log("🔧 Adding updated_at column to email_campaigns table...")

    // Check if the table exists first
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'email_campaigns'
      ) AS exists
    `

    if (!tableExists[0].exists) {
      return NextResponse.json({
        success: false,
        error: "email_campaigns table does not exist",
      })
    }

    // Check if updated_at column already exists
    const columnExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'email_campaigns' 
        AND column_name = 'updated_at'
      ) AS exists
    `

    if (columnExists[0].exists) {
      return NextResponse.json({
        success: true,
        message: "updated_at column already exists",
        action: "no_change_needed",
      })
    }

    // Add the updated_at column
    await sql`
      ALTER TABLE email_campaigns 
      ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    `

    // Update existing records to have updated_at = created_at
    const updateResult = await sql`
      UPDATE email_campaigns 
      SET updated_at = created_at 
      WHERE updated_at IS NULL
    `

    console.log(`✅ Added updated_at column and updated ${updateResult.count} existing records`)

    // Verify the column was added
    const verification = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'email_campaigns' 
      AND column_name = 'updated_at'
    `

    return NextResponse.json({
      success: true,
      message: "Successfully added updated_at column to email_campaigns table",
      action: "column_added",
      updatedRecords: updateResult.count,
      columnInfo: verification[0],
    })
  } catch (error) {
    console.error("❌ Error adding updated_at column:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
