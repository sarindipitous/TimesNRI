import { type NextRequest, NextResponse } from "next/server"
import { getReferralsByReferrerId, getDetailedReferralsByReferrerId, getWaitlistSubmissionByEmail } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const referrerId = searchParams.get("referrerId")
    const referrerEmail = searchParams.get("referrerEmail")
    const detailed = searchParams.get("detailed") === "true"

    if (!referrerId && !referrerEmail) {
      return NextResponse.json(
        { success: false, message: "Either referrerId or referrerEmail is required" },
        { status: 400 },
      )
    }

    let id: number | undefined

    // If email is provided, get the referrer ID
    if (referrerEmail) {
      const referrer = await getWaitlistSubmissionByEmail(referrerEmail)
      if (!referrer) {
        return NextResponse.json({ success: false, message: "Referrer not found" }, { status: 404 })
      }
      id = referrer.id
    } else {
      id = Number.parseInt(referrerId as string)
    }

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid referrer ID" }, { status: 400 })
    }

    // Get referrals based on the detailed flag
    const referrals = detailed ? await getDetailedReferralsByReferrerId(id) : await getReferralsByReferrerId(id)

    return NextResponse.json({ success: true, referrals })
  } catch (error) {
    console.error("Error in referrals API route:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching referral data" },
      { status: 500 },
    )
  }
}
