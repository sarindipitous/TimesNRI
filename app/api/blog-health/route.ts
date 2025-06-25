import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({
        success: false,
        message: "DATABASE_URL is not set",
        checks: {
          databaseUrl: false,
          tableExists: false,
          canQuery: false,
        },
      })
    }

    const checks = {
      databaseUrl: true,
      tableExists: false,
      canQuery: false,
      sampleData: null as any,
    }

    try {
      // Check if blog_posts table exists
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'blog_posts'
        );
      `
      checks.tableExists = tableCheck[0]?.exists || false

      if (checks.tableExists) {
        // Try to query the table
        const sampleQuery = await sql`
          SELECT id, title, status, created_at 
          FROM blog_posts 
          ORDER BY created_at DESC 
          LIMIT 3
        `
        checks.canQuery = true
        checks.sampleData = sampleQuery

        // Get table info
        const tableInfo = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'blog_posts'
          ORDER BY ordinal_position
        `

        return NextResponse.json({
          success: true,
          message: "Blog database is healthy",
          checks,
          tableInfo,
          recordCount: sampleQuery.length,
        })
      } else {
        return NextResponse.json({
          success: false,
          message: "blog_posts table does not exist. Run the setup first.",
          checks,
        })
      }
    } catch (queryError) {
      console.error("Database query error:", queryError)
      return NextResponse.json({
        success: false,
        message: "Database connection failed",
        checks,
        error: queryError instanceof Error ? queryError.message : "Unknown query error",
      })
    }
  } catch (error) {
    console.error("Blog health check error:", error)
    return NextResponse.json({
      success: false,
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
