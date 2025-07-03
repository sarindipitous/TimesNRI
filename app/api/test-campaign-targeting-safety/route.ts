import { NextResponse } from "next/server"
import { sql, hasDb } from "@/lib/db"
import { getCampaignRecipients } from "@/lib/email-campaigns"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { testCampaign } = await request.json()

    if (!hasDb) {
      return NextResponse.json({
        success: false,
        error: "Database not available",
      })
    }

    console.log("[TARGETING SAFETY TEST] Starting comprehensive targeting safety test")

    // Create a test campaign with selected targeting
    const testSelectedEmails = ["test1@example.com", "test2@example.com"]

    const testCampaignData = {
      name: "QA_TARGETING_SAFETY_TEST_DELETE_IMMEDIATELY",
      subject: "QA Test - DELETE IMMEDIATELY",
      from_name: "QA Test",
      from_email: "qa@timesnri.com",
      html_content: "<p>QA targeting safety test - DELETE IMMEDIATELY</p>",
      target_type: "selected" as const,
      selected_recipients: testSelectedEmails,
    }

    // Insert test campaign
    const testCampaignResult = await sql`
      INSERT INTO email_campaigns (
        name, subject, from_name, from_email, html_content, 
        target_type, selected_recipients
      ) VALUES (
        ${testCampaignData.name}, ${testCampaignData.subject}, 
        ${testCampaignData.from_name}, ${testCampaignData.from_email}, 
        ${testCampaignData.html_content}, ${testCampaignData.target_type}, 
        ${JSON.stringify(testCampaignData.selected_recipients)}
      )
      RETURNING *
    `

    const testCampaignId = testCampaignResult[0].id
    console.log(`[TARGETING SAFETY TEST] Created test campaign ${testCampaignId}`)

    try {
      // Test 1: Get all waitlist members
      const allWaitlist = await sql`
        SELECT email, name FROM waitlist_submissions ORDER BY email
      `
      const totalWaitlistCount = allWaitlist.length

      console.log(`[TARGETING SAFETY TEST] Total waitlist members: ${totalWaitlistCount}`)

      // Test 2: Get recipients using the actual targeting logic
      const recipients = await getCampaignRecipients(testCampaignResult[0])

      console.log(`[TARGETING SAFETY TEST] Recipients returned: ${recipients.length}`)
      console.log(`[TARGETING SAFETY TEST] Recipient emails: ${recipients.map((r) => r.email).join(", ")}`)

      // Test 3: Critical safety checks
      const safetyChecks = {
        correctRecipientCount: recipients.length === testSelectedEmails.length,
        noMassEmailBug: !(recipients.length === totalWaitlistCount && testSelectedEmails.length < totalWaitlistCount),
        correctEmails: testSelectedEmails.every((email) => recipients.some((r) => r.email === email)),
        noExtraEmails: recipients.every((r) => testSelectedEmails.includes(r.email)),
        notAllWaitlistMembers: recipients.length !== totalWaitlistCount,
      }

      // Test 4: JSON parsing validation
      const storedCampaign = await sql`
        SELECT selected_recipients FROM email_campaigns WHERE id = ${testCampaignId}
      `

      let parsedRecipients
      try {
        parsedRecipients = JSON.parse(storedCampaign[0].selected_recipients)
      } catch (e) {
        parsedRecipients = null
      }

      const jsonValidation = {
        canParseJson: parsedRecipients !== null,
        isArray: Array.isArray(parsedRecipients),
        correctLength: Array.isArray(parsedRecipients) ? parsedRecipients.length === testSelectedEmails.length : false,
        correctEmails: Array.isArray(parsedRecipients)
          ? testSelectedEmails.every((email) => parsedRecipients.includes(email))
          : false,
      }

      // Test 5: Edge case testing
      const edgeCases = {
        emptySelection: false,
        nullSelection: false,
        invalidJson: false,
        nonArraySelection: false,
      }

      // Test empty selection
      const emptyCampaign = await sql`
        INSERT INTO email_campaigns (
          name, subject, from_name, from_email, html_content, 
          target_type, selected_recipients
        ) VALUES (
          'QA_EMPTY_TEST', 'Empty Test', 'QA', 'qa@test.com', '<p>Empty</p>', 
          'selected', '[]'
        )
        RETURNING *
      `

      const emptyRecipients = await getCampaignRecipients(emptyCampaign[0])
      edgeCases.emptySelection = emptyRecipients.length === 0

      // Clean up empty test campaign
      await sql`DELETE FROM email_campaigns WHERE id = ${emptyCampaign[0].id}`

      // Overall safety assessment
      const allSafetyChecksPassed = Object.values(safetyChecks).every((check) => check === true)
      const allJsonValidationPassed = Object.values(jsonValidation).every((check) => check === true)
      const allEdgeCasesPassed = Object.values(edgeCases).every((check) => check === true)

      const overallSafety = allSafetyChecksPassed && allJsonValidationPassed && allEdgeCasesPassed

      // Critical issue detection
      const criticalIssues = []

      if (!safetyChecks.noMassEmailBug) {
        criticalIssues.push("CRITICAL: Mass email bug detected - selected targeting returns all users!")
      }

      if (!safetyChecks.correctRecipientCount) {
        criticalIssues.push(
          `CRITICAL: Wrong recipient count - expected ${testSelectedEmails.length}, got ${recipients.length}`,
        )
      }

      if (!safetyChecks.correctEmails) {
        criticalIssues.push("CRITICAL: Selected emails not found in recipients")
      }

      if (!safetyChecks.noExtraEmails) {
        criticalIssues.push("CRITICAL: Extra emails found in recipients")
      }

      if (!jsonValidation.canParseJson) {
        criticalIssues.push("CRITICAL: Cannot parse selected_recipients JSON")
      }

      return NextResponse.json({
        success: true,
        testCampaignId,
        overallSafety,
        criticalIssues,
        testResults: {
          totalWaitlistCount,
          selectedEmailsCount: testSelectedEmails.length,
          recipientsCount: recipients.length,
          selectedEmails: testSelectedEmails,
          recipientEmails: recipients.map((r) => r.email),
        },
        safetyChecks,
        jsonValidation,
        edgeCases,
        recommendation: overallSafety
          ? "✅ Targeting logic is SAFE for production deployment"
          : "❌ CRITICAL ISSUES FOUND - DO NOT DEPLOY",
        deploymentDecision: overallSafety ? "APPROVED" : "BLOCKED",
      })
    } finally {
      // ALWAYS clean up test campaign
      await sql`DELETE FROM email_campaigns WHERE id = ${testCampaignId}`
      console.log(`[TARGETING SAFETY TEST] Cleaned up test campaign ${testCampaignId}`)
    }
  } catch (error) {
    console.error("Targeting safety test error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to run targeting safety test",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
