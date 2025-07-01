// ──────────────────────────────────────────────────────────────────────────────
//  SAFELY initialise Neon SQL client
// ──────────────────────────────────────────────────────────────────────────────
import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL?.trim()
export const hasDb = Boolean(databaseUrl)

function createNoOpClient() {
  return async () => {
    // Executed only if someone accidentally calls SQL without a DB
    throw new Error(
      `DATABASE_URL is not set.  
Add it in Vercel → Project Settings → Environment Variables (or .env locally) and redeploy.`,
    )
  }
}

export const sql: ReturnType<typeof neon> = hasDb
  ? neon(databaseUrl!)
  : (createNoOpClient() as unknown as ReturnType<typeof neon>)

// ──────────────────────────────────────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────────────────────────────────────
export interface WaitlistSubmission {
  id: number
  email: string
  name?: string
  source?: string
  location?: string
  parent_location?: string
  care_needs?: string
  care_plan?: string
  care_plan_interest?: string
  waitlist_number?: number
  referred_by?: string
  created_at: Date
}

export interface Referral {
  id: number
  referrer_id: number
  referred_email: string
  status: "pending" | "registered" | "converted"
  created_at: Date
}

export interface ReferralDetail extends Referral {
  referred_id?: number
}

// Helper to warn & bail out gracefully in preview
function noDb<T>(fallback: T, fnName: string): T {
  console.warn(`[lib/db] ${fnName} skipped – DATABASE_URL not set. Returning fallback.`)
  return fallback
}

// ──────────────────────────────────────────────────────────────────────────────
//  READ helpers - PRODUCTION READY WITH ERROR HANDLING
// ──────────────────────────────────────────────────────────────────────────────
export async function getAllWaitlistSubmissions(limit = 1000, offset = 0) {
  if (!hasDb) return noDb([], "getAllWaitlistSubmissions")

  try {
    console.log(`📊 Fetching waitlist submissions with limit: ${limit}, offset: ${offset}`)

    // Validate inputs
    const safeLimit = Math.min(Math.max(1, limit), 10000) // Cap at 10k for performance
    const safeOffset = Math.max(0, offset)

    const result = await sql`
      SELECT 
        id,
        email,
        name,
        source,
        location,
        parent_location,
        care_needs,
        care_plan,
        care_plan_interest,
        waitlist_number,
        referred_by,
        created_at
      FROM waitlist_submissions 
      ORDER BY created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `

    console.log(`✅ Found ${result.length} submissions`)
    return result as WaitlistSubmission[]
  } catch (error) {
    console.error("❌ Error in getAllWaitlistSubmissions:", error)
    // Don't throw in production - return empty array and log error
    return []
  }
}

export async function getWaitlistSubmissionByEmail(email: string): Promise<WaitlistSubmission | null> {
  if (!hasDb) return noDb(null, "getWaitlistSubmissionByEmail")

  try {
    // Input validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      console.warn("Invalid email provided to getWaitlistSubmissionByEmail:", email)
      return null
    }

    console.log(`🔍 Looking for waitlist submission by email: ${email}`)
    const res = await sql`
      SELECT * FROM waitlist_submissions 
      WHERE email = ${email.toLowerCase().trim()} 
      LIMIT 1
    `

    const submission = (res[0] as WaitlistSubmission) || null
    console.log(submission ? "✅ Found submission" : "❌ No submission found")
    return submission
  } catch (error) {
    console.error("❌ Error in getWaitlistSubmissionByEmail:", error)
    return null
  }
}

