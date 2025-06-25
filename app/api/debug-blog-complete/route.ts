import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog-db"

export async function GET() {
  try {
    console.log("=== COMPLETE BLOG DEBUG ===")

    // 1. Check if database connection works
    const dbTest = await sql`SELECT NOW() as current_time`
    console.log("Database connection:", dbTest[0])

    // 2. Check if blog_posts table exists
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'blog_posts'
    `
    console.log("blog_posts table exists:", tableCheck.length > 0)

    // 3. Get ALL blog posts (raw query)
    const allPosts = await sql`
      SELECT id, title, slug, status, created_at, published_at
      FROM blog_posts 
      ORDER BY created_at DESC
    `
    console.log("All posts in database:", allPosts)

    // 4. Get published posts using our function
    const publishedPosts = await getPublishedBlogPosts()
    console.log("Published posts from function:", publishedPosts)

    // 5. Test slug lookup for each post
    const slugTests = []
    for (const post of allPosts) {
      if (post.slug) {
        const foundPost = await getBlogPostBySlug(post.slug)
        slugTests.push({
          originalSlug: post.slug,
          found: !!foundPost,
          foundTitle: foundPost?.title || null,
        })
      }
    }
    console.log("Slug lookup tests:", slugTests)

    return NextResponse.json({
      success: true,
      debug: {
        databaseConnection: dbTest[0],
        tableExists: tableCheck.length > 0,
        allPosts: allPosts,
        publishedPosts: publishedPosts,
        slugTests: slugTests,
        summary: {
          totalPosts: allPosts.length,
          publishedCount: publishedPosts.length,
          postsWithSlugs: allPosts.filter((p) => p.slug && p.slug.trim() !== "").length,
          postsWithoutSlugs: allPosts.filter((p) => !p.slug || p.slug.trim() === "").length,
        },
      },
    })
  } catch (error) {
    console.error("Complete debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
