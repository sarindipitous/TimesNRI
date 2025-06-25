import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    // Get all blog posts with missing or empty slugs
    const postsWithoutSlugs = await sql`
      SELECT id, title, slug 
      FROM blog_posts 
      WHERE slug IS NULL OR slug = '' OR LENGTH(TRIM(slug)) = 0
    `

    console.log(`Found ${postsWithoutSlugs.length} posts without proper slugs`)

    // Fix each post
    for (const post of postsWithoutSlugs) {
      const slug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
        .substring(0, 100) // Limit length

      await sql`
        UPDATE blog_posts 
        SET slug = ${slug}
        WHERE id = ${post.id}
      `

      console.log(`Updated post ${post.id}: "${post.title}" -> slug: "${slug}"`)
    }

    // Get all posts to verify
    const allPosts = await sql`
      SELECT id, title, slug, status 
      FROM blog_posts 
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      message: `Fixed ${postsWithoutSlugs.length} blog post slugs`,
      posts: allPosts,
    })
  } catch (error) {
    console.error("Fix blog slugs error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
