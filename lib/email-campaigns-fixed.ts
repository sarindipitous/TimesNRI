import { sql, hasDb } from "@/lib/db"

export interface EmailCampaign {
  id: number
  name: string
  subject: string
  from_name: string
  from_email: string
  html_content: string
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "failed"
  target_type: "all" | "selected" | "filtered"
  target_criteria?: any
  selected_recipients?: string[]
  total_recipients: number
  sent_count: number
  failed_count: number
  scheduled_at?: Date
  started_at?: Date
  completed_at?: Date
  created_at: Date
  updated_at: Date
}

export interface CampaignLog {
  id: number
  campaign_id: number
  recipient_email: string
  recipient_name?: string
  status: "pending" | "sent" | "failed" | "bounced"
  sent_at?: Date
  error_message?: string
  email_service?: string
  external_id?: string
  created_at: Date
}

export interface BulkEmailResult {
  success: boolean
  service: string
  sent_count: number
  failed_count: number
  details: any[]
  errors: string[]
}

// Helper function for no database scenarios
function noDb<T>(fallback: T, fnName: string): T {
  console.warn(`[email-campaigns] ${fnName} skipped – DATABASE_URL not set`)
  return fallback
}

// SIMPLIFIED: Get all campaigns
export async function getAllCampaigns(): Promise<EmailCampaign[]> {
  if (!hasDb) return noDb([], "getAllCampaigns")

  try {
    const result = await sql`SELECT * FROM email_campaigns ORDER BY created_at DESC`
    return result as EmailCampaign[]
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return []
  }
}

// SIMPLIFIED: Get campaign by ID
export async function getCampaignById(id: number): Promise<EmailCampaign | null> {
  if (!hasDb) return noDb(null, "getCampaignById")

  try {
    const result = await sql`SELECT * FROM email_campaigns WHERE id = ${id}`
    return (result[0] as EmailCampaign) || null
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return null
  }
}

// SIMPLIFIED: Create campaign
export async function createCampaign(data: {
  name: string
  subject: string
  from_name: string
  from_email: string
  html_content: string
  target_type: "all" | "selected" | "filtered"
  target_criteria?: any
  selected_recipients?: string[]
}): Promise<EmailCampaign | null> {
  if (!hasDb) return noDb(null, "createCampaign")

  try {
    const result = await sql`
      INSERT INTO email_campaigns (
        name, subject, from_name, from_email, html_content, 
        target_type, target_criteria, selected_recipients
      ) VALUES (
        ${data.name}, ${data.subject}, ${data.from_name}, ${data.from_email}, 
        ${data.html_content}, ${data.target_type}, 
        ${JSON.stringify(data.target_criteria || {})}, 
        ${JSON.stringify(data.selected_recipients || [])}
      )
      RETURNING *
    `
    return result[0] as EmailCampaign
  } catch (error) {
    console.error("Error creating campaign:", error)
    return null
  }
}

