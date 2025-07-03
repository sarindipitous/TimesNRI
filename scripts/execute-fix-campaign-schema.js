import { sql } from "@vercel/postgres"

async function fixCampaignSchema() {
  console.log("🔧 Starting campaign schema fix...")

  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    console.log("📊 Checking current schema...")

    // Check current email_campaigns table structure
    const currentSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'email_campaigns' 
      ORDER BY ordinal_position
    `

    console.log("Current email_campaigns schema:")
    currentSchema.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })

    // Fix 1: Add updated_at column if it doesn't exist
    console.log("\n🔧 Adding updated_at column if missing...")

    const hasUpdatedAt = currentSchema.rows.some((row) => row.column_name === "updated_at")

    if (!hasUpdatedAt) {
      await sql`
        ALTER TABLE email_campaigns 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `
      console.log("✅ Added updated_at column")
    } else {
      console.log("✅ updated_at column already exists")
    }

    // Fix 2: Update existing records to have updated_at value
    console.log("\n🔧 Updating existing records with updated_at values...")

    const updateResult = await sql`
      UPDATE email_campaigns 
      SET updated_at = created_at 
      WHERE updated_at IS NULL
    `
    console.log(`✅ Updated ${updateResult.count} records with updated_at values`)

    // Fix 3: Create or replace the trigger function
    console.log("\n🔧 Creating trigger function for auto-updating updated_at...")

    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
         NEW.updated_at = CURRENT_TIMESTAMP;
         RETURN NEW;
      END;
      $$ language 'plpgsql'
    `
    console.log("✅ Created trigger function")

    // Fix 4: Drop and recreate trigger
    console.log("\n🔧 Setting up trigger for updated_at...")

    await sql`DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns`

    await sql`
      CREATE TRIGGER update_email_campaigns_updated_at
         BEFORE UPDATE ON email_campaigns
         FOR EACH ROW
         EXECUTE FUNCTION update_updated_at_column()
    `
    console.log("✅ Created trigger for auto-updating updated_at")

    // Fix 5: Ensure email_campaign_logs table exists with proper structure
    console.log("\n🔧 Ensuring email_campaign_logs table exists...")

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
    console.log("✅ Ensured email_campaign_logs table exists")

    // Fix 6: Create indexes for performance
    console.log("\n🔧 Creating performance indexes...")

    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON email_campaign_logs(campaign_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON email_campaign_logs(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_logs_recipient_email ON email_campaign_logs(recipient_email)`

    console.log("✅ Created performance indexes")

    // Fix 7: Verify the final schema
    console.log("\n📊 Verifying final schema...")

    const finalSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'email_campaigns' 
      ORDER BY ordinal_position
    `

    console.log("Final email_campaigns schema:")
    finalSchema.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })

    // Fix 8: Check campaign logs table
    const logsSchema = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'email_campaign_logs' 
      ORDER BY ordinal_position
    `

    console.log("\nFinal email_campaign_logs schema:")
    logsSchema.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })

    // Fix 9: Test the schema by checking existing campaigns
    console.log("\n📊 Testing schema with existing campaigns...")

    const campaignCount = await sql`SELECT COUNT(*) as count FROM email_campaigns`
    console.log(`Found ${campaignCount.rows[0].count} existing campaigns`)

    const logsCount = await sql`SELECT COUNT(*) as count FROM email_campaign_logs`
    console.log(`Found ${logsCount.rows[0].count} existing campaign logs`)

    // Fix 10: Validate data integrity
    console.log("\n🔍 Validating data integrity...")

    const campaignsWithoutUpdatedAt = await sql`
      SELECT COUNT(*) as count FROM email_campaigns WHERE updated_at IS NULL
    `

    if (campaignsWithoutUpdatedAt.rows[0].count > 0) {
      console.log(`⚠️  Warning: ${campaignsWithoutUpdatedAt.rows[0].count} campaigns still missing updated_at`)
    } else {
      console.log("✅ All campaigns have updated_at values")
    }

    // Fix 11: Check for any campaigns with targeting issues
    console.log("\n🔍 Checking for potential targeting issues...")

    const selectedCampaigns = await sql`
      SELECT id, name, target_type, selected_recipients, total_recipients, status
      FROM email_campaigns 
      WHERE target_type = 'selected'
    `

    console.log(`Found ${selectedCampaigns.rows.length} campaigns with 'selected' targeting`)

    for (const campaign of selectedCampaigns.rows) {
      let selectedEmails = campaign.selected_recipients

      // Handle JSON parsing
      if (typeof selectedEmails === "string") {
        try {
          selectedEmails = JSON.parse(selectedEmails)
        } catch (e) {
          console.log(`⚠️  Campaign ${campaign.id} has invalid selected_recipients JSON`)
          continue
        }
      }

      if (Array.isArray(selectedEmails)) {
        console.log(
          `  Campaign ${campaign.id} (${campaign.name}): ${selectedEmails.length} selected recipients, status: ${campaign.status}`,
        )
      } else {
        console.log(`⚠️  Campaign ${campaign.id} selected_recipients is not an array:`, typeof selectedEmails)
      }
    }

    console.log("\n🎉 Campaign schema fix completed successfully!")
    console.log("\n📋 Summary of changes:")
    console.log("  ✅ Added updated_at column to email_campaigns")
    console.log("  ✅ Updated existing records with updated_at values")
    console.log("  ✅ Created trigger for auto-updating updated_at")
    console.log("  ✅ Ensured email_campaign_logs table exists")
    console.log("  ✅ Created performance indexes")
    console.log("  ✅ Validated data integrity")
    console.log("  ✅ Checked for targeting issues")

    return {
      success: true,
      message: "Campaign schema fix completed successfully",
      details: {
        campaignCount: campaignCount.rows[0].count,
        logsCount: logsCount.rows[0].count,
        selectedCampaigns: selectedCampaigns.rows.length,
        updatedRecords: updateResult.count,
      },
    }
  } catch (error) {
    console.error("❌ Error fixing campaign schema:", error)
    throw error
  }
}

// Execute the fix
fixCampaignSchema()
  .then((result) => {
    console.log("\n✅ Schema fix completed:", result)
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Schema fix failed:", error)
    process.exit(1)
  })
