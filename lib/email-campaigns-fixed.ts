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

// Helper function for no database scenarios
function noDb<T>(fallback: T, fnName: string): T {
  console.warn(`[email-campaigns] ${fnName} skipped – DATABASE_URL not set`)
  return fallback
}

// Get all campaigns
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

// Get campaign by ID
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

// Create campaign
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
        target_type, target_criteria, selected_recipients,
        status, total_recipients, sent_count, failed_count
      ) VALUES (
        ${data.name}, ${data.subject}, ${data.from_name}, ${data.from_email}, 
        ${data.html_content}, ${data.target_type}, 
        ${JSON.stringify(data.target_criteria || {})}, 
        ${JSON.stringify(data.selected_recipients || [])},
        'draft', 0, 0, 0
      )
      RETURNING *
    `
    return result[0] as EmailCampaign
  } catch (error) {
    console.error("Error creating campaign:", error)
    return null
  }
}

// Update campaign
export async function updateCampaign(id: number, updates: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
  if (!hasDb) return noDb(null, "updateCampaign")

  try {
    console.log(`[UPDATE] Campaign ${id}:`, updates)

    // Build update query dynamically
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Simple field mapping
    const fieldMap: Record<string, any> = {
      status: updates.status,
      total_recipients: updates.total_recipients,
      sent_count: updates.sent_count,
      failed_count: updates.failed_count,
      started_at: updates.started_at,
      completed_at: updates.completed_at,
      name: updates.name,
      subject: updates.subject,
      html_content: updates.html_content,
      selected_recipients: updates.selected_recipients ? JSON.stringify(updates.selected_recipients) : undefined,
    }

    // Add fields that have values
    for (const [field, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      console.log("[UPDATE] No fields to update")
      return await getCampaignById(id)
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    // Execute update
    const query = `
      UPDATE email_campaigns 
      SET ${updateFields.join(", ")}
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

// Delete campaign
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

// Get campaign recipients
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

interface ResendBatchEmail {
  from: string
  to: string[]
  subject: string
  html: string
}

interface ResendBatchResponse {
  data?: Array<{ id: string }>
  error?: { message: string }
}

