import { type NextRequest, NextResponse } from "next/server"
import { deleteWaitlistSubmission } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    console.log(`Attempting to delete waitlist submission with ID: ${id}`)

    const success = await deleteWaitlistSubmission(id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Submission not found or could not be deleted" },
        { status: 404 },
      )
    }

    console.log(`Successfully deleted waitlist submission with ID: ${id}`)

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting waitlist submission:", error)
    return NextResponse.json({ success: false, error: "Failed to delete submission" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 })
    }

    // For now, we'll implement a simple lookup by ID
    // You could extend this to get a specific submission
    return NextResponse.json({
      success: true,
      message: "GET endpoint for individual submissions",
    })
  } catch (error) {
    console.error("Error fetching waitlist submission:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch submission" }, { status: 500 })
  }
}
