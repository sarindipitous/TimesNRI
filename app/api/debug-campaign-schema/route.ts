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
    const schemaInfo = {
      timestamp: new Date().toISOString(),
      tables: {} as any,
      issues: [] as string[],
      recommendations: [] as string[],
    }

    // Check email_campaigns table
    try {
      const campaignColumns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'email_campaigns'
        ORDER BY ordinal_position
      `

      schemaInfo.tables.email_campaigns = {
        exists: true,
        columns: campaignColumns,
        columnNames: campaignColumns.map((col: any) => col.column_name),
      }

      // Check for required columns
      const requiredColumns = [
        "id",
        "name",
        "subject",
        "from_name",
        "from_email",
        "html_content",
        "status",
        "target_type",
        "total_recipients",
        "sent_count",
        "failed_count",
        "created_at",
        "started_at",
        "completed_at",
      ]

      const missingColumns = requiredColumns.filter(
        (col) => !schemaInfo.tables.email_campaigns.columnNames.includes(col),
      )

      if (missingColumns.length > 0) {
        schemaInfo.issues.push(`Missing columns in email_campaigns: ${missingColumns.join(", ")}`)
        schemaInfo.recommendations.push(`Add missing columns: ${missingColumns.join(", ")}`)
      }

      // Check if updated_at exists (this might be causing the error)
      const hasUpdatedAt = schemaInfo.tables.email_campaigns.columnNames.includes("updated_at")
      if (!hasUpdatedAt) {
        schemaInfo.issues.push("Missing 'updated_at' column - this could cause the SQL error")
        schemaInfo.recommendations.push("Add 'updated_at' column or remove references to it")
      }
    } catch (error) {
      schemaInfo.tables.email_campaigns = {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      schemaInfo.issues.push("email_campaigns table does not exist or is not accessible")
    }

    // Check email_campaign_logs table
    try {
      const logColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'email_campaign_logs'
        ORDER BY ordinal_position
      `

      schemaInfo.tables.email_campaign_logs = {
        exists: true,
        columns: logColumns,
        columnNames: logColumns.map((col: any) => col.column_name),
      }
    } catch (error) {
      schemaInfo.tables.email_campaign_logs = {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      schemaInfo.issues.push("email_campaign_logs table does not exist or is not accessible")
    }

    // Test a simple update query to see what happens
    try {
      const testResult = await sql`
        SELECT 1 as test
      `
      schemaInfo.databaseConnection = "OK"
    } catch (error) {
      schemaInfo.databaseConnection = "FAILED"
      schemaInfo.issues.push(`Database connection issue: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    return NextResponse.json({
      success: true,
      schemaInfo,
      summary: {
        totalIssues: schemaInfo.issues.length,
        criticalIssues: schemaInfo.issues.filter(
          (issue) => issue.includes("updated_at") || issue.includes("does not exist"),
        ).length,
        status: schemaInfo.issues.length === 0 ? "HEALTHY" : "ISSUES_FOUND",
      },
    })
  } catch (error) {
    console.error("Schema debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to debug schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
