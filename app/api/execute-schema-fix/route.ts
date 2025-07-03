import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  if (!hasDb) {
    return NextResponse.json({
      success: false,
      error: "Database not available - DATABASE_URL not configured",
    })
  }

  try {
    console.log("🔧 Starting campaign schema fix via API...")

    const results = []

    // Step 1: Check current schema
    console.log("📊 Checking current schema...")
    const currentSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'email_campaigns' 
      ORDER BY ordinal_position
    `

    results.push({
      step: "Check current schema",
      status: "completed",
      data: currentSchema.rows,
    })

    // Step 2: Add updated_at column if missing
    console.log("🔧 Adding updated_at column if missing...")
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'email_campaigns' AND column_name = 'updated_at'
    `

    if (columnCheck.length === 0) {
      await sql`
        ALTER TABLE email_campaigns 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `
      console.log("✅ Added updated_at column")
      results.push({
        step: "Add updated_at column",
        status: "added",
        message: "Added updated_at column to email_campaigns table",
      })
    } else {
      console.log("✅ updated_at column already exists")
      results.push({
        step: "Add updated_at column",
        status: "skipped",
        message: "updated_at column already exists",
      })
    }

    // Step 3: Update existing records
    console.log("🔧 Updating existing records...")
    const updateResult = await sql`
      UPDATE email_campaigns 
      SET updated_at = created_at 
      WHERE updated_at IS NULL
    `

    results.push({
      step: "Update existing records",
      status: "completed",
      message: `Updated ${updateResult.count} records with updated_at values`,
    })

    // Step 4: Create trigger function
    console.log("🔧 Creating trigger function...")
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
         NEW.updated_at = CURRENT_TIMESTAMP;
         RETURN NEW;
      END;
      $$ language 'plpgsql'
    `

    results.push({
      step: "Create trigger function",
      status: "completed",
      message: "Created update_updated_at_column function",
    })

    // Step 5: Create trigger
    console.log("🔧 Creating trigger...")
    await sql`DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns`
    await sql`
      CREATE TRIGGER update_email_campaigns_updated_at
         BEFORE UPDATE ON email_campaigns
         FOR EACH ROW
         EXECUTE FUNCTION update_updated_at_column()
    `

    results.push({
      step: "Create trigger",
      status: "completed",
      message: "Created trigger for auto-updating updated_at",
    })

    // Step 6: Ensure campaign logs table exists
    console.log("🔧 Ensuring campaign logs table...")
    await sql`
      CREATE TABLE IF NOT EXISTS email_campaign_logs (
          id SERIAL PRIMARY KEY,
          campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
          recipient_email VARCHAR(255) NOT NULL,
          recipient_name VARCHAR(255),
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          sent_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          email_service VARCHAR(50),
          external_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    results.push({
      step: "Ensure campaign logs table",
      status: "completed",
      message: "Ensured email_campaign_logs table exists",
    })

    // Step 7: Create indexes
    console.log("🔧 Creating indexes...")
    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON email_campaign_logs(campaign_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON email_campaign_logs(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_logs_recipient_email ON email_campaign_logs(recipient_email)`

    results.push({
      step: "Create indexes",
      status: "completed",
      message: "Created performance indexes",
    })

    // Step 8: Verify final schema
    console.log("📊 Verifying final schema...")
    const finalSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'email_campaigns' 
      ORDER BY ordinal_position
    `

    results.push({
      step: "Verify final schema",
      status: "completed",
      data: finalSchema.rows,
    })

    // Step 9: Check data integrity
    console.log("🔍 Checking data integrity...")
    const campaignCount = await sql`SELECT COUNT(*) as count FROM email_campaigns`
    const logsCount = await sql`SELECT COUNT(*) as count FROM email_campaign_logs`
    const missingUpdatedAt = await sql`SELECT COUNT(*) as count FROM email_campaigns WHERE updated_at IS NULL`

    results.push({
      step: "Data integrity check",
      status: "completed",
      data: {
        totalCampaigns: campaignCount.rows[0].count,
        totalLogs: logsCount.rows[0].count,
        missingUpdatedAt: missingUpdatedAt.rows[0].count,
      },
    })

    // Step 10: Check targeting issues
    console.log("🔍 Checking targeting issues...")
    const selectedCampaigns = await sql`
      SELECT id, name, target_type, selected_recipients, total_recipients, status
      FROM email_campaigns 
      WHERE target_type = 'selected'
    `

    const targetingAnalysis = selectedCampaigns.rows.map((campaign) => {
      let selectedEmails = campaign.selected_recipients
      const analysis = { campaignId: campaign.id, name: campaign.name, status: campaign.status }

      if (typeof selectedEmails === "string") {
        try {
          selectedEmails = JSON.parse(selectedEmails)
          analysis.selectedCount = Array.isArray(selectedEmails) ? selectedEmails.length : 0
          analysis.isValidArray = Array.isArray(selectedEmails)
        } catch (e) {
          analysis.error = "Invalid JSON in selected_recipients"
          analysis.isValidArray = false
        }
      } else if (Array.isArray(selectedEmails)) {
        analysis.selectedCount = selectedEmails.length
        analysis.isValidArray = true
      } else {
        analysis.error = "selected_recipients is not string or array"
        analysis.isValidArray = false
      }

      return analysis
    })

    results.push({
      step: "Targeting analysis",
      status: "completed",
      data: {
        selectedCampaignsCount: selectedCampaigns.rows.length,
        analysis: targetingAnalysis,
      },
    })

    console.log("🎉 Schema fix completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Campaign schema fix completed successfully",
      results,
      summary: {
        totalSteps: results.length,
        completedSteps: results.filter((r) => r.status === "completed").length,
        addedSteps: results.filter((r) => r.status === "added").length,
        skippedSteps: results.filter((r) => r.status === "skipped").length,
      },
    })
  } catch (error) {
    console.error("❌ Error fixing campaign schema:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fix campaign schema",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
