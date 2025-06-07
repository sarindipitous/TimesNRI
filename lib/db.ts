import { neon } from "@neondatabase/serverless"

// Initialize the Neon SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Type definitions for our database tables
export interface WaitlistSubmission {
  id: number
  email: string
  name?: string
  source?: string
  location?: string
  parent_location?: string
  care_needs?: string
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

// Database functions - CREATE operations
export async function addToWaitlist(
  email: string,
  source?: string,
  name?: string,
  location?: string,
  parent_location?: string,
  care_needs?: string,
): Promise<WaitlistSubmission | null> {
  try {
    console.log("DB: Adding to waitlist with params:", {
      email,
      source,
      name,
      location,
      parent_location,
      care_needs,
    })

    // Ensure email is not empty
    if (!email) {
      console.error("DB: Email is required")
      return null
    }

    // Test the database connection first
    try {
      const testResult = await sql`SELECT 1 as test`
      console.log("DB connection test result:", testResult)
    } catch (connError) {
      console.error("DB CONNECTION ERROR:", connError)
      throw new Error(
        `Database connection failed: ${connError instanceof Error ? connError.message : String(connError)}`,
      )
    }

    // Try a simpler query first to isolate the issue
    try {
      const simpleResult = await sql`INSERT INTO waitlist_submissions (email) VALUES (${email}) RETURNING id`
      console.log("Simple insert result:", simpleResult)

      // If simple insert works, update with the rest of the data
      if (simpleResult && simpleResult.length > 0) {
        const id = simpleResult[0].id
        const updateResult = await sql`
          UPDATE waitlist_submissions 
          SET 
            source = COALESCE(${source}, source),
            name = COALESCE(${name}, name),
            location = COALESCE(${location}, location),
            parent_location = COALESCE(${parent_location}, parent_location),
            care_needs = COALESCE(${care_needs}, care_needs)
          WHERE id = ${id}
          RETURNING *
        `

        console.log("Update result:", updateResult)
        return updateResult[0] as WaitlistSubmission
      }
    } catch (simpleError) {
      console.error("SIMPLE INSERT ERROR:", simpleError)
      // Continue to try the original query
    }

    // If simple approach fails, try the original query
    console.log("Trying original query approach")
    const result = await sql`
      INSERT INTO waitlist_submissions (email, source, name, location, parent_location, care_needs)
      VALUES (${email}, ${source}, ${name}, ${location}, ${parent_location}, ${care_needs})
      ON CONFLICT (email) 
      DO UPDATE SET 
        source = COALESCE(${source}, waitlist_submissions.source),
        name = COALESCE(${name}, waitlist_submissions.name),
        location = COALESCE(${location}, waitlist_submissions.location),
        parent_location = COALESCE(${parent_location}, waitlist_submissions.parent_location),
        care_needs = COALESCE(${care_needs}, waitlist_submissions.care_needs)
      RETURNING *
    `

    console.log("Original query result:", result)

    if (!result || result.length === 0) {
      console.error("DB: No result returned from query")
      return null
    }

    return result[0] as WaitlistSubmission
  } catch (error) {
    console.error("DB Error adding to waitlist:", error)
    // Rethrow with more details
    throw new Error(`Database error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function addReferral(referrerId: number, referredEmail: string): Promise<Referral | null> {
  try {
    const result = await sql`
      INSERT INTO referrals (referrer_id, referred_email)
      VALUES (${referrerId}, ${referredEmail})
      RETURNING *
    `
    return result[0] as Referral
  } catch (error) {
    console.error("Error adding referral:", error)
    return null
  }
}

export async function addDetailedReferral(
  referrerId: number,
  referredEmail: string,
  referredId?: number,
): Promise<ReferralDetail | null> {
  try {
    const result = await sql`
      INSERT INTO referral_details (referrer_id, referred_email, referred_id)
      VALUES (${referrerId}, ${referredEmail}, ${referredId})
      RETURNING *
    `
    return result[0] as ReferralDetail
  } catch (error) {
    console.error("Error adding detailed referral:", error)
    return null
  }
}

// Database functions - READ operations
export async function getWaitlistSubmissionByEmail(email: string): Promise<WaitlistSubmission | null> {
  try {
    const result = await sql`
      SELECT * FROM waitlist_submissions
      WHERE email = ${email}
    `
    return (result[0] as WaitlistSubmission) || null
  } catch (error) {
    console.error("Error getting waitlist submission:", error)
    return null
  }
}

export async function getWaitlistSubmissionById(id: number): Promise<WaitlistSubmission | null> {
  try {
    const result = await sql`
      SELECT * FROM waitlist_submissions
      WHERE id = ${id}
    `
    return (result[0] as WaitlistSubmission) || null
  } catch (error) {
    console.error("Error getting waitlist submission by ID:", error)
    return null
  }
}

export async function getAllWaitlistSubmissions(limit = 100, offset = 0): Promise<WaitlistSubmission[]> {
  try {
    const result = await sql`
      SELECT * FROM waitlist_submissions
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result as WaitlistSubmission[]
  } catch (error) {
    console.error("Error getting all waitlist submissions:", error)
    return []
  }
}

export async function getReferralsByReferrerId(referrerId: number): Promise<Referral[]> {
  try {
    const result = await sql`
      SELECT * FROM referrals
      WHERE referrer_id = ${referrerId}
      ORDER BY created_at DESC
    `
    return result as Referral[]
  } catch (error) {
    console.error("Error getting referrals:", error)
    return []
  }
}

export async function getDetailedReferralsByReferrerId(referrerId: number): Promise<ReferralDetail[]> {
  try {
    const result = await sql`
      SELECT rd.*, ws.name as referred_name
      FROM referral_details rd
      LEFT JOIN waitlist_submissions ws ON rd.referred_id = ws.id
      WHERE rd.referrer_id = ${referrerId}
      ORDER BY rd.created_at DESC
    `
    return result as ReferralDetail[]
  } catch (error) {
    console.error("Error getting detailed referrals:", error)
    return []
  }
}

export async function getWaitlistStats(): Promise<{ total: number; lastWeek: number }> {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_week
      FROM waitlist_submissions
    `
    return {
      total: Number.parseInt(result[0].total as string),
      lastWeek: Number.parseInt(result[0].last_week as string),
    }
  } catch (error) {
    console.error("Error getting waitlist stats:", error)
    return { total: 0, lastWeek: 0 }
  }
}

// Database functions - UPDATE operations
export async function updateWaitlistSubmission(
  id: number,
  data: Partial<WaitlistSubmission>,
): Promise<WaitlistSubmission | null> {
  try {
    // Build dynamic SET clause
    const setClause = Object.entries(data)
      .filter(([key]) => key !== "id" && key !== "created_at")
      .map(([key, value]) => `${key} = ${value === null ? "NULL" : `'${value}'`}`)
      .join(", ")

    if (!setClause) return null

    // Execute the update query
    const result = await sql`
      UPDATE waitlist_submissions
      SET ${sql.raw(setClause)}
      WHERE id = ${id}
      RETURNING *
    `

    return result[0] as WaitlistSubmission
  } catch (error) {
    console.error("Error updating waitlist submission:", error)
    return null
  }
}

export async function updateReferralStatus(
  id: number,
  status: "pending" | "registered" | "converted",
): Promise<Referral | null> {
  try {
    const result = await sql`
      UPDATE referrals
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] as Referral
  } catch (error) {
    console.error("Error updating referral status:", error)
    return null
  }
}

