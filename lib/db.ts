// ──────────────────────────────────────────────────────────────────────────────
//  SAFELY initialise Neon SQL client
// ──────────────────────────────────────────────────────────────────────────────
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

export const hasDb = !!process.env.DATABASE_URL

function createNoOpClient() {
  return async () => {
    // Executed only if someone accidentally calls SQL without a DB
    throw new Error(
      `DATABASE_URL is not set.  
Add it in Vercel → Project Settings → Environment Variables (or .env locally) and redeploy.`,
    )
  }
}

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
  updated_at?: Date
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
//  READ helpers - FIXED TO ACTUALLY RETURN ALL DATA
// ──────────────────────────────────────────────────────────────────────────────
export async function getAllWaitlistSubmissions(limit = 1000, offset = 0) {
  if (!hasDb) return noDb([], "getAllWaitlistSubmissions")

  try {
    console.log(`Fetching waitlist submissions with limit: ${limit}, offset: ${offset}`)

    // Simple query first - get ALL the data without joins
    const result = await sql`
      SELECT * FROM waitlist_submissions 
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log(`Found ${result.length} submissions`)
    console.log("Sample submission:", result[0])

    return result as WaitlistSubmission[]
  } catch (error) {
    console.error("Error in getAllWaitlistSubmissions:", error)
    throw error
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  CREATE helpers - ATOMIC OPERATION
// ──────────────────────────────────────────────────────────────────────────────
export async function addToWaitlist(
  email: string,
  source?: string,
  name?: string,
  location?: string,
  parentLocation?: string,
  careNeeds?: string,
  carePlan?: string,
  carePlanInterest?: string,
) {
  try {
    console.log("Adding to waitlist:", {
      email,
      source,
      name,
      location,
      parentLocation,
      careNeeds,
      carePlan,
      carePlanInterest,
    })

    // Use a single INSERT with all data to avoid partial entries
    const result = await sql`
      INSERT INTO waitlist_submissions (
        email, name, source, location, parent_location, care_needs, care_plan, care_plan_interest
      ) 
      VALUES (
        ${email}, ${name || null}, ${source || null}, ${location || null}, 
        ${parentLocation || null}, ${careNeeds || null}, ${carePlan || null}, ${carePlanInterest || null}
      )
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, waitlist_submissions.name),
        source = COALESCE(EXCLUDED.source, waitlist_submissions.source),
        location = COALESCE(EXCLUDED.location, waitlist_submissions.location),
        parent_location = COALESCE(EXCLUDED.parent_location, waitlist_submissions.parent_location),
        care_needs = COALESCE(EXCLUDED.care_needs, waitlist_submissions.care_needs),
        care_plan = COALESCE(EXCLUDED.care_plan, waitlist_submissions.care_plan),
        care_plan_interest = COALESCE(EXCLUDED.care_plan_interest, waitlist_submissions.care_plan_interest),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    console.log("Insert result:", result[0])
    return result[0] as WaitlistSubmission
  } catch (error) {
    console.error("Error adding to waitlist:", error)
    return null
  }
}

export async function addReferral(referrerId: number, referredEmail: string): Promise<Referral | null> {
  if (!hasDb) return noDb(null, "addReferral")
  try {
    const res =
      await sql`INSERT INTO referrals (referrer_id, referred_email) VALUES (${referrerId}, ${referredEmail}) RETURNING *`
    return res[0] as Referral
  } catch (e) {
    console.error("addReferral error", e)
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
    const res = await sql`
      INSERT INTO referral_details (referrer_id, referred_email, referred_id)
      VALUES (${referrerId}, ${referredEmail}, ${referredId})
      RETURNING *`
    return res[0] as ReferralDetail
  } catch (e) {
    console.error("addDetailedReferral error", e)
    return null
  }
}

export async function getWaitlistSubmissionByEmail(email: string) {
  if (!hasDb) return noDb(null, "getWaitlistSubmissionByEmail")
  const res = await sql`SELECT * FROM waitlist_submissions WHERE email = ${email} LIMIT 1`
  return (res[0] as WaitlistSubmission) || null
}

