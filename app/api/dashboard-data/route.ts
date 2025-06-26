import { NextResponse } from "next/server"

/**
 * Minimal implementation that returns dummy data so the build succeeds.
 * Replace the hard-coded values with real DB queries when ready.
 */
export async function GET() {
  // TODO: replace with real database calls
  return NextResponse.json({
    totalSubmissions: 0,
    last7Days: 0,
    recentSubmissions: [],
  })
}
