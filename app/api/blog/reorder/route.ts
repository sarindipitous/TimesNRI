import { type NextRequest, NextResponse } from "next/server"
import { updateBlogPostOrder } from "@/lib/blog-db"

export async function POST(request: NextRequest) {
  try {
    const { postIds } = await request.json()

    if (!Array.isArray(postIds)) {
      return NextResponse.json({ success: false, message: "Invalid post IDs" }, { status: 400 })
    }

    const success = await updateBlogPostOrder(postIds)

    if (success) {
      return NextResponse.json({ success: true, message: "Blog order updated successfully" })
    } else {
      return NextResponse.json({ success: false, message: "Failed to update blog order" }, { status: 500 })
    }
  } catch (error) {
    console.error("Blog reorder API error:", error)
    return NextResponse.json({ success: false, message: "Failed to update blog order" }, { status: 500 })
  }
}
