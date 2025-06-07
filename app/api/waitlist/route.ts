import { type NextRequest, NextResponse } from "next/server"
import {
  getAllWaitlistSubmissions,
  getWaitlistStats,
  searchWaitlistByEmail,
  filterWaitlistByLocation,
  filterWaitlistByParentLocation,
} from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const email = searchParams.get("email")
    const location = searchParams.get("location")
    const parentLocation = searchParams.get("parentLocation")
    const stats = searchParams.get("stats") === "true"

    // Return stats if requested
    if (stats) {
      const waitlistStats = await getWaitlistStats()
      return NextResponse.json({ success: true, stats: waitlistStats })
    }

    // Search by email if provided
    if (email) {
      const results = await searchWaitlistByEmail(email, limit)
      return NextResponse.json({ success: true, submissions: results })
    }

    // Filter by location if provided
    if (location) {
      const results = await filterWaitlistByLocation(location, limit)
      return NextResponse.json({ success: true, submissions: results })
    }

    // Filter by parent location if provided
    if (parentLocation) {
      const results = await filterWaitlistByParentLocation(parentLocation, limit)
      return NextResponse.json({ success: true, submissions: results })
    }

    // Otherwise return all submissions with pagination
    const submissions = await getAllWaitlistSubmissions(limit, offset)
    return NextResponse.json({ success: true, submissions })
  } catch (error) {
    console.error("Error in waitlist API route:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching waitlist data" },
      { status: 500 },
    )
  }
}
