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
         WHERE table_schema = 'public' AND table_name = 'blog_posts'
       ) AS table_exists`

    if (!table_exists) {
      return NextResponse.json({
        success: false,
        error: 'Table "blog_posts" does not exist in this database.',
        needsSetup: true,
      })
    }

    /* ----------------------- check for required columns ---------------------- */
    const requiredColumns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'blog_posts'
        AND column_name IN ('featured', 'display_order')
      ORDER BY column_name
    `

    const hasFeatureColumn = requiredColumns.some((col) => col.column_name === "featured")
    const hasOrderColumn = requiredColumns.some((col) => col.column_name === "display_order")

    /* ------------------------------ list all columns ---------------------------- */
    const allColumns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'blog_posts'
      ORDER BY ordinal_position
    `

    /* ---------------------------- sample records --------------------------- */
    let sample: unknown[] = []
    try {
      const raw = await sql`SELECT * FROM blog_posts
                             ORDER BY created_at DESC LIMIT 3`
      sample = raw.map(toJsonSafe)
    } catch (e) {
      sample = [`Sample query failed: ${(e as Error).message}`]
    }

    return NextResponse.json({
      success: true,
      tableExists: table_exists,
      hasFeatureColumn,
      hasOrderColumn,
      needsUpdate: !hasFeatureColumn || !hasOrderColumn,
      requiredColumns: requiredColumns.map(toJsonSafe),
      allColumns: allColumns.map(toJsonSafe),
      sample,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("check-blog-schema route failed →", err)
    const message =
      typeof err === "string" ? err : err instanceof Error ? err.message || err.toString() : JSON.stringify(err)

    return NextResponse.json({
      success: false,
      error: message,
    })
  }
}
