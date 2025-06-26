import { type NextRequest, NextResponse } from "next/server"
import { getAllWaitlistSubmissions, addToWaitlist, getWaitlistStats } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("Fetching waitlist submissions...")

    const submissions = await getAllWaitlistSubmissions(limit, offset)
    const stats = await getWaitlistStats()

    console.log(`Found ${submissions.length} submissions`)

    return NextResponse.json({
      success: true,
      submissions,
      stats,
      total: submissions.length,
    })
  } catch (error) {
    console.error("Error fetching waitlist:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch waitlist data",
        submissions: [],
        stats: { total: 0, lastWeek: 0 },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, source, location, parent_location, care_needs, care_plan, care_plan_interest } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    console.log("Adding to waitlist:", { email, name, source })

    const submission = await addToWaitlist(
      email,
      source,
      name,
      location,
      parent_location,
      care_needs,
      care_plan,
      care_plan_interest,
    )

    if (!submission) {
      return NextResponse.json({ success: false, error: "Failed to add to waitlist" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      submission,
      message: "Successfully added to waitlist",
    })
  } catch (error) {
    console.error("Error adding to waitlist:", error)
    return NextResponse.json({ success: false, error: "Failed to add to waitlist" }, { status: 500 })
  }
}
