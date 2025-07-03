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
    console.log("🔍 Debugging campaign update issue...")

    // Step 1: Check if email_campaigns table exists
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
        action: "create_table_needed",
      })
    }

    // Step 2: Get all columns in the table
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'email_campaigns'
      ORDER BY ordinal_position
    `

    // Step 3: Check for updated_at column specifically
    const hasUpdatedAt = columns.some((col: any) => col.column_name === "updated_at")

    // Step 4: Get sample campaign data
    const campaigns = await sql`
      SELECT id, name, status, created_at 
      FROM email_campaigns 
      LIMIT 3
    `

    // Step 5: Test a simple update query
    let updateTestResult = null
    try {
      if (campaigns.length > 0) {
        const testCampaignId = campaigns[0].id
        await sql`
          UPDATE email_campaigns 
          SET status = status
          WHERE id = ${testCampaignId}
        `
        updateTestResult = "✅ Basic update works"
      }
    } catch (error) {
      updateTestResult = `❌ Basic update failed: ${error instanceof Error ? error.message : "Unknown error"}`
    }

    // Step 6: Test updated_at specific update
    let updatedAtTestResult = null
    try {
      if (campaigns.length > 0 && hasUpdatedAt) {
        const testCampaignId = campaigns[0].id
        await sql`
          UPDATE email_campaigns 
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ${testCampaignId}
        `
        updatedAtTestResult = "✅ updated_at update works"
      } else if (!hasUpdatedAt) {
        updatedAtTestResult = "❌ updated_at column does not exist"
      }
    } catch (error) {
      updatedAtTestResult = `❌ updated_at update failed: ${error instanceof Error ? error.message : "Unknown error"}`
    }

    return NextResponse.json({
      success: true,
      debug: {
        tableExists: tableExists[0].exists,
        hasUpdatedAtColumn: hasUpdatedAt,
        totalColumns: columns.length,
        columns: columns.map((col: any) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable,
          default: col.column_default,
        })),
        sampleCampaigns: campaigns,
        updateTestResult,
        updatedAtTestResult,
      },
    })
  } catch (error) {
    console.error("❌ Error debugging campaign update:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
