import { type NextRequest, NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasDb) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
  }

  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    const result = await sql`DELETE FROM waitlist_submissions WHERE id = ${id}`

    if (result.count === 0) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully deleted waitlist entry",
    })
  } catch (error) {
    console.error("Error deleting waitlist entry:", error)
    return NextResponse.json({ success: false, error: "Failed to delete entry" }, { status: 500 })
  }
}
