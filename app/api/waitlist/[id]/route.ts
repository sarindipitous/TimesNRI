import { type NextRequest, NextResponse } from "next/server"
import { deleteWaitlistSubmission, updateWaitlistSubmission, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!hasDb) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
  }

  try {
    const id = Number.parseInt(params.id)

    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    console.log(`API: Attempting to delete waitlist entry with ID: ${id}`)

    const success = await deleteWaitlistSubmission(id)

    if (success) {
      console.log(`API: Successfully deleted waitlist entry with ID: ${id}`)
      return NextResponse.json({
        success: true,
        message: "Entry deleted successfully",
      })
    } else {
      console.log(`API: Failed to delete waitlist entry with ID: ${id}`)
      return NextResponse.json(
        {
          success: false,
          error: "Entry not found or could not be deleted",
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error(`API: Error deleting waitlist entry:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
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

    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, location, parent_location, care_needs, care_plan, care_plan_interest } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const updated = await updateWaitlistSubmission(id, {
      name,
      email,
      location,
      parent_location,
      care_needs,
      care_plan,
      care_plan_interest,
    })

    if (updated) {
      return NextResponse.json({
        success: true,
        message: "Entry updated successfully",
        submission: updated,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Entry not found or could not be updated",
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("API: Error updating waitlist entry:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