export async function updateDetailedReferralStatus(
  id: number,
  status: "pending" | "registered" | "converted",
  referred_id?: number,
): Promise<ReferralDetail | null> {
  try {
    const result = await sql`
      UPDATE referral_details
      SET 
        status = ${status},
        referred_id = ${referred_id}
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] as ReferralDetail
  } catch (error) {
    console.error("Error updating detailed referral status:", error)
    return null
  }
}

// Database functions - DELETE operations
export async function deleteWaitlistSubmission(id: number): Promise<boolean> {
  try {
    // First delete any referrals associated with this submission
    await sql`
      DELETE FROM referrals
      WHERE referrer_id = ${id}
    `

    await sql`
      DELETE FROM referral_details
      WHERE referrer_id = ${id} OR referred_id = ${id}
    `

    // Then delete the submission itself
    const result = await sql`
      DELETE FROM waitlist_submissions
      WHERE id = ${id}
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error("Error deleting waitlist submission:", error)
    return false
  }
}

export async function deleteReferral(id: number): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM referrals
      WHERE id = ${id}
      RETURNING id
    `
    return result.length > 0
  } catch (error) {
    console.error("Error deleting referral:", error)
    return false
  }
}

export async function deleteDetailedReferral(id: number): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM referral_details
      WHERE id = ${id}
      RETURNING id
    `
    return result.length > 0
  } catch (error) {
    console.error("Error deleting detailed referral:", error)
    return false
  }
}

// Search and filtering functions
export async function searchWaitlistByEmail(emailQuery: string, limit = 20): Promise<WaitlistSubmission[]> {
  try {
    const result = await sql`
      SELECT * FROM waitlist_submissions
      WHERE email ILIKE ${"%" + emailQuery + "%"}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result as WaitlistSubmission[]
  } catch (error) {
    console.error("Error searching waitlist by email:", error)
    return []
  }
}

export async function filterWaitlistByLocation(location: string, limit = 100): Promise<WaitlistSubmission[]> {
  try {
    const result = await sql`
      SELECT * FROM waitlist_submissions
      WHERE location = ${location}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result as WaitlistSubmission[]
  } catch (error) {
    console.error("Error filtering waitlist by location:", error)
    return []
  }
}

export async function filterWaitlistByParentLocation(
  parentLocation: string,
  limit = 100,
): Promise<WaitlistSubmission[]> {
  try {
    const result = await sql`
      SELECT * FROM waitlist_submissions
      WHERE parent_location = ${parentLocation}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result as WaitlistSubmission[]
  } catch (error) {
    console.error("Error filtering waitlist by parent location:", error)
    return []
  }
}