export async function getWaitlistStats() {
  if (!hasDb) return noDb({ total: 0, lastWeek: 0 }, "getWaitlistStats")

  try {
    console.log("📊 Fetching waitlist stats...")
    const res = await sql`
      SELECT
        COUNT(*)::int                        AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last_week
      FROM waitlist_submissions`

    const stats = {
      total: Number(res[0]?.total || 0),
      lastWeek: Number(res[0]?.last_week || 0),
    }
    console.log("✅ Stats:", stats)
    return stats
  } catch (error) {
    console.error("❌ Error fetching waitlist stats:", error)
    return { total: 0, lastWeek: 0 }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  CREATE helpers - PRODUCTION READY WITH VALIDATION
// ──────────────────────────────────────────────────────────────────────────────
export async function addToWaitlist(
  email: string,
  source?: string,
  name?: string,
  location?: string,
  parent_location?: string,
  care_needs?: string,
  care_plan?: string,
  care_plan_interest?: string,
): Promise<WaitlistSubmission | null> {
  if (!hasDb) return noDb(null, "addToWaitlist")

  try {
    // Input validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      console.error("Invalid email provided to addToWaitlist:", email)
      return null
    }

    // Sanitize inputs
    const cleanEmail = email.toLowerCase().trim()
    const cleanName = name?.trim() || null
    const cleanSource = source?.trim() || null
    const cleanLocation = location?.trim() || null
    const cleanParentLocation = parent_location?.trim() || null
    const cleanCareNeeds = care_needs?.trim() || null
    const cleanCarePlan = care_plan?.trim() || null
    const cleanCarePlanInterest = care_plan_interest?.trim() || null

    console.log("📝 Adding to waitlist:", {
      email: cleanEmail,
      source: cleanSource,
      name: cleanName,
      location: cleanLocation,
      parent_location: cleanParentLocation,
      care_needs: cleanCareNeeds,
      care_plan: cleanCarePlan ? cleanCarePlan.substring(0, 20) + "..." : undefined,
      care_plan_interest: cleanCarePlanInterest ? cleanCarePlanInterest.substring(0, 20) + "..." : undefined,
    })

    const result = await sql`
      INSERT INTO waitlist_submissions (
        email, 
        source, 
        name, 
        location, 
        parent_location, 
        care_needs, 
        care_plan, 
        care_plan_interest
      ) 
      VALUES (
        ${cleanEmail}, 
        ${cleanSource}, 
        ${cleanName}, 
        ${cleanLocation}, 
        ${cleanParentLocation}, 
        ${cleanCareNeeds}, 
        ${cleanCarePlan}, 
        ${cleanCarePlanInterest}
      )
      ON CONFLICT (email) DO UPDATE SET
        source = COALESCE(EXCLUDED.source, waitlist_submissions.source),
        name = COALESCE(EXCLUDED.name, waitlist_submissions.name),
        location = COALESCE(EXCLUDED.location, waitlist_submissions.location),
        parent_location = COALESCE(EXCLUDED.parent_location, waitlist_submissions.parent_location),
        care_needs = COALESCE(EXCLUDED.care_needs, waitlist_submissions.care_needs),
        care_plan = COALESCE(EXCLUDED.care_plan, waitlist_submissions.care_plan),
        care_plan_interest = COALESCE(EXCLUDED.care_plan_interest, waitlist_submissions.care_plan_interest)
      RETURNING *
    `

    const submission = result[0] as WaitlistSubmission
    console.log("✅ Insert result:", {
      id: submission.id,
      email: submission.email,
      waitlist_number: submission.waitlist_number,
    })
    return submission
  } catch (error) {
    console.error("❌ addToWaitlist error", error)

    // Graceful fallback for missing columns
    if (error instanceof Error && error.message.includes("column") && error.message.includes("does not exist")) {
      console.log("⚠️ Attempting fallback approach without new columns...")
      try {
        const fallbackResult = await sql`
          INSERT INTO waitlist_submissions (email, source, name, location, parent_location, care_needs) 
          VALUES (${email.toLowerCase().trim()}, ${source || null}, ${name?.trim() || null}, ${location?.trim() || null}, ${parent_location?.trim() || null}, ${care_needs?.trim() || null})
          ON CONFLICT (email) DO UPDATE SET
            source = COALESCE(EXCLUDED.source, waitlist_submissions.source),
            name = COALESCE(EXCLUDED.name, waitlist_submissions.name),
            location = COALESCE(EXCLUDED.location, waitlist_submissions.location),
            parent_location = COALESCE(EXCLUDED.parent_location, waitlist_submissions.parent_location),
            care_needs = COALESCE(EXCLUDED.care_needs, waitlist_submissions.care_needs)
          RETURNING *
        `
        console.log("✅ Fallback approach succeeded")
        return fallbackResult[0] as WaitlistSubmission
      } catch (fallbackError) {
        console.error("❌ Fallback approach also failed", fallbackError)
        return null
      }
    }

    return null
  }
}

export async function addReferral(referrerId: number, referredEmail: string): Promise<Referral | null> {
  if (!hasDb) return noDb(null, "addReferral")

  try {
    // Input validation
    if (!referrerId || !Number.isInteger(referrerId) || referrerId <= 0) {
      console.error("Invalid referrerId:", referrerId)
      return null
    }

    if (!referredEmail || typeof referredEmail !== "string" || !referredEmail.includes("@")) {
      console.error("Invalid referredEmail:", referredEmail)
      return null
    }

    const cleanReferredEmail = referredEmail.toLowerCase().trim()

    console.log(`🔗 Adding referral: ${referrerId} -> ${cleanReferredEmail}`)
    const res = await sql`
      INSERT INTO referrals (referrer_id, referred_email, status) 
      VALUES (${referrerId}, ${cleanReferredEmail}, 'registered') 
      ON CONFLICT (referrer_id, referred_email) DO UPDATE SET
        status = 'registered'
      RETURNING *
    `
    console.log("✅ Referral added:", res[0]?.id)
    return res[0] as Referral
  } catch (error) {
    console.error("❌ addReferral error", error)
    return null
  }
}

export async function addDetailedReferral(
  referrerId: number,
  referredEmail: string,
  referredId?: number,
): Promise<ReferralDetail | null> {
  if (!hasDb) return noDb(null, "addDetailedReferral")

  try {
    // Input validation
    if (!referrerId || !Number.isInteger(referrerId) || referrerId <= 0) {
      console.error("Invalid referrerId:", referrerId)
      return null
    }

    if (!referredEmail || typeof referredEmail !== "string" || !referredEmail.includes("@")) {
      console.error("Invalid referredEmail:", referredEmail)
      return null
    }

    const cleanReferredEmail = referredEmail.toLowerCase().trim()

    console.log(`🔗 Adding detailed referral: ${referrerId} -> ${cleanReferredEmail} (ID: ${referredId})`)
    const res = await sql`
      INSERT INTO referral_details (referrer_id, referred_email, referred_id, status)
      VALUES (${referrerId}, ${cleanReferredEmail}, ${referredId || null}, 'registered')
      ON CONFLICT (referrer_id, referred_email) DO UPDATE SET
        referred_id = COALESCE(EXCLUDED.referred_id, referral_details.referred_id),
        status = 'registered'
      RETURNING *`
    console.log("✅ Detailed referral added:", res[0]?.id)
    return res[0] as ReferralDetail
  } catch (error) {
    console.error("❌ addDetailedReferral error", error)
    return null
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  UPDATE helpers - PRODUCTION READY WITH VALIDATION
// ──────────────────────────────────────────────────────────────────────────────
export async function updateWaitlistSubmission(
  id: number,
  data: Partial<WaitlistSubmission>,
): Promise<WaitlistSubmission | null> {
  if (!hasDb) return noDb(null, "updateWaitlistSubmission")

  try {
    // Input validation
    if (!id || !Number.isInteger(id) || id <= 0) {
      console.error("Invalid id provided to updateWaitlistSubmission:", id)
      return null
    }

    // Filter out invalid fields and sanitize
    const allowedFields = [
      "name",
      "email",
      "location",
      "parent_location",
      "care_needs",
      "care_plan",
      "care_plan_interest",
      "referred_by",
    ]
    const entries = Object.entries(data)
      .filter(([key, value]) => allowedFields.includes(key) && value !== undefined)
      .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])

    if (!entries.length) {
      console.warn("No valid fields to update")
      return null
    }

    console.log(`📝 Updating waitlist submission ${id}:`, Object.fromEntries(entries))

    // Build the SET clause dynamically with proper escaping
    const setClauses = entries.map(([key, value]) => {
      return sql`${sql.identifier([key])} = ${value}`
    })

    const setClause = setClauses.reduce((acc, clause) => sql`${acc}, ${clause}`)

    const res = await sql`
      UPDATE waitlist_submissions 
      SET ${setClause}
      WHERE id = ${id} 
      RETURNING *
    `

    if (res.length === 0) {
      console.warn(`No submission found with id ${id}`)
      return null
    }

    console.log("✅ Update successful")
    return res[0] as WaitlistSubmission
  } catch (error) {
    console.error("❌ updateWaitlistSubmission error:", error)
    return null
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  DELETE helpers - PRODUCTION READY WITH VALIDATION
// ──────────────────────────────────────────────────────────────────────────────
export async function deleteWaitlistSubmission(id: number): Promise<boolean> {
  if (!hasDb) return noDb(false, "deleteWaitlistSubmission")

  try {
    // Input validation
    if (!id || !Number.isInteger(id) || id <= 0) {
      console.error("Invalid id provided to deleteWaitlistSubmission:", id)
      return false
    }

    console.log(`🗑️ Starting delete process for waitlist submission ID: ${id}`)

    // First, check if the entry exists
    const existingEntry = await sql`SELECT id, email FROM waitlist_submissions WHERE id = ${id}`
    if (existingEntry.length === 0) {
      console.log(`❌ Entry with ID ${id} not found`)
      return false
    }

    const email = existingEntry[0].email

    // Use a transaction to ensure data consistency
    await sql.begin(async (sql) => {
      // Delete related referrals first
      await sql`DELETE FROM referral_details WHERE referrer_id = ${id} OR referred_id = ${id}`
      await sql`DELETE FROM referrals WHERE referrer_id = ${id} OR referred_email = ${email}`

      // Delete the main waitlist submission
      await sql`DELETE FROM waitlist_submissions WHERE id = ${id}`
    })

    console.log(`✅ Successfully deleted waitlist submission with ID: ${id}`)
    return true
  } catch (error) {
    console.error(`❌ Error in deleteWaitlistSubmission for ID ${id}:`, error)
    return false
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  SEARCH / FILTER helpers - PRODUCTION READY
// ──────────────────────────────────────────────────────────────────────────────
export async function searchWaitlistByEmail(email: string, limit = 100) {
  if (!hasDb) return noDb([], "searchWaitlistByEmail")

  try {
    if (!email || typeof email !== "string") {
      return []
    }

    const safeLimit = Math.min(Math.max(1, limit), 1000)
    const searchTerm = `%${email.toLowerCase().trim()}%`

    return (await sql`
      SELECT * FROM waitlist_submissions 
      WHERE LOWER(email) LIKE ${searchTerm}
      ORDER BY created_at DESC
      LIMIT ${safeLimit}`) as WaitlistSubmission[]
  } catch (error) {
    console.error("❌ Error in searchWaitlistByEmail:", error)
    return []
  }
}

export async function filterWaitlistByLocation(location: string, limit = 100) {
  if (!hasDb) return noDb([], "filterWaitlistByLocation")

  try {
    if (!location || typeof location !== "string") {
      return []
    }

    const safeLimit = Math.min(Math.max(1, limit), 1000)
    const searchTerm = `%${location.toLowerCase().trim()}%`

    return (await sql`
      SELECT * FROM waitlist_submissions 
      WHERE LOWER(location) LIKE ${searchTerm}
      ORDER BY created_at DESC
      LIMIT ${safeLimit}`) as WaitlistSubmission[]
  } catch (error) {
    console.error("❌ Error in filterWaitlistByLocation:", error)
    return []
  }
}

export async function filterWaitlistByParentLocation(parentLocation: string, limit = 100) {
  if (!hasDb) return noDb([], "filterWaitlistByParentLocation")

  try {
    if (!parentLocation || typeof parentLocation !== "string") {
      return []
    }

    const safeLimit = Math.min(Math.max(1, limit), 1000)
    const searchTerm = `%${parentLocation.toLowerCase().trim()}%`

    return (await sql`
      SELECT * FROM waitlist_submissions 
      WHERE LOWER(parent_location) LIKE ${searchTerm}
      ORDER BY created_at DESC
      LIMIT ${safeLimit}`) as WaitlistSubmission[]
  } catch (error) {
    console.error("❌ Error in filterWaitlistByParentLocation:", error)
    return []
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  REFERRALS helpers - PRODUCTION READY
// ──────────────────────────────────────────────────────────────────────────────
export async function getReferralsByReferrerId(referrerId: number) {
  if (!hasDb) return noDb([], "getReferralsByReferrerId")

  try {
    if (!referrerId || !Number.isInteger(referrerId) || referrerId <= 0) {
      return []
    }

    return (await sql`
      SELECT * FROM referrals 
      WHERE referrer_id = ${referrerId}
      ORDER BY created_at DESC`) as Referral[]
  } catch (error) {
    console.error("❌ Error fetching referrals:", error)
    return []
  }
}

export async function getDetailedReferralsByReferrerId(referrerId: number) {
  if (!hasDb) return noDb([], "getDetailedReferralsByReferrerId")

  try {
    if (!referrerId || !Number.isInteger(referrerId) || referrerId <= 0) {
      return []
    }

    return (await sql`
      SELECT * FROM referral_details 
      WHERE referrer_id = ${referrerId}
      ORDER BY created_at DESC`) as ReferralDetail[]
  } catch (error) {
    console.error("❌ Error fetching detailed referrals:", error)
    return []
  }
}
