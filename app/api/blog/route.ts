import { type NextRequest, NextResponse } from "next/server"
import {
  getPublishedBlogPosts,
  getAllBlogPosts,
  createBlogPost,
  searchBlogPosts,
  generateUniqueSlug,
} from "@/lib/blog-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const admin = searchParams.get("admin") === "true"
    const search = searchParams.get("search")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 50)
    const offset = Math.max(Number.parseInt(searchParams.get("offset") || "0"), 0)

    let posts
    if (search) {
      posts = await searchBlogPosts(search, limit)
    } else if (admin) {
      posts = await getAllBlogPosts(limit, offset)
    } else {
      posts = await getPublishedBlogPosts(limit, offset)
    }

    return NextResponse.json({ success: true, posts })
  } catch (error) {
    console.error("Blog API GET error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch blog posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.title?.trim()) {
      return NextResponse.json({ success: false, message: "Title is required" }, { status: 400 })
    }

    if (!data.content?.trim()) {
      return NextResponse.json({ success: false, message: "Content is required" }, { status: 400 })
    }

    if (!data.author?.trim()) {
      return NextResponse.json({ success: false, message: "Author is required" }, { status: 400 })
    }

    // Generate unique slug if not provided
    if (!data.slug?.trim()) {
      data.slug = await generateUniqueSlug(data.title)
    }

    const post = await createBlogPost({
      title: data.title.trim(),
      slug: data.slug.trim(),
      excerpt: data.excerpt?.trim() || "",
      content: data.content.trim(),
      author: data.author.trim(),
      featured_image: data.featured_image?.trim() || null,
      tags: data.tags?.trim() || null,
      status: data.status === "published" ? "published" : "draft",
    })

    if (!post.id) {
      return NextResponse.json({ success: false, message: "Failed to create blog post" }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error("Blog API POST error:", error)
    return NextResponse.json({ success: false, message: "Failed to create blog post" }, { status: 500 })
  }
}
