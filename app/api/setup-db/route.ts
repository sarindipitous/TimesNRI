import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Check if tables exist
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'waitlist_submissions'
      ) as waitlist_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'referrals'
      ) as referrals_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'referral_details'
      ) as referral_details_exists
    `

    const waitlistExists = tablesExist[0]?.waitlist_exists
    const referralsExists = tablesExist[0]?.referrals_exists
    const referralDetailsExists = tablesExist[0]?.referral_details_exists

    const results = {
      waitlist_submissions: { existed: waitlistExists, created: false },
      referrals: { existed: referralsExists, created: false },
      referral_details: { existed: referralDetailsExists, created: false },
    }

    // Create waitlist_submissions table if it doesn't exist
    if (!waitlistExists) {
      await sql`
        CREATE TABLE waitlist_submissions (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255),
          source VARCHAR(100),
          location VARCHAR(100),
          parent_location VARCHAR(100),
          care_needs VARCHAR(100),
          waitlist_number INT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `
      results.waitlist_submissions.created = true
    }

    // Create referrals table if it doesn't exist
    if (!referralsExists) {
      await sql`
        CREATE TABLE referrals (
          id SERIAL PRIMARY KEY,
          referrer_id INT NOT NULL REFERENCES waitlist_submissions(id) ON DELETE CASCADE,
          referred_email VARCHAR(255) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `
      results.referrals.created = true
    }

    // Create referral_details table if it doesn't exist
    if (!referralDetailsExists) {
      await sql`
        CREATE TABLE referral_details (
          id SERIAL PRIMARY KEY,
          referrer_id INT NOT NULL REFERENCES waitlist_submissions(id) ON DELETE CASCADE,
          referred_email VARCHAR(255) NOT NULL,
          referred_id INT REFERENCES waitlist_submissions(id) ON DELETE SET NULL,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `
      results.referral_details.created = true
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed",
      results,
    })
  } catch (error) {
    console.error("Database setup failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Database setup failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
