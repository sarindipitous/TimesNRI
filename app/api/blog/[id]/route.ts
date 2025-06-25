import { type NextRequest, NextResponse } from "next/server"
import { updateBlogPost, deleteBlogPost, getBlogPostById } from "@/lib/blog-db"
import { revalidatePath } from "next/cache"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 })
    }

    const post = await getBlogPostById(id)

    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error("Blog fetch error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch blog post" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 })
    }

    const data = await request.json()
    console.log("API: Updating post with data:", data)

    // Validate required fields
    if (data.title && !data.title.trim()) {
      return NextResponse.json({ success: false, message: "Title cannot be empty" }, { status: 400 })
    }

    if (data.content && !data.content.trim()) {
      return NextResponse.json({ success: false, message: "Content cannot be empty" }, { status: 400 })
    }

    if (data.slug && !data.slug.trim()) {
      return NextResponse.json({ success: false, message: "Slug cannot be empty" }, { status: 400 })
    }

    const post = await updateBlogPost(id, data)

    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found or update failed" }, { status: 404 })
    }

    // Additional revalidation at API level
    revalidatePath("/blog")
    revalidatePath("/admin/blog")
    if (post.status === "published") {
      revalidatePath(`/blog/${post.slug}`)
    }

    console.log("API: Post updated successfully:", post.title)
    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error("Blog update error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update blog post",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 })
    }

    console.log("Deleting post with ID:", id)
    const success = await deleteBlogPost(id)

    if (!success) {
      return NextResponse.json({ success: false, message: "Post not found or delete failed" }, { status: 404 })
    }

    // Revalidate after deletion
    revalidatePath("/blog")
    revalidatePath("/admin/blog")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Blog deletion error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete blog post",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
