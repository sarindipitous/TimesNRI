import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    // Get all posts without proper slugs
    const postsWithoutSlugs = await sql`
      SELECT id, title, slug
      FROM blog_posts
      WHERE slug IS NULL OR slug = '' OR slug = 'undefined'
    `

    const fixed = []

    for (const post of postsWithoutSlugs) {
      // Generate slug from title
      const slug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100)

      if (slug) {
        // Make sure slug is unique
        let uniqueSlug = slug
        let counter = 1

        while (true) {
          const existing = await sql`
            SELECT id FROM blog_posts 
            WHERE slug = ${uniqueSlug} AND id != ${post.id}
            LIMIT 1
          `
          if (existing.length === 0) break
          uniqueSlug = `${slug}-${counter}`
          counter++
        }

        // Update the post
        await sql`
          UPDATE blog_posts 
          SET slug = ${uniqueSlug}, updated_at = NOW()
          WHERE id = ${post.id}
        `

        fixed.push({
          id: post.id,
          title: post.title,
          oldSlug: post.slug,
          newSlug: uniqueSlug,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed.length} blog post slugs`,
      fixed: fixed,
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
