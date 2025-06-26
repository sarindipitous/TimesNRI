import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Get total referral counts
    const totalStats = await sql`
      SELECT 
        COUNT(DISTINCT referrer_id) as total_referrers,
        COUNT(*) as total_referrals
      FROM referral_details
    `

    // Get top referrers with their details
    const topReferrers = await sql`
      SELECT 
        ws.email as referrer_email,
        ws.name as referrer_name,
        COUNT(rd.id) as referral_count
      FROM referral_details rd
      JOIN waitlist_submissions ws ON rd.referrer_id = ws.id
      GROUP BY ws.id, ws.email, ws.name
      ORDER BY referral_count DESC
      LIMIT 10
    `

    // Get recent referrals
    const recentReferrals = await sql`
      SELECT 
        ws.email as referrer_email,
        rd.referred_email,
        rd.created_at
      FROM referral_details rd
      JOIN waitlist_submissions ws ON rd.referrer_id = ws.id
      ORDER BY rd.created_at DESC
      LIMIT 20
    `

    return NextResponse.json({
      success: true,
      totalReferrers: Number(totalStats[0]?.total_referrers || 0),
      totalReferrals: Number(totalStats[0]?.total_referrals || 0),
      topReferrers: topReferrers.map((r) => ({
        referrer_email: r.referrer_email,
        referrer_name: r.referrer_name,
        referral_count: Number(r.referral_count),
      })),
      recentReferrals: recentReferrals.map((r) => ({
        referrer_email: r.referrer_email,
        referred_email: r.referred_email,
        created_at: r.created_at,
      })),
    })
  } catch (error) {
    console.error("Error fetching referral stats:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch referral stats" }, { status: 500 })
  }
}
