"use server"

import { sql, hasDb } from "@/lib/db"
import { NextResponse } from "next/server"

/**
 * Helper – ensures every value in an object is JSON-serialisable
 */
function toJsonSafe<T extends Record<string, unknown>>(row: T) {
  const safe: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      safe[key] = null
    } else if (typeof value === "bigint") {
      safe[key] = value.toString()
    } else if (value instanceof Date) {
      safe[key] = value.toISOString()
    } else {
      safe[key] = value
    }
  }
  return safe
}

export async function GET() {
  try {
    /* --------------------------- no database present --------------------------- */
    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error:
          "DATABASE_URL is not set for this environment. Add it in Vercel → Project Settings → Environment Variables (or .env locally) and redeploy.",
      })
    }
    /* ----------------------------- table exists? ---------------------------- */
    const [{ table_exists }] = await sql<{ table_exists: boolean }[]>`SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'waitlist_submissions'
       ) AS table_exists`

    if (!table_exists) {
      return NextResponse.json({
        success: false,
        error: 'Table "waitlist_submissions" does not exist in this database.',
      })
    }

    /* ------------------------------ list columns ---------------------------- */
    let columns: unknown[] = []
    try {
      columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'waitlist_submissions'
        ORDER BY ordinal_position
      `
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: `Could not fetch columns – ${(e as Error).message}`,
      })
    }

    /* ---------------------------- sample records --------------------------- */
    let sample: unknown[] = []
    try {
      const raw = await sql`SELECT * FROM waitlist_submissions
                             ORDER BY created_at DESC LIMIT 3`
      sample = raw.map(toJsonSafe)
    } catch (e) {
      // It is OK if this fails – we still return the column list
      sample = [`Sample query failed: ${(e as Error).message}`]
    }

    return NextResponse.json({
      success: true,
      columns,
      sample,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    /* --------- make absolutely sure the thrown value is serialisable ---------- */
    console.error("check-schema route failed →", err)
    const message =
      typeof err === "string" ? err : err instanceof Error ? err.message || err.toString() : JSON.stringify(err)

    return NextResponse.json({
      success: false,
      error: message,
    })
  }
}
