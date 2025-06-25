import { NextResponse } from "next/server"
import { getAllBlogPosts, getPublishedBlogPosts, getBlogStats } from "@/lib/blog-db"

export async function GET() {
  try {
    const allPosts = await getAllBlogPosts(10, 0)
    const publishedPosts = await getPublishedBlogPosts(10, 0)
    const stats = await getBlogStats()

    return NextResponse.json({
      success: true,
      data: {
        allPosts: allPosts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          published_at: post.published_at,
          created_at: post.created_at,
        })),
        publishedPosts: publishedPosts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          published_at: post.published_at,
          created_at: post.created_at,
        })),
        stats,
        debug: {
          allPostsCount: allPosts.length,
          publishedPostsCount: publishedPosts.length,
          firstPost: allPosts[0] || null,
          firstPublishedPost: publishedPosts[0] || null,
        },
      },
    })
  } catch (error) {
    console.error("Debug blog error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
