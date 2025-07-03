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
    console.log("🔧 Fixing email_campaigns schema...")

    // Step 1: Check current schema
    const currentSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'email_campaigns'
      ORDER BY ordinal_position
    `

    console.log("Current schema:", currentSchema)

    // Step 2: Add updated_at column if missing
    const hasUpdatedAt = currentSchema.some((col: any) => col.column_name === "updated_at")

    if (!hasUpdatedAt) {
      console.log("Adding updated_at column...")
      await sql`
        ALTER TABLE email_campaigns 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `

      // Update existing records
      await sql`
        UPDATE email_campaigns 
        SET updated_at = created_at 
        WHERE updated_at IS NULL
      `

      console.log("✅ Added updated_at column")
    } else {
      console.log("✅ updated_at column already exists")
    }

    // Step 3: Create trigger function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `

    // Step 4: Create trigger
    await sql`DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns`
    await sql`
      CREATE TRIGGER update_email_campaigns_updated_at
          BEFORE UPDATE ON email_campaigns
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `

    console.log("✅ Created updated_at trigger")

    // Step 5: Verify final schema
    const finalSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'email_campaigns'
      ORDER BY ordinal_position
    `

    // Step 6: Test the fix with a sample update
    const testCampaigns = await sql`
      SELECT id FROM email_campaigns LIMIT 1
    `

    let testResult = null
    if (testCampaigns.length > 0) {
      const testId = testCampaigns[0].id
      console.log(`Testing update on campaign ${testId}...`)

      await sql`
        UPDATE email_campaigns 
        SET name = name || ' (schema test)'
        WHERE id = ${testId}
      `

      const updatedCampaign = await sql`
        SELECT id, name, created_at, updated_at 
        FROM email_campaigns 
        WHERE id = ${testId}
      `

      testResult = updatedCampaign[0]

      // Revert the test change
      await sql`
        UPDATE email_campaigns 
        SET name = REPLACE(name, ' (schema test)', '')
        WHERE id = ${testId}
      `
    }

    return NextResponse.json({
      success: true,
      message: "Email campaigns schema fixed successfully",
      details: {
        hadUpdatedAtColumn: hasUpdatedAt,
        currentColumns: currentSchema.length,
        finalSchema: finalSchema.map((col: any) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable,
          default: col.column_default,
        })),
        testResult,
      },
    })
  } catch (error) {
    console.error("Schema fix error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
