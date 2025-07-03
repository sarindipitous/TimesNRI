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
    console.log("🔧 Fixing email_campaigns table structure...")

    // Step 1: Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'email_campaigns'
      ) AS table_exists
    `

    if (!tableCheck[0].table_exists) {
      console.log("❌ email_campaigns table doesn't exist - creating it...")

      // Create the complete table with all required columns
      await sql`
        CREATE TABLE email_campaigns (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          subject VARCHAR(500) NOT NULL,
          from_name VARCHAR(255) NOT NULL,
          from_email VARCHAR(255) NOT NULL,
          html_content TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'draft',
          target_type VARCHAR(50) DEFAULT 'all',
          target_criteria JSONB DEFAULT '{}',
          selected_recipients JSONB DEFAULT '[]',
          total_recipients INTEGER DEFAULT 0,
          sent_count INTEGER DEFAULT 0,
          failed_count INTEGER DEFAULT 0,
          scheduled_at TIMESTAMP,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      console.log("✅ Created email_campaigns table with all columns")

      return NextResponse.json({
        success: true,
        message: "Created email_campaigns table with all required columns",
        action: "table_created",
      })
    }

    // Step 2: Check for missing columns and add them
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'email_campaigns'
    `

    const existingColumns = columns.map((col: any) => col.column_name)
    const requiredColumns = [
      "id",
      "name",
      "subject",
      "from_name",
      "from_email",
      "html_content",
      "status",
      "target_type",
      "target_criteria",
      "selected_recipients",
      "total_recipients",
      "sent_count",
      "failed_count",
      "scheduled_at",
      "started_at",
      "completed_at",
      "created_at",
      "updated_at",
    ]

    const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col))

    if (missingColumns.length > 0) {
      console.log(`❌ Missing columns: ${missingColumns.join(", ")}`)

      // Add missing columns one by one
      for (const column of missingColumns) {
        switch (column) {
          case "updated_at":
            await sql`ALTER TABLE email_campaigns ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
            break
          case "target_criteria":
            await sql`ALTER TABLE email_campaigns ADD COLUMN target_criteria JSONB DEFAULT '{}'`
            break
          case "selected_recipients":
            await sql`ALTER TABLE email_campaigns ADD COLUMN selected_recipients JSONB DEFAULT '[]'`
            break
          case "total_recipients":
            await sql`ALTER TABLE email_campaigns ADD COLUMN total_recipients INTEGER DEFAULT 0`
            break
          case "sent_count":
            await sql`ALTER TABLE email_campaigns ADD COLUMN sent_count INTEGER DEFAULT 0`
            break
          case "failed_count":
            await sql`ALTER TABLE email_campaigns ADD COLUMN failed_count INTEGER DEFAULT 0`
            break
          case "scheduled_at":
            await sql`ALTER TABLE email_campaigns ADD COLUMN scheduled_at TIMESTAMP`
            break
          case "started_at":
            await sql`ALTER TABLE email_campaigns ADD COLUMN started_at TIMESTAMP`
            break
          case "completed_at":
            await sql`ALTER TABLE email_campaigns ADD COLUMN completed_at TIMESTAMP`
            break
          case "status":
            await sql`ALTER TABLE email_campaigns ADD COLUMN status VARCHAR(50) DEFAULT 'draft'`
            break
          case "target_type":
            await sql`ALTER TABLE email_campaigns ADD COLUMN target_type VARCHAR(50) DEFAULT 'all'`
            break
        }
        console.log(`✅ Added column: ${column}`)
      }

      // Update existing records to have proper updated_at values
      await sql`
        UPDATE email_campaigns 
        SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
        WHERE updated_at IS NULL
      `

      return NextResponse.json({
        success: true,
        message: `Added missing columns: ${missingColumns.join(", ")}`,
        action: "columns_added",
        addedColumns: missingColumns,
      })
    }

    console.log("✅ All required columns exist")
    return NextResponse.json({
      success: true,
      message: "email_campaigns table structure is correct",
      action: "no_changes_needed",
      existingColumns,
    })
  } catch (error) {
    console.error("❌ Error fixing campaign table:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
