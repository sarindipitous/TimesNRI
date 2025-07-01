import { type NextRequest, NextResponse } from "next/server"
import { deleteWaitlistSubmission, updateWaitlistSubmission } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID provided" }, { status: 400 })
    }

    console.log(`DELETE request for waitlist submission ID: ${id}`)

    const success = await deleteWaitlistSubmission(id)

    if (success) {
      console.log(`Successfully deleted waitlist submission ${id}`)
      return NextResponse.json({
        success: true,
        message: "Entry deleted successfully",
      })
    } else {
      console.log(`Failed to delete waitlist submission ${id} - entry not found`)
      return NextResponse.json({ success: false, error: "Entry not found or could not be deleted" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error in DELETE /api/waitlist/[id]:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID provided" }, { status: 400 })
    }

    const body = await request.json()
    console.log(`PUT request for waitlist submission ID: ${id}`, body)

    const updatedSubmission = await updateWaitlistSubmission(id, body)

    if (updatedSubmission) {
      console.log(`Successfully updated waitlist submission ${id}`)
      return NextResponse.json({
        success: true,
        submission: updatedSubmission,
        message: "Entry updated successfully",
      })
    } else {
      console.log(`Failed to update waitlist submission ${id} - entry not found`)
      return NextResponse.json({ success: false, error: "Entry not found or could not be updated" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error in PUT /api/waitlist/[id]:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
