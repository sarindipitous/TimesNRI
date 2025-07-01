import { type NextRequest, NextResponse } from "next/server"
import { sql, hasDb, getAllWaitlistSubmissions, getWaitlistStats } from "@/lib/db"

export const dynamic = "force-dynamic"

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return false
  }

  if (userLimit.count >= maxRequests) {
    return true
  }

  userLimit.count++
  return false
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return "unknown"
}

export async function GET(request: NextRequest) {
  console.log("=== WAITLIST API GET REQUEST ===")

  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    if (isRateLimited(clientIP)) {
      console.log("❌ Rate limit exceeded for IP:", clientIP)
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 })
    }

    if (!hasDb) {
      console.log("❌ Database not configured")
      return NextResponse.json({
        success: false,
        error: "Database not configured",
        submissions: [],
        stats: { total: 0, lastWeek: 0 },
      })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const offsetParam = searchParams.get("offset")

    // Validate and sanitize parameters
    const limit = limitParam ? Math.min(Math.max(1, Number.parseInt(limitParam)), 10000) : 1000
    const offset = offsetParam ? Math.max(0, Number.parseInt(offsetParam)) : 0

    if (Number.isNaN(limit) || Number.isNaN(offset)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid limit or offset parameters",
        },
        { status: 400 },
      )
    }

    console.log(`📊 Fetching submissions with limit: ${limit}, offset: ${offset}`)

    // Get submissions and stats in parallel
    const [submissions, stats] = await Promise.all([getAllWaitlistSubmissions(limit, offset), getWaitlistStats()])

    console.log(`✅ Retrieved ${submissions.length} submissions`)
    console.log(`✅ Retrieved stats:`, stats)

    // Calculate referral stats
    const referralSubmissions = submissions.filter((sub) => sub.referred_by)
    const uniqueReferrers = new Set(referralSubmissions.map((sub) => sub.referred_by)).size

    console.log(`📊 Referral stats: ${referralSubmissions.length} referrals from ${uniqueReferrers} unique referrers`)

    const response = {
      success: true,
      submissions,
      stats: {
        ...stats,
        totalReferrals: referralSubmissions.length,
        uniqueReferrers,
      },
      total: submissions.length,
      pagination: {
        limit,
        offset,
        hasMore: submissions.length === limit,
      },
    }

    console.log("=== WAITLIST API SUCCESS ===")
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error fetching waitlist:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch waitlist data",
        submissions: [],
        stats: { total: 0, lastWeek: 0, totalReferrals: 0, uniqueReferrers: 0 },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("=== WAITLIST API POST REQUEST ===")

  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    if (isRateLimited(clientIP, 10, 60000)) {
      // Stricter limit for POST
      console.log("❌ Rate limit exceeded for IP:", clientIP)
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 })
    }

    if (!hasDb) {
      console.log("❌ Database not configured")
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const body = await request.json()

    // Input validation
    const { email, name, source, location, parent_location, care_needs, care_plan, care_plan_interest, referred_by } =
      body

    if (!email || typeof email !== "string" || !email.includes("@")) {
      console.log("❌ Invalid email provided")
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 })
    }

    // Sanitize inputs
    const cleanEmail = email.toLowerCase().trim()
    const cleanName = typeof name === "string" ? name.trim() : null
    const cleanSource = typeof source === "string" ? source.trim() : null
    const cleanLocation = typeof location === "string" ? location.trim() : null
    const cleanParentLocation = typeof parent_location === "string" ? parent_location.trim() : null
    const cleanCareNeeds = typeof care_needs === "string" ? care_needs.trim() : null
    const cleanCarePlan = typeof care_plan === "string" ? care_plan.trim() : null
    const cleanCarePlanInterest = typeof care_plan_interest === "string" ? care_plan_interest.trim() : null
    const cleanReferredBy = typeof referred_by === "string" ? referred_by.trim() : null

    console.log("📝 POST request body:", {
      email: cleanEmail,
      name: cleanName,
      source: cleanSource,
      location: cleanLocation,
      parent_location: cleanParentLocation,
      care_needs: cleanCareNeeds,
      care_plan: cleanCarePlan ? cleanCarePlan.substring(0, 20) + "..." : undefined,
      care_plan_interest: cleanCarePlanInterest ? cleanCarePlanInterest.substring(0, 20) + "..." : undefined,
      referred_by: cleanReferredBy,
    })

    const result = await sql`
      INSERT INTO waitlist_submissions (
        email, source, name, location, parent_location, care_needs, care_plan, care_plan_interest, referred_by
      ) 
      VALUES (
        ${cleanEmail}, ${cleanSource}, ${cleanName}, ${cleanLocation}, 
        ${cleanParentLocation}, ${cleanCareNeeds}, ${cleanCarePlan}, 
        ${cleanCarePlanInterest}, ${cleanReferredBy}
      )
      ON CONFLICT (email) DO UPDATE SET
        source = COALESCE(EXCLUDED.source, waitlist_submissions.source),
        name = COALESCE(EXCLUDED.name, waitlist_submissions.name),
        location = COALESCE(EXCLUDED.location, waitlist_submissions.location),
        parent_location = COALESCE(EXCLUDED.parent_location, waitlist_submissions.parent_location),
        care_needs = COALESCE(EXCLUDED.care_needs, waitlist_submissions.care_needs),
        care_plan = COALESCE(EXCLUDED.care_plan, waitlist_submissions.care_plan),
        care_plan_interest = COALESCE(EXCLUDED.care_plan_interest, waitlist_submissions.care_plan_interest),
        referred_by = COALESCE(EXCLUDED.referred_by, waitlist_submissions.referred_by)
      RETURNING *
    `

    console.log("✅ Database insert successful:", {
      id: result[0].id,
      email: result[0].email,
      referred_by: result[0].referred_by,
    })

    console.log("=== WAITLIST API POST SUCCESS ===")
    return NextResponse.json({
      success: true,
      submission: result[0],
      message: "Successfully added to waitlist",
    })
  } catch (error) {
    console.error("❌ Error adding to waitlist:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add to waitlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
