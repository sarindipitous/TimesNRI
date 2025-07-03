import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId || !hasDb) {
      return NextResponse.json({
        success: false,
        error: "Campaign ID required and database must be available",
      })
    }

    // Get campaign details
    const campaignResult = await sql`
      SELECT * FROM email_campaigns WHERE id = ${campaignId}
    `

    if (campaignResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Campaign not found",
      })
    }

    const campaign = campaignResult[0]

    // Get ALL waitlist members
    const allWaitlist = await sql`
      SELECT email, name FROM waitlist_submissions ORDER BY email
    `

    // Debug the recipient selection logic step by step
    const debugSteps = []
    let finalRecipients = []

    debugSteps.push({
      step: "1. Campaign Configuration",
      data: {
        target_type: campaign.target_type,
        selected_recipients: campaign.selected_recipients,
        target_criteria: campaign.target_criteria,
      },
    })

    debugSteps.push({
      step: "2. Total Waitlist Members",
      data: {
        count: allWaitlist.length,
        sample_emails: allWaitlist.slice(0, 5).map((w: any) => w.email),
      },
    })

    // Replicate the EXACT logic from getCampaignRecipients
    if (campaign.target_type === "all") {
      debugSteps.push({
        step: "3. Target Type: ALL",
        data: "Selecting ALL waitlist members",
      })

      finalRecipients = allWaitlist.map((r: any) => ({ email: r.email, name: r.name }))
    } else if (campaign.target_type === "selected" && campaign.selected_recipients) {
      const selectedEmails = campaign.selected_recipients

      debugSteps.push({
        step: "3. Target Type: SELECTED",
        data: {
          selected_emails_from_campaign: selectedEmails,
          selected_count: selectedEmails.length,
        },
      })

      if (selectedEmails.length === 0) {
        debugSteps.push({
          step: "4. No Selected Recipients",
          data: "Empty selected_recipients array - returning empty list",
        })
        finalRecipients = []
      } else {
        debugSteps.push({
          step: "4. Filtering Waitlist by Selected Emails",
          data: "Running SQL: SELECT email, name FROM waitlist_submissions WHERE email = ANY(selected_emails)",
        })

        const result = await sql`
          SELECT email, name FROM waitlist_submissions 
          WHERE email = ANY(${selectedEmails})
        `

        finalRecipients = result.map((r: any) => ({ email: r.email, name: r.name }))

        debugSteps.push({
          step: "5. SQL Result",
          data: {
            found_recipients: finalRecipients.length,
            found_emails: finalRecipients.map((r) => r.email),
            missing_emails: selectedEmails.filter((email) => !finalRecipients.some((r) => r.email === email)),
          },
        })
      }
    } else if (campaign.target_type === "filtered" && campaign.target_criteria) {
      debugSteps.push({
        step: "3. Target Type: FILTERED",
        data: {
          criteria: campaign.target_criteria,
          note: "Applying filter criteria to waitlist",
        },
      })

      const criteria = campaign.target_criteria
      let query = sql`SELECT email, name FROM waitlist_submissions WHERE 1=1`

      if (criteria.location) {
        query = sql`${query} AND (location ILIKE ${"%" + criteria.location + "%"} OR parent_location ILIKE ${"%" + criteria.location + "%"})`
      }

      if (criteria.care_plan) {
        query = sql`${query} AND care_plan ILIKE ${"%" + criteria.care_plan + "%"}`
      }

      if (criteria.date_from) {
        query = sql`${query} AND created_at >= ${criteria.date_from}`
      }

      if (criteria.date_to) {
        query = sql`${query} AND created_at <= ${criteria.date_to}`
      }

      query = sql`${query} ORDER BY created_at DESC`

      const result = await query
      finalRecipients = result.map((r: any) => ({ email: r.email, name: r.name }))
    } else {
      debugSteps.push({
        step: "3. Invalid Configuration",
        data: "No valid target_type or missing required data",
      })
      finalRecipients = []
    }

    debugSteps.push({
      step: "6. Final Recipients",
      data: {
        count: finalRecipients.length,
        emails: finalRecipients.map((r) => r.email),
      },
    })

    // Critical analysis
    const analysis = {
      is_targeting_correct: false,
      critical_issues: [],
      warnings: [],
    }

    if (campaign.target_type === "selected") {
      const selectedEmails = campaign.selected_recipients || []
      const finalEmails = finalRecipients.map((r) => r.email)

      if (finalRecipients.length === allWaitlist.length && selectedEmails.length < allWaitlist.length) {
        analysis.critical_issues.push("CRITICAL: Selected specific recipients but targeting ALL waitlist members!")
      }

      if (finalRecipients.length > selectedEmails.length) {
        analysis.critical_issues.push(
          `CRITICAL: Selected ${selectedEmails.length} recipients but targeting ${finalRecipients.length}!`,
        )
      }

      const unexpectedEmails = finalEmails.filter((email) => !selectedEmails.includes(email))
      if (unexpectedEmails.length > 0) {
        analysis.critical_issues.push(`CRITICAL: Targeting unexpected emails: ${unexpectedEmails.join(", ")}`)
      }

      analysis.is_targeting_correct =
        finalRecipients.length === selectedEmails.length &&
        finalEmails.every((email) => selectedEmails.includes(email)) &&
        selectedEmails.every((email) => finalEmails.includes(email))
    }

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      debug_steps: debugSteps,
      final_recipients: finalRecipients,
      analysis,
      summary: {
        campaign_target_type: campaign.target_type,
        selected_count: campaign.selected_recipients?.length || 0,
        final_recipient_count: finalRecipients.length,
        total_waitlist_count: allWaitlist.length,
        targeting_status: analysis.is_targeting_correct ? "CORRECT" : "INCORRECT",
        critical_issues_count: analysis.critical_issues.length,
      },
    })
  } catch (error) {
    console.error("Debug recipient selection error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to debug recipient selection",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
