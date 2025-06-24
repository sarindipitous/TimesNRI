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

    return result[0] as WaitlistSubmission
  } catch (e) {
    console.error("addToWaitlist error", e)

    // If the error is about missing columns, try the fallback approach
    if (e instanceof Error && e.message.includes("column") && e.message.includes("does not exist")) {
      console.log("Attempting fallback approach without new columns...")
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
        return fallbackResult[0] as WaitlistSubmission
      } catch (fallbackError) {
        console.error("Fallback approach also failed", fallbackError)
        return null
      }
    }

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

// ──────────────────────────────────────────────────────────────────────────────
//  READ helpers
// ──────────────────────────────────────────────────────────────────────────────
export async function getWaitlistSubmissionByEmail(email: string) {
  if (!hasDb) return noDb(null, "getWaitlistSubmissionByEmail")
  const res = await sql`SELECT * FROM waitlist_submissions WHERE email = ${email} LIMIT 1`
  return (res[0] as WaitlistSubmission) || null
}

export async function getAllWaitlistSubmissions(limit = 100, offset = 0) {
  if (!hasDb) return noDb([], "getAllWaitlistSubmissions")
  return (await sql`
    SELECT * FROM waitlist_submissions
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}`) as WaitlistSubmission[]
}

export async function getWaitlistStats() {
  if (!hasDb) return noDb({ total: 0, lastWeek: 0 }, "getWaitlistStats")
  const res = await sql`
    SELECT
      COUNT(*)                        AS total,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS last_week
    FROM waitlist_submissions`
  return { total: Number(res[0].total), lastWeek: Number(res[0].last_week) }
}

// ──────────────────────────────────────────────────────────────────────────────
//  UPDATE helpers
// ──────────────────────────────────────────────────────────────────────────────
export async function updateWaitlistSubmission(
  id: number,
  data: Partial<WaitlistSubmission>,
): Promise<WaitlistSubmission | null> {
  if (!hasDb) return noDb(null, "updateWaitlistSubmission")

  const entries = Object.entries(data).filter(([k]) => k !== "id" && k !== "created_at")
  if (!entries.length) return null

  const set = entries.map(([k, v]) => sql`${sql.identifier([k])} = ${v}`).reduce((a, b) => sql`${a}, ${b}`)

  const res = await sql`UPDATE waitlist_submissions SET ${set} WHERE id = ${id} RETURNING *`
  return res[0] as WaitlistSubmission
}

// ──────────────────────────────────────────────────────────────────────────────
//  DELETE helpers
// ──────────────────────────────────────────────────────────────────────────────
export async function deleteWaitlistSubmission(id: number): Promise<boolean> {
  if (!hasDb) return noDb(false, "deleteWaitlistSubmission")
  const res = await sql`DELETE FROM waitlist_submissions WHERE id = ${id}`
  return res.count > 0
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
  return (await sql`
    SELECT * FROM referrals 
    WHERE referrer_id = ${referrerId}
    ORDER BY created_at DESC`) as Referral[]
}

export async function getDetailedReferralsByReferrerId(referrerId: number) {
  if (!hasDb) return noDb([], "getDetailedReferralsByReferrerId")
  return (await sql`
    SELECT * FROM referral_details 
    WHERE referrer_id = ${referrerId}
    ORDER BY created_at DESC`) as ReferralDetail[]
}