export async function getWaitlistStats() {
  if (!hasDb) return noDb({ total: 0, lastWeek: 0 }, "getWaitlistStats")
  try {
    const res = await sql`
      SELECT
        COUNT(*)                        AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS last_week
      FROM waitlist_submissions`
    return { total: Number(res[0].total), lastWeek: Number(res[0].last_week) }
  } catch (error) {
    console.error("Error fetching waitlist stats:", error)
    return { total: 0, lastWeek: 0 }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  UPDATE helpers - ROBUST UPDATE WITH FALLBACK
// ──────────────────────────────────────────────────────────────────────────────
export async function updateWaitlistSubmission(
  id: number,
  data: Partial<WaitlistSubmission>,
): Promise<WaitlistSubmission | null> {
  if (!hasDb) return noDb(null, "updateWaitlistSubmission")

  const entries = Object.entries(data).filter(([k]) => k !== "id" && k !== "created_at" && k !== "referred_by")
  if (!entries.length) return null

  try {
    // Try the full update first
    const set = entries.map(([k, v]) => sql`${sql.identifier([k])} = ${v}`).reduce((a, b) => sql`${a}, ${b}`)
    const res =
      await sql`UPDATE waitlist_submissions SET ${set}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING *`
    return res[0] as WaitlistSubmission
  } catch (e) {
    console.error("Full update failed, trying fallback:", e)

    // If the error is about missing columns, try fallback without new columns
    if (e instanceof Error && e.message.includes("column") && e.message.includes("does not exist")) {
      console.log("Attempting fallback update without new columns...")
      try {
        // Filter out the new columns that might not exist
        const fallbackEntries = entries.filter(([k]) => !["care_plan", "care_plan_interest"].includes(k))

        if (fallbackEntries.length === 0) {
          console.log("No valid columns to update in fallback")
          return null
        }

        const fallbackSet = fallbackEntries
          .map(([k, v]) => sql`${sql.identifier([k])} = ${v}`)
          .reduce((a, b) => sql`${a}, ${b}`)

        const fallbackRes =
          await sql`UPDATE waitlist_submissions SET ${fallbackSet}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} RETURNING *`
        return fallbackRes[0] as WaitlistSubmission
      } catch (fallbackError) {
        console.error("Fallback update also failed", fallbackError)
        return null
      }
    }

    return null
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  DELETE helpers - CASCADE DELETE TO HANDLE FOREIGN KEYS
// ──────────────────────────────────────────────────────────────────────────────
export async function deleteWaitlistSubmission(id: number): Promise<boolean> {
  if (!hasDb) return noDb(false, "deleteWaitlistSubmission")

  try {
    // Use a transaction to delete referrals first, then the waitlist submission
    await sql`BEGIN`

    // Try to delete from referrals table first (where this submission is the referrer)
    try {
      await sql`DELETE FROM referrals WHERE referrer_id = ${id}`
    } catch (e) {
      console.log("referrals table might not exist, continuing...")
    }

    // Try to delete from referral_details table first (where this submission is the referrer)
    try {
      await sql`DELETE FROM referral_details WHERE referrer_id = ${id}`
    } catch (e) {
      console.log("referral_details table might not exist, continuing...")
    }

    // Also try to delete referrals where this submission was referred by someone else
    try {
      await sql`DELETE FROM referral_details WHERE referred_id = ${id}`
    } catch (e) {
      console.log("referral_details table might not exist, continuing...")
    }

    // Now delete the waitlist submission
    const res = await sql`DELETE FROM waitlist_submissions WHERE id = ${id}`

    await sql`COMMIT`

    return res.count > 0
  } catch (error) {
    // Rollback the transaction on error
    try {
      await sql`ROLLBACK`
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError)
    }
    console.error("Error in deleteWaitlistSubmission:", error)
    throw error
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  SEARCH / FILTER helpers
// ──────────────────────────────────────────────────────────────────────────────
export async function searchWaitlistByEmail(email: string, limit = 100) {
  if (!hasDb) return noDb([], "searchWaitlistByEmail")
  return (await sql`
    SELECT * FROM waitlist_submissions 
    WHERE email ILIKE ${"%" + email + "%"}
    ORDER BY created_at DESC
    LIMIT ${limit}`) as WaitlistSubmission[]
}

export async function filterWaitlistByLocation(location: string, limit = 100) {
  if (!hasDb) return noDb([], "filterWaitlistByLocation")
  return (await sql`
    SELECT * FROM waitlist_submissions 
    WHERE location ILIKE ${"%" + location + "%"}
    ORDER BY created_at DESC
    LIMIT ${limit}`) as WaitlistSubmission[]
}

export async function filterWaitlistByParentLocation(parentLocation: string, limit = 100) {
  if (!hasDb) return noDb([], "filterWaitlistByParentLocation")
  return (await sql`
    SELECT * FROM waitlist_submissions 
    WHERE parent_location ILIKE ${"%" + parentLocation + "%"}
    ORDER BY created_at DESC
    LIMIT ${limit}`) as WaitlistSubmission[]
}

// ──────────────────────────────────────────────────────────────────────────────
//  REFERRALS helpers
// ──────────────────────────────────────────────────────────────────────────────
export async function getReferralsByReferrerId(referrerId: number) {
  if (!hasDb) return noDb([], "getReferralsByReferrerId")
  try {
    return (await sql`
      SELECT * FROM referrals 
      WHERE referrer_id = ${referrerId}
      ORDER BY created_at DESC`) as Referral[]
  } catch (error) {
    console.error("Error fetching referrals:", error)
    return []
  }
}

export async function getDetailedReferralsByReferrerId(referrerId: number) {
  if (!hasDb) return noDb([], "getDetailedReferralsByReferrerId")
  try {
    return (await sql`
      SELECT * FROM referral_details 
      WHERE referrer_id = ${referrerId}
      ORDER BY created_at DESC`) as ReferralDetail[]
  } catch (error) {
    console.error("Error fetching detailed referrals:", error)
    return []
  }
}
