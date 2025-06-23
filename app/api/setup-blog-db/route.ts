import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({
        success: false,
        message: "DATABASE_URL is not set. Please configure your database connection.",
      })
    }

    // Create blog_posts table
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        author VARCHAR(100) NOT NULL DEFAULT 'TimesNRI Team',
        featured_image VARCHAR(500),
        tags TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)`
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at)`

    return NextResponse.json({
      success: true,
      message: "Blog database setup completed successfully",
    })
  } catch (error) {
    console.error("Blog database setup error:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to setup blog database",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
