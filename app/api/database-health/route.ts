"use server"

import { sql, hasDb } from "@/lib/db"
import { NextResponse } from "next/server"

interface TableCheck {
  table_name: string
  exists: boolean
  columns?: string[]
  missing_columns?: string[]
}

interface HealthCheckResult {
  success: boolean
  tables: TableCheck[]
  missing_tables: string[]
  needs_setup: boolean
  setup_scripts: string[]
  error?: string
}

export async function GET() {
  try {
    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error: "DATABASE_URL is not set for this environment.",
        needs_setup: true,
      })
    }

    const requiredTables = {
      waitlist_submissions: [
        "id",
        "email",
        "name",
        "source",
        "location",
        "parent_location",
        "care_needs",
        "care_plan",
        "care_plan_interest",
        "waitlist_number",
        "created_at",
      ],
      referrals: ["id", "referrer_id", "referred_email", "status", "created_at"],
      referral_details: ["id", "referrer_id", "referred_email", "referred_id", "created_at"],
      blog_posts: [
        "id",
        "title",
        "slug",
        "content",
        "excerpt",
        "author",
        "status",
        "featured",
        "display_order",
        "created_at",
        "updated_at",
      ],
      email_config: ["id", "config_key", "config_value", "is_enabled", "created_at", "updated_at"],
    }

    const healthCheck: HealthCheckResult = {
      success: true,
      tables: [],
      missing_tables: [],
      needs_setup: false,
      setup_scripts: [],
    }

    // Check each required table
    for (const [tableName, requiredColumns] of Object.entries(requiredTables)) {
      try {
        // Check if table exists
        const [{ table_exists }] = await sql<{ table_exists: boolean }[]>`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = ${tableName}
          ) AS table_exists
        `

        if (!table_exists) {
          healthCheck.missing_tables.push(tableName)
          healthCheck.needs_setup = true

          // Add appropriate setup script
          switch (tableName) {
            case "waitlist_submissions":
            case "referrals":
            case "referral_details":
              if (!healthCheck.setup_scripts.includes("scripts/ensure-database-schema.sql")) {
                healthCheck.setup_scripts.push("scripts/ensure-database-schema.sql")
              }
              break
            case "blog_posts":
              healthCheck.setup_scripts.push("scripts/setup-blog-db.sql")
              break
            case "email_config":
              healthCheck.setup_scripts.push("scripts/add-email-config.sql")
              break
          }

          healthCheck.tables.push({
            table_name: tableName,
            exists: false,
            missing_columns: requiredColumns,
          })
          continue
        }

        // Check columns for existing table
        const existingColumns = await sql`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${tableName}
        `

        const existingColumnNames = existingColumns.map((col: any) => col.column_name)
        const missingColumns = requiredColumns.filter((col) => !existingColumnNames.includes(col))

        if (missingColumns.length > 0) {
          healthCheck.needs_setup = true

          // Add appropriate update script
          if (tableName === "waitlist_submissions" && missingColumns.includes("care_plan_interest")) {
            healthCheck.setup_scripts.push("scripts/add-care-plan-interest-field.sql")
          }
          if (
            tableName === "blog_posts" &&
            (missingColumns.includes("featured") || missingColumns.includes("display_order"))
          ) {
            healthCheck.setup_scripts.push("scripts/add-blog-featured-and-order.sql")
          }
        }

        healthCheck.tables.push({
          table_name: tableName,
          exists: true,
          columns: existingColumnNames,
          missing_columns: missingColumns.length > 0 ? missingColumns : undefined,
        })
      } catch (error) {
        console.error(`Error checking table ${tableName}:`, error)
        healthCheck.tables.push({
          table_name: tableName,
          exists: false,
          missing_columns: requiredColumns,
        })
        healthCheck.needs_setup = true
      }
    }

    // Remove duplicate scripts
    healthCheck.setup_scripts = [...new Set(healthCheck.setup_scripts)]

    return NextResponse.json(healthCheck)
  } catch (err) {
    console.error("Database health check failed:", err)
    const message = err instanceof Error ? err.message : String(err)

    return NextResponse.json({
      success: false,
      error: message,
      needs_setup: true,
      setup_scripts: [
        "scripts/ensure-database-schema.sql",
        "scripts/add-care-plan-interest-field.sql",
        "scripts/add-blog-featured-and-order.sql",
        "scripts/add-email-config.sql",
      ],
    })
  }
}
