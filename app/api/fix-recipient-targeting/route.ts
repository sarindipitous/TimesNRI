import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error: "Database not available",
      })
    }

    // Check if there are any campaigns with targeting issues
    const campaigns = await sql`
      SELECT id, name, target_type, selected_recipients, total_recipients, status
      FROM email_campaigns 
      WHERE status IN ('draft', 'sending', 'sent')
      ORDER BY created_at DESC
    `

    const issues = []
    const fixes = []

    for (const campaign of campaigns) {
      if (campaign.target_type === "selected" && campaign.selected_recipients) {
        const selectedEmails = campaign.selected_recipients

        // Check if this campaign would target more users than selected
        const actualRecipients = await sql`
          SELECT email FROM waitlist_submissions 
          WHERE email = ANY(${selectedEmails})
        `

        const allWaitlist = await sql`
          SELECT COUNT(*) as count FROM waitlist_submissions
        `

        if (actualRecipients.length !== selectedEmails.length) {
          issues.push({
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            issue: `Selected ${selectedEmails.length} recipients but would target ${actualRecipients.length}`,
            selected_emails: selectedEmails,
            actual_emails: actualRecipients.map((r: any) => r.email),
          })
        }

        // Check if it would send to all users when only some selected
        if (actualRecipients.length === allWaitlist[0].count && selectedEmails.length < allWaitlist[0].count) {
          issues.push({
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            issue: "CRITICAL: Would send to ALL users despite selecting only some",
            selected_count: selectedEmails.length,
            would_send_to: actualRecipients.length,
            total_waitlist: allWaitlist[0].count,
          })
        }
      }
    }

    // Provide fixes for the getCampaignRecipients function
    const recommendedFixes = [
      {
        issue: "selected_recipients parsing",
        fix: "Ensure selected_recipients is properly parsed as array from JSON",
        code: `
        if (campaign.target_type === "selected" && campaign.selected_recipients) {
          let emails = campaign.selected_recipients
          
          // Handle if it's stored as JSON string
          if (typeof emails === 'string') {
            try {
              emails = JSON.parse(emails)
            } catch (e) {
              console.error('Failed to parse selected_recipients:', e)
              return []
            }
          }
          
          // Ensure it's an array
          if (!Array.isArray(emails)) {
            console.error('selected_recipients is not an array:', emails)
            return []
          }
          
          if (emails.length === 0) return []

          const result = await sql\`
            SELECT email, name FROM waitlist_submissions 
            WHERE email = ANY(\${emails})
          \`
          return result.map((r: any) => ({ email: r.email, name: r.name }))
        }
        `,
      },
    ]

    return NextResponse.json({
      success: true,
      issues_found: issues.length,
      issues,
      recommended_fixes: recommendedFixes,
      campaigns_checked: campaigns.length,
      summary: {
        total_campaigns: campaigns.length,
        issues_found: issues.length,
        critical_issues: issues.filter((i) => i.issue.includes("CRITICAL")).length,
      },
    })
  } catch (error) {
    console.error("Fix recipient targeting error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to analyze targeting issues",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
