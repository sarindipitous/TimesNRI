import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL?.trim()
export const hasDb = Boolean(databaseUrl)

function createNoOpClient() {
  return async () => {
    throw new Error(
      `DATABASE_URL is not set.  
Add it in Vercel → Project Settings → Environment Variables (or .env locally) and redeploy.`,
    )
  }
}

export const sql: ReturnType<typeof neon> = hasDb
  ? neon(databaseUrl!)
  : (createNoOpClient() as unknown as ReturnType<typeof neon>)

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

function noDb<T>(fallback: T, fnName: string): T {
  console.warn(`[lib/db] ${fnName} skipped – DATABASE_URL not set. Returning fallback.`)
  return fallback
}

export async function getAllWaitlistSubmissions(limit = 1000, offset = 0) {
  if (!hasDb) return noDb([], "getAllWaitlistSubmissions")

  try {
    console.log(`Fetching waitlist submissions with limit: ${limit}, offset: ${offset}`)

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
    console.log("Adding to waitlist:", {
      email,
      source,
      name,
      location,
      parent_location,
      care_needs,
      care_plan,
      care_plan_interest,
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

    console.log("Insert result:", result[0])
    return result[0] as WaitlistSubmission
  } catch (e) {
    console.error("addToWaitlist error", e)

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

export async function updateWaitlistSubmission(
  id: number,
  data: Partial<WaitlistSubmission>,
): Promise<WaitlistSubmission | null> {
  if (!hasDb) return noDb(null, "updateWaitlistSubmission")

  const entries = Object.entries(data).filter(([k]) => k !== "id" && k !== "created_at" && k !== "referred_by")
  if (!entries.length) return null

  try {
    const set = entries.map(([k, v]) => sql`${sql.identifier([k])} = ${v}`).reduce((a, b) => sql`${a}, ${b}`)
    const res = await sql`UPDATE waitlist_submissions SET ${set} WHERE id = ${id} RETURNING *`
    return res[0] as WaitlistSubmission
  } catch (e) {
    console.error("Full update failed, trying fallback:", e)

    if (e instanceof Error && e.message.includes("column") && e.message.includes("does not exist")) {
      console.log("Attempting fallback update without new columns...")
      try {
        const fallbackEntries = entries.filter(([k]) => !["care_plan", "care_plan_interest"].includes(k))

        if (fallbackEntries.length === 0) {
          console.log("No valid columns to update in fallback")
          return null
        }

        const fallbackSet = fallbackEntries
          .map(([k, v]) => sql`${sql.identifier([k])} = ${v}`)
          .reduce((a, b) => sql`${a}, ${b}`)

        const fallbackRes = await sql`UPDATE waitlist_submissions SET ${fallbackSet} WHERE id = ${id} RETURNING *`
        return fallbackRes[0] as WaitlistSubmission
      } catch (fallbackError) {
        console.error("Fallback update also failed", fallbackError)
        return null
      }
    }

    return null
  }
}

export async function deleteWaitlistSubmission(id: number): Promise<boolean> {
  if (!hasDb) return noDb(false, "deleteWaitlistSubmission")

  try {
    await sql`BEGIN`

    try {
      await sql`DELETE FROM referrals WHERE referrer_id = ${id}`
    } catch (e) {
      console.log("referrals table might not exist, continuing...")
    }

    try {
      await sql`DELETE FROM referral_details WHERE referrer_id = ${id}`
    } catch (e) {
      console.log("referral_details table might not exist, continuing...")
    }

    try {
      await sql`DELETE FROM referral_details WHERE referred_id = ${id}`
    } catch (e) {
      console.log("referral_details table might not exist, continuing...")
    }

    const res = await sql`DELETE FROM waitlist_submissions WHERE id = ${id}`

    await sql`COMMIT`

    return res.count > 0
  } catch (error) {
    try {
      await sql`ROLLBACK`
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError)
    }
    console.error("Error in deleteWaitlistSubmission:", error)
    throw error
  }
}

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
