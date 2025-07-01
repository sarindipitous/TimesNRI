import { type NextRequest, NextResponse } from "next/server"
import { deleteWaitlistSubmission, hasDb } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasDb) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
  }

  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    console.log(`Attempting to delete waitlist entry with ID: ${id}`)

    const success = await deleteWaitlistSubmission(id)

    if (!success) {
      return NextResponse.json({ success: false, error: "Entry not found or could not be deleted" }, { status: 404 })
    }

    console.log(`Successfully deleted waitlist entry with ID: ${id}`)

    return NextResponse.json({
      success: true,
      message: "Successfully deleted waitlist entry",
    })
  } catch (error) {
    console.error("Error deleting waitlist entry:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasDb) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
  }

  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    const body = await request.json()
    const { updateWaitlistSubmission } = await import("@/lib/db")

    const updated = await updateWaitlistSubmission(id, body)

    if (!updated) {
      return NextResponse.json({ success: false, error: "Entry not found or could not be updated" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully updated waitlist entry",
      submission: updated,
    })
  } catch (error) {
    console.error("Error updating waitlist entry:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
