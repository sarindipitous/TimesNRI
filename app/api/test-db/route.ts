import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Test basic connection
    const connectionTest = await sql`SELECT NOW() as time`

    // Test table existence
    let tableExists = false
    try {
      const tableTest = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'waitlist_submissions'
        ) as exists
      `
      tableExists = tableTest[0]?.exists
    } catch (tableError) {
      console.error("Table check error:", tableError)
    }

    // Test insert capability with a dummy record that will be deleted
    let insertWorks = false
    let testId = null
    try {
      if (tableExists) {
        const insertTest = await sql`
          INSERT INTO waitlist_submissions (email, source) 
          VALUES ('test-delete-me@example.com', 'db-test') 
          RETURNING id
        `
        testId = insertTest[0]?.id
        insertWorks = testId != null

        // Clean up test record
        if (testId) {
          await sql`DELETE FROM waitlist_submissions WHERE id = ${testId}`
        }
      }
    } catch (insertError) {
      console.error("Insert test error:", insertError)
    }

    // Get table schema
    let tableSchema = []
    try {
      if (tableExists) {
        tableSchema = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'waitlist_submissions'
          ORDER BY ordinal_position
        `
      }
    } catch (schemaError) {
      console.error("Schema check error:", schemaError)
    }

    return NextResponse.json({
      success: true,
      message: "Database tests completed",
      connection: {
        success: true,
        time: connectionTest[0].time,
      },
      table: {
        exists: tableExists,
        schema: tableSchema,
      },
      insert: {
        works: insertWorks,
      },
      environment: {
        databaseUrl: process.env.DATABASE_URL ? "Set (masked)" : "Not set",
      },
    })
  } catch (error) {
    console.error("Database test failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Database test failed",
        error: error instanceof Error ? error.message : String(error),
        environment: {
          databaseUrl: process.env.DATABASE_URL ? "Set (masked)" : "Not set",
        },
      },
      { status: 500 },
    )
  }
}