// Fallback: SendGrid single email
async function sendSingleEmailViaSendGrid(payload: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, error: "SendGrid API key not configured" }
  }

  try {
    console.log(`[SENDGRID] Sending to ${payload.to}`)

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: payload.to }],
            subject: payload.subject,
          },
        ],
        from: { email: "noreply@timesnri.com", name: "Times NRI Team" },
        content: [{ type: "text/html", value: payload.html }],
      }),
    })

    if (response.ok) {
      console.log(`[SENDGRID] ✅ Success for ${payload.to}`)
      return { success: true }
    } else {
      const errorText = await response.text()
      console.log(`[SENDGRID] ❌ Failed for ${payload.to}:`, errorText)
      return { success: false, error: `SendGrid error: ${response.status}` }
    }
  } catch (error) {
    console.log(`[SENDGRID] ❌ Exception for ${payload.to}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

async function sendBatchEmailsViaResend(emails: Array<{ to: string; subject: string; html: string }>): Promise<{
  success: boolean
  sent: Array<{ email: string; external_id?: string }>
  failed: Array<{ email: string; error: string }>
}> {
  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      sent: [],
      failed: emails.map((e) => ({ email: e.to, error: "Resend API key not configured" })),
    }
  }

  try {
    console.log(`[RESEND BATCH] Sending ${emails.length} emails`)

    // Resend batch API: send up to 100 emails per request
    const batchEmails = emails.map((email) => ({
      from: "Times NRI Team <noreply@timesnri.com>",
      to: [email.to],
      subject: email.subject,
      html: email.html,
    }))

    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batchEmails),
    })

    const responseData: ResendBatchResponse = await response.json()

    if (response.ok && responseData.data) {
      console.log(`[RESEND BATCH] ✅ Successfully sent ${responseData.data.length} emails`)

      const sent = emails.map((email, index) => ({
        email: email.to,
        external_id: responseData.data?.[index]?.id,
      }))

      return {
        success: true,
        sent,
        failed: [],
      }
    } else {
      console.log(`[RESEND BATCH] ❌ Failed:`, responseData.error || response.statusText)

      // If batch fails, mark all as failed
      return {
        success: false,
        sent: [],
        failed: emails.map((e) => ({
          email: e.to,
          error: responseData.error?.message || `HTTP ${response.status}`,
        })),
      }
    }
  } catch (error) {
    console.log(`[RESEND BATCH] ❌ Exception:`, error)
    return {
      success: false,
      sent: [],
      failed: emails.map((e) => ({
        email: e.to,
        error: error instanceof Error ? error.message : "Network error",
      })),
    }
  }
}

export async function sendCampaign(campaignId: number): Promise<{ success: boolean; message: string }> {
  if (!hasDb) return noDb({ success: false, message: "Database not available" }, "sendCampaign")

  let campaign: EmailCampaign | null = null

  try {
    console.log(`[SEND CAMPAIGN] Starting optimized campaign ${campaignId}`)

    // Get campaign
    campaign = await getCampaignById(campaignId)
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

    const BATCH_SIZE = 100 // Resend's batch limit
    const batchCount = Math.ceil(recipients.length / BATCH_SIZE)
    const estimatedTime = Math.ceil(batchCount * 0.67) // 0.67 seconds per batch at 1.5 req/sec

    console.log(`[SEND CAMPAIGN] Will send in ${batchCount} batches`)
    console.log(`[SEND CAMPAIGN] Estimated time: ~${estimatedTime} seconds`)

    // Update to sending status
    await updateCampaign(campaignId, {
      status: "sending",
      total_recipients: recipients.length,
      started_at: new Date(),
      sent_count: 0,
      failed_count: 0,
    })

    // Clear any existing logs for this campaign
    await sql`DELETE FROM email_campaign_logs WHERE campaign_id = ${campaignId}`

    if (recipients.length > 0) {
      const logValues = recipients
        .map(
          (r) =>
            `(${campaignId}, ${sql.escapeIdentifier(r.email)}, ${r.name ? sql.escapeIdentifier(r.name) : "NULL"}, 'pending')`,
        )
        .join(", ")

      await sql.unsafe(`
        INSERT INTO email_campaign_logs (campaign_id, recipient_email, recipient_name, status)
        VALUES ${logValues}
      `)

      console.log(`[SEND CAMPAIGN] Created ${recipients.length} log entries (batch insert)`)
    }

    let sentCount = 0
    let failedCount = 0
    const RATE_LIMIT_DELAY = 670 // 670ms = 1.5 requests per second (safe margin under 2 req/sec)

    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE
      const endIdx = Math.min(startIdx + BATCH_SIZE, recipients.length)
      const batchRecipients = recipients.slice(startIdx, endIdx)

      console.log(`[SEND CAMPAIGN] Processing batch ${batchIndex + 1}/${batchCount} (${batchRecipients.length} emails)`)

      // Prepare batch emails with template variables
      const batchEmails = batchRecipients.map((recipient) => {
        let htmlContent = campaign.html_content
        htmlContent = htmlContent.replace(/\{\{name\}\}/g, recipient.name || "Valued Member")
        htmlContent = htmlContent.replace(/\{\{email\}\}/g, recipient.email)
        htmlContent = htmlContent.replace(/\{\{subject\}\}/g, campaign.subject)

        return {
          to: recipient.email,
          subject: campaign.subject,
          html: htmlContent,
        }
      })

      // Send batch
      const result = await sendBatchEmailsViaResend(batchEmails)

      if (result.sent.length > 0) {
        const sentEmails = result.sent.map((s) => s.email)
        const externalIds = result.sent.reduce(
          (acc, s) => {
            if (s.external_id) acc[s.email] = s.external_id
            return acc
          },
          {} as Record<string, string>,
        )

        // Update all successful sends in one query
        for (const sentItem of result.sent) {
          await sql`
            UPDATE email_campaign_logs 
            SET status = 'sent', 
                sent_at = CURRENT_TIMESTAMP, 
                email_service = 'Resend',
                external_id = ${sentItem.external_id || null}
            WHERE campaign_id = ${campaignId} 
              AND recipient_email = ${sentItem.email}
          `
        }

        sentCount += result.sent.length
        console.log(`[SEND CAMPAIGN] ✅ Batch ${batchIndex + 1}: ${result.sent.length} sent`)
      }

      if (result.failed.length > 0) {
        // Update all failed sends in one query
        for (const failedItem of result.failed) {
          await sql`
            UPDATE email_campaign_logs 
            SET status = 'failed', 
                error_message = ${failedItem.error}
            WHERE campaign_id = ${campaignId} 
              AND recipient_email = ${failedItem.email}
          `
        }

        failedCount += result.failed.length
        console.log(`[SEND CAMPAIGN] ❌ Batch ${batchIndex + 1}: ${result.failed.length} failed`)
      }

      // Update campaign progress
      await updateCampaign(campaignId, {
        sent_count: sentCount,
        failed_count: failedCount,
      })

      console.log(`[SEND CAMPAIGN] Progress: ${sentCount} sent, ${failedCount} failed out of ${recipients.length}`)

      if (batchIndex < batchCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY))
      }
    }

    // Final campaign update
    const finalStatus = sentCount > 0 ? "sent" : "failed"
    await updateCampaign(campaignId, {
      status: finalStatus,
      sent_count: sentCount,
      failed_count: failedCount,
      completed_at: new Date(),
    })

    const message = `Campaign completed! ${sentCount} emails sent, ${failedCount} failed out of ${recipients.length} total recipients.`
    console.log(`[SEND CAMPAIGN] FINAL: ${message}`)

    return {
      success: sentCount > 0,
      message,
    }
  } catch (error) {
    console.error("[SEND CAMPAIGN] Critical campaign error:", error)

    // Reset campaign status on critical error
    try {
      if (campaign) {
        await updateCampaign(campaignId, {
          status: "failed",
          completed_at: new Date(),
        })
      }
    } catch (resetError) {
      console.error("[SEND CAMPAIGN] Failed to reset status:", resetError)
    }

    return {
      success: false,
      message: `Campaign failed with critical error: ${error instanceof Error ? error.message : "Unknown error"}`,
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