// COMPLETELY REWRITTEN: Simple update function
export async function updateCampaign(id: number, updates: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
  if (!hasDb) return noDb(null, "updateCampaign")

  try {
    console.log(`[UPDATE] Campaign ${id}:`, updates)

    // Build dynamic update query
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Handle each possible update field
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      values.push(updates.status)
      paramIndex++
    }

    if (updates.total_recipients !== undefined) {
      updateFields.push(`total_recipients = $${paramIndex}`)
      values.push(updates.total_recipients)
      paramIndex++
    }

    if (updates.sent_count !== undefined) {
      updateFields.push(`sent_count = $${paramIndex}`)
      values.push(updates.sent_count)
      paramIndex++
    }

    if (updates.failed_count !== undefined) {
      updateFields.push(`failed_count = $${paramIndex}`)
      values.push(updates.failed_count)
      paramIndex++
    }

    if (updates.started_at !== undefined) {
      updateFields.push(`started_at = $${paramIndex}`)
      values.push(updates.started_at)
      paramIndex++
    }

    if (updates.completed_at !== undefined) {
      updateFields.push(`completed_at = $${paramIndex}`)
      values.push(updates.completed_at)
      paramIndex++
    }

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`)
      values.push(updates.name)
      paramIndex++
    }

    if (updates.subject !== undefined) {
      updateFields.push(`subject = $${paramIndex}`)
      values.push(updates.subject)
      paramIndex++
    }

    if (updates.html_content !== undefined) {
      updateFields.push(`html_content = $${paramIndex}`)
      values.push(updates.html_content)
      paramIndex++
    }

    if (updates.selected_recipients !== undefined) {
      updateFields.push(`selected_recipients = $${paramIndex}`)
      values.push(JSON.stringify(updates.selected_recipients))
      paramIndex++
    }

    if (updateFields.length === 0) {
      console.log("[UPDATE] No fields to update")
      return await getCampaignById(id)
    }

    // Execute update
    const query = `
      UPDATE email_campaigns 
      SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `
    values.push(id)

    const result = await sql.unsafe(query, values)
    console.log(`[UPDATE] Success for campaign ${id}`)
    return (result[0] as EmailCampaign) || null
  } catch (error) {
    console.error(`[UPDATE] Error updating campaign ${id}:`, error)
    throw error
  }
}

// SIMPLIFIED: Delete campaign
export async function deleteCampaign(id: number): Promise<boolean> {
  if (!hasDb) return noDb(false, "deleteCampaign")

  try {
    const result = await sql`DELETE FROM email_campaigns WHERE id = ${id} AND status = 'draft'`
    return result.count > 0
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return false
  }
}

// FIXED: Get campaign recipients with proper validation
export async function getCampaignRecipients(campaign: EmailCampaign): Promise<Array<{ email: string; name?: string }>> {
  if (!hasDb) return noDb([], "getCampaignRecipients")

  try {
    console.log(`[RECIPIENTS] Campaign ${campaign.id} - Type: ${campaign.target_type}`)

    if (campaign.target_type === "all") {
      const result = await sql`SELECT email, name FROM waitlist_submissions ORDER BY created_at DESC`
      console.log(`[RECIPIENTS] ALL: Found ${result.length} recipients`)
      return result.map((r: any) => ({ email: r.email, name: r.name }))
    }

    if (campaign.target_type === "selected") {
      let selectedEmails = campaign.selected_recipients

      // Parse if string
      if (typeof selectedEmails === "string") {
        try {
          selectedEmails = JSON.parse(selectedEmails)
        } catch (e) {
          console.error("[RECIPIENTS] Failed to parse selected_recipients")
          return []
        }
      }

      if (!Array.isArray(selectedEmails) || selectedEmails.length === 0) {
        console.log("[RECIPIENTS] SELECTED: No valid recipients")
        return []
      }

      console.log(`[RECIPIENTS] SELECTED: Looking for ${selectedEmails.length} emails`)

      const result = await sql`
        SELECT email, name FROM waitlist_submissions 
        WHERE email = ANY(${selectedEmails})
      `

      console.log(`[RECIPIENTS] SELECTED: Found ${result.length} matching recipients`)
      return result.map((r: any) => ({ email: r.email, name: r.name }))
    }

    if (campaign.target_type === "filtered" && campaign.target_criteria) {
      // Simplified filtering - can be expanded
      const criteria = campaign.target_criteria
      let whereClause = "WHERE 1=1"
      const params: any[] = []

      if (criteria.location) {
        whereClause += ` AND (location ILIKE $${params.length + 1} OR parent_location ILIKE $${params.length + 1})`
        params.push(`%${criteria.location}%`)
      }

      const query = `SELECT email, name FROM waitlist_submissions ${whereClause} ORDER BY created_at DESC`
      const result = await sql.unsafe(query, params)

      console.log(`[RECIPIENTS] FILTERED: Found ${result.length} recipients`)
      return result.map((r: any) => ({ email: r.email, name: r.name }))
    }

    return []
  } catch (error) {
    console.error("Error getting campaign recipients:", error)
    return []
  }
}

// NEW: Bulk email sending using Resend API
async function sendBulkEmailsViaResend(
  recipients: Array<{ email: string; name?: string }>,
  campaign: EmailCampaign,
): Promise<BulkEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      service: "Resend",
      sent_count: 0,
      failed_count: recipients.length,
      details: [],
      errors: ["Resend API key not configured"],
    }
  }

  try {
    console.log(`[BULK RESEND] Sending to ${recipients.length} recipients`)

    // Resend supports up to 50 recipients per request
    const BATCH_SIZE = 50
    const batches = []

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE))
    }

    let totalSent = 0
    let totalFailed = 0
    const allDetails: any[] = []
    const allErrors: string[] = []

    for (const batch of batches) {
      try {
        // Process template for each recipient
        const emailPromises = batch.map(async (recipient) => {
          let htmlContent = campaign.html_content
          htmlContent = htmlContent.replace(/\{\{name\}\}/g, recipient.name || "Valued Member")
          htmlContent = htmlContent.replace(/\{\{email\}\}/g, recipient.email)
          htmlContent = htmlContent.replace(/\{\{subject\}\}/g, campaign.subject)

          return {
            from: `${campaign.from_name} <noreply@timesnri.com>`,
            to: [recipient.email],
            subject: campaign.subject,
            html: htmlContent,
          }
        })

        const emailPayloads = await Promise.all(emailPromises)

        // Send batch to Resend
        const batchPromises = emailPayloads.map(async (payload) => {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })

          const responseData = await response.json()

          return {
            email: payload.to[0],
            success: response.ok,
            response: responseData,
            status: response.status,
          }
        })

        const batchResults = await Promise.all(batchPromises)

        // Process results
        for (const result of batchResults) {
          if (result.success) {
            totalSent++
            allDetails.push({
              email: result.email,
              status: "sent",
              external_id: result.response.id,
            })
          } else {
            totalFailed++
            allDetails.push({
              email: result.email,
              status: "failed",
              error: result.response.message || "Unknown error",
            })
            allErrors.push(`${result.email}: ${result.response.message || "Unknown error"}`)
          }
        }

        // Small delay between batches
        if (batches.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } catch (batchError) {
        console.error("[BULK RESEND] Batch error:", batchError)
        totalFailed += batch.length
        allErrors.push(`Batch error: ${batchError instanceof Error ? batchError.message : "Unknown error"}`)
      }
    }

    return {
      success: totalSent > 0,
      service: "Resend",
      sent_count: totalSent,
      failed_count: totalFailed,
      details: allDetails,
      errors: allErrors,
    }
  } catch (error) {
    console.error("[BULK RESEND] Error:", error)
    return {
      success: false,
      service: "Resend",
      sent_count: 0,
      failed_count: recipients.length,
      details: [],
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

// NEW: Fallback individual email sending
async function sendIndividualEmails(
  recipients: Array<{ email: string; name?: string }>,
  campaign: EmailCampaign,
): Promise<BulkEmailResult> {
  console.log(`[INDIVIDUAL] Sending to ${recipients.length} recipients individually`)

  let sentCount = 0
  let failedCount = 0
  const details: any[] = []
  const errors: string[] = []

  for (const recipient of recipients) {
    try {
      let htmlContent = campaign.html_content
      htmlContent = htmlContent.replace(/\{\{name\}\}/g, recipient.name || "Valued Member")
      htmlContent = htmlContent.replace(/\{\{email\}\}/g, recipient.email)
      htmlContent = htmlContent.replace(/\{\{subject\}\}/g, campaign.subject)

      const result = await sendSingleEmail({
        to: recipient.email,
        from: `${campaign.from_name} <${campaign.from_email}>`,
        subject: campaign.subject,
        html: htmlContent,
      })

      if (result.success) {
        sentCount++
        details.push({
          email: recipient.email,
          status: "sent",
          service: result.service,
        })
      } else {
        failedCount++
        details.push({
          email: recipient.email,
          status: "failed",
          error: result.error,
        })
        errors.push(`${recipient.email}: ${result.error}`)
      }

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (error) {
      failedCount++
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      details.push({
        email: recipient.email,
        status: "failed",
        error: errorMsg,
      })
      errors.push(`${recipient.email}: ${errorMsg}`)
    }
  }

  return {
    success: sentCount > 0,
    service: "Individual",
    sent_count: sentCount,
    failed_count: failedCount,
    details,
    errors,
  }
}

// Helper: Send single email
async function sendSingleEmail(payload: {
  to: string
  from: string
  subject: string
  html: string
}): Promise<{ success: boolean; service?: string; error?: string }> {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Times NRI Team <noreply@timesnri.com>",
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      })

      if (response.ok) {
        return { success: true, service: "Resend" }
      }

      const errorData = await response.json()
      return {
        success: false,
        service: "Resend",
        error: errorData.message || "Unknown error",
      }
    } catch (error) {
      // Fall through to next service
    }
  }

  // Try SendGrid as fallback
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }], subject: payload.subject }],
          from: { email: "timesnri@timesinternet.in", name: "Times NRI Team" },
          content: [{ type: "text/html", value: payload.html }],
        }),
      })

      if (response.ok) {
        return { success: true, service: "SendGrid" }
      }

      return { success: false, service: "SendGrid", error: "SendGrid API error" }
    } catch (error) {
      // Fall through
    }
  }

  return { success: false, error: "No email service available" }
}

// COMPLETELY REWRITTEN: Send campaign with bulk support
export async function sendCampaign(campaignId: number): Promise<{ success: boolean; message: string }> {
  if (!hasDb) return noDb({ success: false, message: "Database not available" }, "sendCampaign")

  try {
    console.log(`[SEND CAMPAIGN] Starting campaign ${campaignId}`)

    // Get campaign
    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return { success: false, message: "Campaign not found" }
    }

    if (campaign.status !== "draft" && campaign.status !== "paused") {
      return { success: false, message: `Cannot send campaign with status: ${campaign.status}` }
    }

    // Get recipients
    const recipients = await getCampaignRecipients(campaign)
    if (recipients.length === 0) {
      return { success: false, message: "No recipients found" }
    }

    console.log(`[SEND CAMPAIGN] Found ${recipients.length} recipients`)

    // Update to sending status
    await updateCampaign(campaignId, {
      status: "sending",
      total_recipients: recipients.length,
      started_at: new Date(),
    })

    // Create logs for all recipients
    for (const recipient of recipients) {
      await sql`
        INSERT INTO email_campaign_logs (campaign_id, recipient_email, recipient_name, status)
        VALUES (${campaignId}, ${recipient.email}, ${recipient.name || null}, 'pending')
      `
    }

    // Try bulk sending first, fallback to individual
    let result: BulkEmailResult

    if (recipients.length >= 10) {
      console.log("[SEND CAMPAIGN] Using bulk sending")
      result = await sendBulkEmailsViaResend(recipients, campaign)
    } else {
      console.log("[SEND CAMPAIGN] Using individual sending")
      result = await sendIndividualEmails(recipients, campaign)
    }

    // Update logs based on results
    for (const detail of result.details) {
      if (detail.status === "sent") {
        await sql`
          UPDATE email_campaign_logs 
          SET status = 'sent', sent_at = CURRENT_TIMESTAMP, 
              email_service = ${result.service}, external_id = ${detail.external_id || null}
          WHERE campaign_id = ${campaignId} AND recipient_email = ${detail.email}
        `
      } else {
        await sql`
          UPDATE email_campaign_logs 
          SET status = 'failed', error_message = ${detail.error || "Unknown error"}
          WHERE campaign_id = ${campaignId} AND recipient_email = ${detail.email}
        `
      }
    }

    // Update campaign final status
    await updateCampaign(campaignId, {
      status: result.success ? "sent" : "failed",
      sent_count: result.sent_count,
      failed_count: result.failed_count,
      completed_at: new Date(),
    })

    const message = `Campaign completed. ${result.sent_count} sent, ${result.failed_count} failed.`
    console.log(`[SEND CAMPAIGN] ${message}`)

    return { success: result.success, message }
  } catch (error) {
    console.error("[SEND CAMPAIGN] Error:", error)

    // Reset campaign status on error
    try {
      await updateCampaign(campaignId, { status: "draft" })
    } catch (resetError) {
      console.error("[SEND CAMPAIGN] Failed to reset status:", resetError)
    }

    return {
      success: false,
      message: `Campaign failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Get campaign logs
export async function getCampaignLogs(campaignId: number, limit = 100, offset = 0): Promise<CampaignLog[]> {
  if (!hasDb) return noDb([], "getCampaignLogs")

  try {
    const result = await sql`
      SELECT * FROM email_campaign_logs 
      WHERE campaign_id = ${campaignId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result as CampaignLog[]
  } catch (error) {
    console.error("Error fetching campaign logs:", error)
    return []
  }
}

// Get campaign statistics
export async function getCampaignStats(campaignId: number) {
  if (!hasDb) return noDb({ total: 0, sent: 0, failed: 0, pending: 0 }, "getCampaignStats")

  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending
      FROM email_campaign_logs 
      WHERE campaign_id = ${campaignId}
    `

    return {
      total: Number(result[0]?.total || 0),
      sent: Number(result[0]?.sent || 0),
      failed: Number(result[0]?.failed || 0),
      pending: Number(result[0]?.pending || 0),
    }
  } catch (error) {
    console.error("Error fetching campaign stats:", error)
    return { total: 0, sent: 0, failed: 0, pending: 0 }
  }
}
