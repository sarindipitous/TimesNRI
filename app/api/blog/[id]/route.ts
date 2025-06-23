import { type NextRequest, NextResponse } from "next/server"
import { updateBlogPost, deleteBlogPost } from "@/lib/blog-db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 })
    }

    const data = await request.json()
    const post = await updateBlogPost(id, data)

    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found or update failed" }, { status: 404 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error("Blog update error:", error)
    return NextResponse.json({ success: false, message: "Failed to update blog post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid post ID" }, { status: 400 })
    }

    const success = await deleteBlogPost(id)

    if (!success) {
      return NextResponse.json({ success: false, message: "Post not found or delete failed" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Blog deletion error:", error)
    return NextResponse.json({ success: false, message: "Failed to delete blog post" }, { status: 500 })
  }
}
