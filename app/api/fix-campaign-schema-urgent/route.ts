import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not available - DATABASE_URL not configured",
    })
  }

  try {
    console.log("🚨 URGENT: Fixing missing updated_at column...")

    // Step 1: Check if updated_at column exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'email_campaigns' AND column_name = 'updated_at'
    `

    if (columnCheck.length === 0) {
      console.log("❌ updated_at column is missing - adding it now...")

      // Add the missing column
      await sql`
        ALTER TABLE email_campaigns 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `

      console.log("✅ Added updated_at column")

      // Update existing records to have updated_at value
      const updateResult = await sql`
        UPDATE email_campaigns 
        SET updated_at = created_at 
        WHERE updated_at IS NULL
      `

      console.log(`✅ Updated ${updateResult.count} existing records`)

      return NextResponse.json({
        success: true,
        message: "Fixed missing updated_at column",
        details: {
          columnAdded: true,
          recordsUpdated: updateResult.count,
        },
      })
    } else {
      console.log("✅ updated_at column already exists")
      return NextResponse.json({
        success: true,
        message: "updated_at column already exists - no fix needed",
        details: {
          columnAdded: false,
          recordsUpdated: 0,
        },
      })
    }
  } catch (error) {
    console.error("❌ Error fixing schema:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fix campaign schema",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
