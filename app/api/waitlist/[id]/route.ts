import { type NextRequest, NextResponse } from "next/server"
import { deleteWaitlistSubmission, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

function validateId(id: string): number | null {
  const numId = Number.parseInt(id)
  return Number.isNaN(numId) || numId <= 0 ? null : numId
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("=== WAITLIST DELETE REQUEST ===")

  try {
    if (!hasDb) {
      console.log("❌ Database not configured")
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const id = validateId(params.id)

    if (!id) {
      console.log("❌ Invalid ID:", params.id)
      return NextResponse.json({ success: false, error: "Invalid ID provided" }, { status: 400 })
    }

    console.log(`🗑️ Attempting to delete waitlist submission with ID: ${id}`)

    const success = await deleteWaitlistSubmission(id)

    if (success) {
      console.log(`✅ Successfully deleted waitlist submission with ID: ${id}`)
      return NextResponse.json({
        success: true,
        message: "Entry deleted successfully",
      })
    } else {
      console.log(`❌ Failed to delete waitlist submission with ID: ${id}`)
      return NextResponse.json(
        {
          success: false,
          error: "Entry not found or could not be deleted",
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error(`❌ Error deleting waitlist entry:`, error)
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("=== WAITLIST GET BY ID REQUEST ===")

  try {
    if (!hasDb) {
      console.log("❌ Database not configured")
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const { sql } = await import("@/lib/db")
    const id = validateId(params.id)

    if (!id) {
      console.log("❌ Invalid ID:", params.id)
      return NextResponse.json({ success: false, error: "Invalid ID provided" }, { status: 400 })
    }

    console.log(`🔍 Fetching waitlist submission with ID: ${id}`)

    const result = await sql`
      SELECT * FROM waitlist_submissions 
      WHERE id = ${id}
      LIMIT 1
    `

    if (result.length === 0) {
      console.log(`❌ No submission found with ID: ${id}`)
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 })
    }

    console.log(`✅ Found submission with ID: ${id}`)
    return NextResponse.json({
      success: true,
      submission: result[0],
    })
  } catch (error) {
    console.error(`❌ Error fetching waitlist entry:`, error)
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
