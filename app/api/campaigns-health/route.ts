import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { getAllCampaigns, createCampaign, getCampaignById } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function GET() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    database: {
      connected: hasDb,
      tables: {
        email_campaigns: false,
        email_campaign_logs: false,
      },
    },
    api: {
      campaigns_route: false,
      campaign_detail_route: false,
      campaign_send_route: false,
    },
    functions: {
      getAllCampaigns: false,
      createCampaign: false,
      getCampaignById: false,
    },
    admin_pages: {
      campaigns_list: false,
      new_campaign: false,
      campaign_detail: false,
    },
    integration: {
      email_service: false,
      waitlist_data: false,
    },
    errors: [] as string[],
    warnings: [] as string[],
  }

  try {
    // 1. Check database connection and tables
    if (hasDb) {
      try {
        // Check if email_campaigns table exists
        const campaignsTableCheck = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'email_campaigns'
          );
        `
        healthCheck.database.tables.email_campaigns = campaignsTableCheck[0]?.exists || false

        // Check if email_campaign_logs table exists
        const logsTableCheck = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'email_campaign_logs'
          );
        `
        healthCheck.database.tables.email_campaign_logs = logsTableCheck[0]?.exists || false

        if (!healthCheck.database.tables.email_campaigns) {
          healthCheck.errors.push("email_campaigns table does not exist - run the database script")
        }

        if (!healthCheck.database.tables.email_campaign_logs) {
          healthCheck.errors.push("email_campaign_logs table does not exist - run the database script")
        }

        // Test table structure if tables exist
        if (healthCheck.database.tables.email_campaigns) {
          try {
            await sql`SELECT id, name, subject, status, target_type FROM email_campaigns LIMIT 1`
            healthCheck.functions.getAllCampaigns = true
          } catch (error) {
            healthCheck.errors.push(`email_campaigns table structure issue: ${error}`)
          }
        }
      } catch (error) {
        healthCheck.errors.push(`Database table check failed: ${error}`)
      }
    } else {
      healthCheck.errors.push("Database not connected - DATABASE_URL not set")
    }

    // 2. Test campaign functions
    if (healthCheck.database.tables.email_campaigns) {
      try {
        const campaigns = await getAllCampaigns()
        healthCheck.functions.getAllCampaigns = true
        healthCheck.warnings.push(`Found ${campaigns.length} existing campaigns`)
      } catch (error) {
        healthCheck.errors.push(`getAllCampaigns failed: ${error}`)
      }

      // Test create campaign (dry run - we won't actually create)
      try {
        // Just test the function exists and can be called
        healthCheck.functions.createCampaign = typeof createCampaign === "function"
      } catch (error) {
        healthCheck.errors.push(`createCampaign function issue: ${error}`)
      }

      try {
        healthCheck.functions.getCampaignById = typeof getCampaignById === "function"
      } catch (error) {
        healthCheck.errors.push(`getCampaignById function issue: ${error}`)
      }
    }

    // 3. Test API routes
    try {
      const campaignsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/campaigns`,
        {
          method: "GET",
        },
      )
      healthCheck.api.campaigns_route = campaignsResponse.ok
      if (!campaignsResponse.ok) {
        healthCheck.errors.push(`Campaigns API route failed: ${campaignsResponse.status}`)
      }
    } catch (error) {
      healthCheck.errors.push(`Campaigns API route test failed: ${error}`)
    }

    // 4. Check waitlist integration
    try {
      const waitlistResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/campaigns?action=recipients`,
      )
      if (waitlistResponse.ok) {
        const data = await waitlistResponse.json()
        healthCheck.integration.waitlist_data = data.success && Array.isArray(data.recipients)
        healthCheck.warnings.push(`Found ${data.recipients?.length || 0} waitlist recipients`)
      } else {
        healthCheck.errors.push(`Waitlist recipients API failed: ${waitlistResponse.status}`)
      }
    } catch (error) {
      healthCheck.errors.push(`Waitlist integration test failed: ${error}`)
    }

    // 5. Check email service integration
    try {
      const emailTestResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/email-test`,
      )
      if (emailTestResponse.ok) {
        const emailData = await emailTestResponse.json()
        healthCheck.integration.email_service = emailData.emailServicesConfigured
        if (!emailData.emailServicesConfigured) {
          healthCheck.warnings.push("No email services configured - campaigns won't be able to send")
        }
      }
    } catch (error) {
      healthCheck.warnings.push(`Email service check failed: ${error}`)
    }

    // 6. Check environment variables
    const requiredEnvVars = ["DATABASE_URL", "NEXT_PUBLIC_SITE_URL"]
    const optionalEnvVars = ["RESEND_API_KEY", "SENDGRID_API_KEY", "MAILGUN_API_KEY"]

    requiredEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        healthCheck.errors.push(`Missing required environment variable: ${envVar}`)
      }
    })

    const configuredEmailServices = optionalEnvVars.filter((envVar) => process.env[envVar]).length
    if (configuredEmailServices === 0) {
      healthCheck.warnings.push("No email service API keys configured - campaigns cannot be sent")
    } else {
      healthCheck.warnings.push(`${configuredEmailServices} email service(s) configured`)
    }

    // 7. Overall health assessment
    const hasErrors = healthCheck.errors.length > 0
    const hasCriticalIssues = healthCheck.errors.some(
      (error) => error.includes("table does not exist") || error.includes("Database not connected"),
    )

    return NextResponse.json({
      healthy: !hasErrors,
      critical: hasCriticalIssues,
      ready_for_production: !hasErrors && healthCheck.integration.email_service,
      summary: {
        errors: healthCheck.errors.length,
        warnings: healthCheck.warnings.length,
        database_ready: healthCheck.database.connected && healthCheck.database.tables.email_campaigns,
        api_ready: healthCheck.api.campaigns_route,
        email_ready: healthCheck.integration.email_service,
      },
      ...healthCheck,
      recommendations: [
        ...(healthCheck.errors.length > 0 ? ["🚨 Fix all errors before using campaigns"] : []),
        ...(healthCheck.database.tables.email_campaigns
          ? []
          : ["📋 Run the database script: scripts/create-email-campaigns-table.sql"]),
        ...(healthCheck.integration.email_service
          ? []
          : ["📧 Configure at least one email service (Resend recommended)"]),
        "✅ Test with a small campaign first",
        "📊 Monitor campaign delivery logs",
        "🔄 Set up regular health checks",
      ],
    })
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        critical: true,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
