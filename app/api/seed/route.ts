import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// List of sample locations
const locations = ["us", "canada", "uk", "australia", "singapore", "uae", "other"]
const parentLocations = ["delhi", "mumbai", "bangalore", "hyderabad", "pune", "chennai", "other"]
const careNeeds = ["regular", "medical", "daily", "emergency", "all"]
const sources = ["hero-section", "floating-cta", "detailed-form", "header-cta"]

// Generate a random name
function generateName(): string {
  const firstNames = [
    "Raj",
    "Priya",
    "Vikram",
    "Neha",
    "Arjun",
    "Ananya",
    "Sanjay",
    "Meera",
    "Aditya",
    "Kavita",
    "Rahul",
    "Divya",
    "Amit",
    "Sunita",
    "Vijay",
    "Pooja",
  ]

  const lastNames = [
    "Sharma",
    "Patel",
    "Singh",
    "Mehta",
    "Verma",
    "Gupta",
    "Joshi",
    "Malhotra",
    "Kumar",
    "Agarwal",
    "Reddy",
    "Nair",
    "Iyer",
    "Kapoor",
    "Bhatia",
    "Chauhan",
  ]

  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
}

// Generate a random email
function generateEmail(name: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]
  const nameParts = name.toLowerCase().split(" ")
  const domain = domains[Math.floor(Math.random() * domains.length)]

  // Add a random number to ensure uniqueness
  const randomNum = Math.floor(Math.random() * 1000)

  return `${nameParts.join(".")}${randomNum}@${domain}`
}

// Generate a random date within the last 30 days
function generateDate(): Date {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  now.setDate(now.getDate() - daysAgo)
  return now
}

// Generate a random waitlist entry
function generateWaitlistEntry() {
  const name = generateName()
  return {
    name,
    email: generateEmail(name),
    location: locations[Math.floor(Math.random() * locations.length)],
    parent_location: parentLocations[Math.floor(Math.random() * parentLocations.length)],
    care_needs: careNeeds[Math.floor(Math.random() * careNeeds.length)],
    source: sources[Math.floor(Math.random() * sources.length)],
    created_at: generateDate(),
  }
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const count = Number.parseInt(searchParams.get("count") || "10")

    // Limit to a reasonable number
    const numEntries = Math.min(Math.max(count, 1), 100)

    // Generate entries
    const entries = Array.from({ length: numEntries }, generateWaitlistEntry)

    // Insert entries
    const insertedEntries = []
    const referrals = []

    for (const entry of entries) {
      try {
        // Insert the waitlist entry
        const result = await sql`
          INSERT INTO waitlist_submissions (name, email, location, parent_location, care_needs, source, created_at)
          VALUES (${entry.name}, ${entry.email}, ${entry.location}, ${entry.parent_location}, ${entry.care_needs}, ${entry.source}, ${entry.created_at})
          RETURNING *
        `

        if (result && result.length > 0) {
          insertedEntries.push(result[0])

          // Randomly create referrals (30% chance)
          if (Math.random() < 0.3) {
            // Pick 1-3 random other entries as referrals
            const numReferrals = Math.floor(Math.random() * 3) + 1

            for (let i = 0; i < numReferrals; i++) {
              // Get a random entry that's not the current one
              const otherEntries = insertedEntries.filter((e) => e.id !== result[0].id)

              if (otherEntries.length > 0) {
                const referredEntry = otherEntries[Math.floor(Math.random() * otherEntries.length)]

                // Add referral
                const referralResult = await sql`
                  INSERT INTO referrals (referrer_id, referred_email, status)
                  VALUES (${result[0].id}, ${referredEntry.email}, 'pending')
                  RETURNING *
                `

                // Add detailed referral
                await sql`
                  INSERT INTO referral_details (referrer_id, referred_email, referred_id, status)
                  VALUES (${result[0].id}, ${referredEntry.email}, ${referredEntry.id}, 'pending')
                `

                if (referralResult && referralResult.length > 0) {
                  referrals.push(referralResult[0])
                }
              }
            }
          }
        }
      } catch (entryError) {
        console.error("Error inserting entry:", entryError)
        // Continue with other entries
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded database with ${insertedEntries.length} entries and ${referrals.length} referrals`,
      insertedCount: insertedEntries.length,
      referralCount: referrals.length,
    })
  } catch (error) {
    console.error("Database seeding failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Database seeding failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
