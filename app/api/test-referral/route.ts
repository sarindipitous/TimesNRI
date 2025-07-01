import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("=== REFERRAL SYSTEM TEST ===")

  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not configured",
      tests: [],
    })
  }

  const tests = []

  try {
    // Test 1: Check database connection
    console.log("🧪 Test 1: Database Connection")
    try {
      const connectionTest = await sql`SELECT NOW() as current_time`
      tests.push({
        name: "Database Connection",
        status: "PASS",
        details: `Connected at ${connectionTest[0].current_time}`,
      })
      console.log("✅ Database connection successful")
    } catch (error) {
      tests.push({
        name: "Database Connection",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ Database connection failed")
    }

    // Test 2: Check table structure
    console.log("🧪 Test 2: Table Structure")
    try {
      const tableCheck = await sql`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name IN ('waitlist_submissions', 'referrals', 'referral_details')
        ORDER BY table_name, ordinal_position
      `

      const tables = {}
      tableCheck.forEach((row) => {
        if (!tables[row.table_name]) tables[row.table_name] = []
        tables[row.table_name].push(`${row.column_name} (${row.data_type})`)
      })

      tests.push({
        name: "Table Structure",
        status: "PASS",
        details: tables,
      })
      console.log("✅ Table structure check passed")
    } catch (error) {
      tests.push({
        name: "Table Structure",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ Table structure check failed")
    }

    // Test 3: Check existing data
    console.log("🧪 Test 3: Existing Data")
    try {
      const dataCheck = await sql`
        SELECT 
          (SELECT COUNT(*) FROM waitlist_submissions) as waitlist_count,
          (SELECT COUNT(*) FROM waitlist_submissions WHERE referred_by IS NOT NULL) as referral_count,
          (SELECT COUNT(DISTINCT referred_by) FROM waitlist_submissions WHERE referred_by IS NOT NULL) as unique_referrers
      `

      tests.push({
        name: "Existing Data",
        status: "PASS",
        details: {
          total_submissions: dataCheck[0].waitlist_count,
          referral_submissions: dataCheck[0].referral_count,
          unique_referrers: dataCheck[0].unique_referrers,
        },
      })
      console.log("✅ Data check passed")
    } catch (error) {
      tests.push({
        name: "Existing Data",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ Data check failed")
    }

    // Test 4: Test referral flow simulation
    console.log("🧪 Test 4: Referral Flow Simulation")
    try {
      const testEmail1 = `test-referrer-${Date.now()}@example.com`
      const testEmail2 = `test-referred-${Date.now()}@example.com`

      // Create referrer
      const referrer = await sql`
        INSERT INTO waitlist_submissions (email, name, source)
        VALUES (${testEmail1}, 'Test Referrer', 'test')
        RETURNING *
      `

      // Create referred user
      const referred = await sql`
        INSERT INTO waitlist_submissions (email, name, source, referred_by)
        VALUES (${testEmail2}, 'Test Referred', 'test', ${testEmail1})
        RETURNING *
      `

      // Create referral record
      await sql`
        INSERT INTO referrals (referrer_id, referred_email, status)
        VALUES (${referrer[0].id}, ${testEmail2}, 'registered')
      `

      // Create detailed referral record
      await sql`
        INSERT INTO referral_details (referrer_id, referred_email, referred_id, status)
        VALUES (${referrer[0].id}, ${testEmail2}, ${referred[0].id}, 'registered')
      `

      // Verify the referral chain
      const verifyReferral = await sql`
        SELECT 
          ws1.email as referrer_email,
          ws2.email as referred_email,
          ws2.referred_by,
          r.status as referral_status
        FROM waitlist_submissions ws1
        JOIN referrals r ON ws1.id = r.referrer_id
        JOIN waitlist_submissions ws2 ON r.referred_email = ws2.email
        WHERE ws1.email = ${testEmail1}
      `

      tests.push({
        name: "Referral Flow Simulation",
        status: "PASS",
        details: {
          referrer_created: referrer[0].id,
          referred_created: referred[0].id,
          referral_chain_verified: verifyReferral.length > 0,
          referral_data: verifyReferral[0],
        },
      })

      // Clean up test data
      await sql`DELETE FROM referral_details WHERE referrer_id = ${referrer[0].id}`
      await sql`DELETE FROM referrals WHERE referrer_id = ${referrer[0].id}`
      await sql`DELETE FROM waitlist_submissions WHERE email IN (${testEmail1}, ${testEmail2})`

      console.log("✅ Referral flow simulation passed")
    } catch (error) {
      tests.push({
        name: "Referral Flow Simulation",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ Referral flow simulation failed")
    }

    // Test 5: API Endpoints
    console.log("🧪 Test 5: API Endpoints")
    try {
      // Test the waitlist API
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

      tests.push({
        name: "API Endpoints",
        status: "INFO",
        details: {
          waitlist_api: `${baseUrl}/api/waitlist`,
          dashboard_api: `${baseUrl}/api/dashboard-data`,
          test_note: "Test these URLs directly to verify API responses",
        },
      })
      console.log("✅ API endpoints listed")
    } catch (error) {
      tests.push({
        name: "API Endpoints",
        status: "FAIL",
        details: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ API endpoints test failed")
    }

    console.log("=== REFERRAL SYSTEM TEST COMPLETE ===")

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests,
      summary: {
        total_tests: tests.length,
        passed: tests.filter((t) => t.status === "PASS").length,
        failed: tests.filter((t) => t.status === "FAIL").length,
        info: tests.filter((t) => t.status === "INFO").length,
      },
    })
  } catch (error) {
    console.error("❌ Test suite error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      tests,
    })
  }
}

export async function POST() {
  console.log("=== REFERRAL SYSTEM RESET ===")

  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not configured",
    })
  }

  try {
    // Clean up test data
    await sql`DELETE FROM referral_details WHERE referrer_id IN (
      SELECT id FROM waitlist_submissions WHERE email LIKE 'test-%@example.com'
    )`

    await sql`DELETE FROM referrals WHERE referrer_id IN (
      SELECT id FROM waitlist_submissions WHERE email LIKE 'test-%@example.com'
    )`

    await sql`DELETE FROM waitlist_submissions WHERE email LIKE 'test-%@example.com'`

    return NextResponse.json({
      success: true,
      message: "Test data cleaned up successfully",
    })
  } catch (error) {
    console.error("❌ Cleanup error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
