import { type NextRequest, NextResponse } from "next/server"
import { updateBlogPost, deleteBlogPost, getBlogPostById } from "@/lib/blog-db"

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
    console.log("Updating post with data:", data)

    const post = await updateBlogPost(id, data)

    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found or update failed" }, { status: 404 })
    }

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
