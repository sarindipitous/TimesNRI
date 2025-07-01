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
//  READ helpers - FIXED TO ACTUALLY RETURN ALL DATA
// ──────────────────────────────────────────────────────────────────────────────
export async function getAllWaitlistSubmissions(limit = 1000, offset = 0) {
  if (!hasDb) return noDb([], "getAllWaitlistSubmissions")

  try {
    console.log(`📊 Fetching waitlist submissions with limit: ${limit}, offset: ${offset}`)

    // Simple query first - get ALL the data without joins
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
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log(`✅ Found ${result.length} submissions`)
    if (result.length > 0) {
      console.log("📝 Sample submission:", {
        id: result[0].id,
        email: result[0].email,
        referred_by: result[0].referred_by,
        created_at: result[0].created_at,
      })
    }

    return result as WaitlistSubmission[]
  } catch (error) {
    console.error("❌ Error in getAllWaitlistSubmissions:", error)
    throw error
  }
}

export async function getWaitlistSubmissionByEmail(email: string): Promise<WaitlistSubmission | null> {
  if (!hasDb) return noDb(null, "getWaitlistSubmissionByEmail")

  try {
    console.log(`🔍 Looking for waitlist submission by email: ${email}`)
    const res = await sql`
      SELECT * FROM waitlist_submissions 
      WHERE email = ${email} 
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
        COUNT(*)                        AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS last_week
      FROM waitlist_submissions`

    const stats = { total: Number(res[0].total), lastWeek: Number(res[0].last_week) }
    console.log("✅ Stats:", stats)
    return stats
  } catch (error) {
    console.error("❌ Error fetching waitlist stats:", error)
    return { total: 0, lastWeek: 0 }
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
  parent_location?: string,
  care_needs?: string,
  care_plan?: string,
  care_plan_interest?: string,
): Promise<WaitlistSubmission | null> {
  if (!hasDb) return noDb(null, "addToWaitlist")

  try {
    console.log("📝 Adding to waitlist:", {
      email,
      source,
      name,
      location,
      parent_location,
      care_needs,
      care_plan: care_plan ? care_plan.substring(0, 20) + "..." : undefined,
      care_plan_interest: care_plan_interest ? care_plan_interest.substring(0, 20) + "..." : undefined,
    })

    // Use a single INSERT with all data to avoid partial entries
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
        ${email}, 
        ${source || null}, 
        ${name || null}, 
        ${location || null}, 
        ${parent_location || null}, 
        ${care_needs || null}, 
        ${care_plan || null}, 
        ${care_plan_interest || null}
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
  } catch (e) {
    console.error("❌ addToWaitlist error", e)

    // If the error is about missing columns, try the fallback approach
    if (e instanceof Error && e.message.includes("column") && e.message.includes("does not exist")) {
      console.log("⚠️ Attempting fallback approach without new columns...")
      try {
        const fallbackResult = await sql`
          INSERT INTO waitlist_submissions (email, source, name, location, parent_location, care_needs) 
          VALUES (${email}, ${source || null}, ${name || null}, ${location || null}, ${parent_location || null}, ${care_needs || null})
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
    console.log(`🔗 Adding referral: ${referrerId} -> ${referredEmail}`)
    const res = await sql`
      INSERT INTO referrals (referrer_id, referred_email, status) 
      VALUES (${referrerId}, ${referredEmail}, 'registered') 
      ON CONFLICT (referrer_id, referred_email) DO UPDATE SET
        status = 'registered'
      RETURNING *
    `
    console.log("✅ Referral added:", res[0]?.id)
    return res[0] as Referral
  } catch (e) {
    console.error("❌ addReferral error", e)
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
    console.log(`🔗 Adding detailed referral: ${referrerId} -> ${referredEmail} (ID: ${referredId})`)
    const res = await sql`
      INSERT INTO referral_details (referrer_id, referred_email, referred_id, status)
      VALUES (${referrerId}, ${referredEmail}, ${referredId || null}, 'registered')
      ON CONFLICT (referrer_id, referred_email) DO UPDATE SET
        referred_id = COALESCE(EXCLUDED.referred_id, referral_details.referred_id),
        status = 'registered'
      RETURNING *`
    console.log("✅ Detailed referral added:", res[0]?.id)
    return res[0] as ReferralDetail
  } catch (e) {
    console.error("❌ addDetailedReferral error", e)
    return null
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

  const entries = Object.entries(data).filter(([k]) => k !== "id" && k !== "created_at")
  if (!entries.length) return null

  try {
    console.log(`📝 Updating waitlist submission ${id}:`, data)

    // Build the SET clause dynamically
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

    console.log("✅ Update successful")
    return res[0] as WaitlistSubmission
  } catch (e) {
    console.error("❌ Full update failed, trying fallback:", e)

    // If the error is about missing columns, try fallback without new columns
    if (e instanceof Error && e.message.includes("column") && e.message.includes("does not exist")) {
      console.log("⚠️ Attempting fallback update without new columns...")
      try {
        // Filter out the new columns that might not exist
        const fallbackEntries = entries.filter(([k]) => !["care_plan", "care_plan_interest"].includes(k))

        if (fallbackEntries.length === 0) {
          console.log("⚠️ No valid columns to update in fallback")
          return null
        }

        const fallbackSetClauses = fallbackEntries.map(([key, value]) => {
          return sql`${sql.identifier([key])} = ${value}`
        })

        const fallbackSetClause = fallbackSetClauses.reduce((acc, clause) => sql`${acc}, ${clause}`)

        const fallbackRes = await sql`
          UPDATE waitlist_submissions 
          SET ${fallbackSetClause}
          WHERE id = ${id} 
          RETURNING *
        `
        console.log("✅ Fallback update successful")
        return fallbackRes[0] as WaitlistSubmission
      } catch (fallbackError) {
        console.error("❌ Fallback update also failed", fallbackError)
        return null
      }
    }

    return null
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  DELETE helpers - SIMPLIFIED AND ROBUST
// ──────────────────────────────────────────────────────────────────────────────
export async function deleteWaitlistSubmission(id: number): Promise<boolean> {
  if (!hasDb) return noDb(false, "deleteWaitlistSubmission")

  try {
    console.log(`🗑️ Starting delete process for waitlist submission ID: ${id}`)

    // First, check if the entry exists
    const existingEntry = await sql`SELECT id FROM waitlist_submissions WHERE id = ${id}`
    if (existingEntry.length === 0) {
      console.log(`❌ Entry with ID ${id} not found`)
      return false
    }

    // Delete related referrals first (if tables exist)
    try {
      console.log(`🗑️ Deleting referrals for ID: ${id}`)
      await sql`DELETE FROM referrals WHERE referrer_id = ${id} OR referred_email = (SELECT email FROM waitlist_submissions WHERE id = ${id})`
      console.log(`✅ Deleted referrals for ID: ${id}`)
    } catch (e) {
      console.log("⚠️ referrals table might not exist or no referrals to delete, continuing...")
    }

    try {
      console.log(`🗑️ Deleting referral_details for ID: ${id}`)
      await sql`DELETE FROM referral_details WHERE referrer_id = ${id} OR referred_id = ${id}`
      console.log(`✅ Deleted referral_details for ID: ${id}`)
    } catch (e) {
      console.log("⚠️ referral_details table might not exist or no details to delete, continuing...")
    }

    // Now delete the main waitlist submission
    console.log(`🗑️ Deleting waitlist submission with ID: ${id}`)
    const deleteResult = await sql`DELETE FROM waitlist_submissions WHERE id = ${id}`

    console.log(`📊 Delete result:`, deleteResult)
    const success = deleteResult.count > 0

    if (success) {
      console.log(`✅ Successfully deleted waitlist submission with ID: ${id}`)
    } else {
      console.log(`❌ Failed to delete waitlist submission with ID: ${id} - no rows affected`)
    }

    return success
  } catch (error) {
    console.error(`❌ Error in deleteWaitlistSubmission for ID ${id}:`, error)

    // Try a simple delete as fallback
    try {
      console.log(`⚠️ Attempting simple delete fallback for ID: ${id}`)
      const fallbackResult = await sql`DELETE FROM waitlist_submissions WHERE id = ${id}`
      const fallbackSuccess = fallbackResult.count > 0
      console.log(`📊 Fallback delete result: ${fallbackSuccess}`)
      return fallbackSuccess
    } catch (fallbackError) {
      console.error(`❌ Fallback delete also failed for ID ${id}:`, fallbackError)
      return false
    }
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
    console.error("❌ Error fetching referrals:", error)
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
    console.error("❌ Error fetching detailed referrals:", error)
    return []
  }
}
