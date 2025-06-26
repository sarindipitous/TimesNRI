import { type NextRequest, NextResponse } from "next/server"
import { deleteWaitlistSubmission, sql, hasDb } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    console.log(`API: Attempting to delete waitlist submission with ID: ${id}`)

    if (!hasDb) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    // Check if submission exists first
    const existing = await sql`SELECT id, email FROM waitlist_submissions WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 })
    }

    console.log(`API: Found submission to delete:`, existing[0])

    const success = await deleteWaitlistSubmission(id)

    if (!success) {
      return NextResponse.json({ success: false, error: "Could not delete submission" }, { status: 500 })
    }

    console.log(`API: Successfully deleted waitlist submission with ID: ${id}`)

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully",
      deletedId: id,
    })
  } catch (error) {
    console.error("API Error deleting waitlist submission:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete submission",
      },
      { status: 500 },
    )
  }
}
