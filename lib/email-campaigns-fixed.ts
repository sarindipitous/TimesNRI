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

// ROBUST UPDATE FUNCTION - No more complex logic
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

// COMPLETELY REWRITTEN: Reliable single email sending
async function sendSingleEmailReliable(payload: {
  to: string
  from: string
  subject: string
  html: string
}): Promise<{ success: boolean; service?: string; error?: string; external_id?: string }> {
  // Try Resend first (most reliable)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[EMAIL] Sending via Resend to ${payload.to}`)

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

      const responseData = await response.json()

      if (response.ok) {
        console.log(`[EMAIL] ✅ Resend success for ${payload.to}`)
        return {
          success: true,
          service: "Resend",
          external_id: responseData.id,
        }
      } else {
        console.log(`[EMAIL] ❌ Resend failed for ${payload.to}:`, responseData)
        return {
          success: false,
          service: "Resend",
          error: responseData.message || "Resend API error",
        }
      }
    } catch (error) {
      console.log(`[EMAIL] ❌ Resend exception for ${payload.to}:`, error)
      // Continue to next service
    }
  }

  // Try SendGrid as fallback
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log(`[EMAIL] Trying SendGrid for ${payload.to}`)

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }], subject: payload.subject }],
          from: { email: "noreply@timesnri.com", name: "Times NRI Team" },
          content: [{ type: "text/html", value: payload.html }],
        }),
      })

      if (response.ok) {
        console.log(`[EMAIL] ✅ SendGrid success for ${payload.to}`)
        return { success: true, service: "SendGrid" }
      } else {
        const errorText = await response.text()
        console.log(`[EMAIL] ❌ SendGrid failed for ${payload.to}:`, errorText)
        return { success: false, service: "SendGrid", error: "SendGrid API error" }
      }
    } catch (error) {
      console.log(`[EMAIL] ❌ SendGrid exception for ${payload.to}:`, error)
    }
  }

  return { success: false, error: "No email service available or all services failed" }
}

// COMPLETELY REWRITTEN: Robust campaign sending with proper error handling
export async function sendCampaign(campaignId: number): Promise<{ success: boolean; message: string }> {
  if (!hasDb) return noDb({ success: false, message: "Database not available" }, "sendCampaign")

  let campaign: EmailCampaign | null = null

  try {
    console.log(`[SEND CAMPAIGN] Starting campaign ${campaignId}`)

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

    // Create logs for all recipients
    for (const recipient of recipients) {
      await sql`
        INSERT INTO email_campaign_logs (campaign_id, recipient_email, recipient_name, status)
        VALUES (${campaignId}, ${recipient.email}, ${recipient.name || null}, 'pending')
      `
    }

    console.log(`[SEND CAMPAIGN] Created ${recipients.length} log entries`)

    // Send emails one by one with proper error handling
    let sentCount = 0
    let failedCount = 0

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]

      try {
        console.log(`[SEND CAMPAIGN] Processing ${i + 1}/${recipients.length}: ${recipient.email}`)

        // Prepare email content
        let htmlContent = campaign.html_content
        htmlContent = htmlContent.replace(/\{\{name\}\}/g, recipient.name || "Valued Member")
        htmlContent = htmlContent.replace(/\{\{email\}\}/g, recipient.email)
        htmlContent = htmlContent.replace(/\{\{subject\}\}/g, campaign.subject)

        // Send email
        const result = await sendSingleEmailReliable({
          to: recipient.email,
          from: `${campaign.from_name} <${campaign.from_email}>`,
          subject: campaign.subject,
          html: htmlContent,
        })

        if (result.success) {
          sentCount++

          // Update log
          await sql`
            UPDATE email_campaign_logs 
            SET status = 'sent', sent_at = CURRENT_TIMESTAMP, 
                email_service = ${result.service}, external_id = ${result.external_id || null}
            WHERE campaign_id = ${campaignId} AND recipient_email = ${recipient.email}
          `

          console.log(`[SEND CAMPAIGN] ✅ ${i + 1}/${recipients.length} sent successfully`)
        } else {
          failedCount++

          // Update log
          await sql`
            UPDATE email_campaign_logs 
            SET status = 'failed', error_message = ${result.error || "Unknown error"}
            WHERE campaign_id = ${campaignId} AND recipient_email = ${recipient.email}
          `

          console.log(`[SEND CAMPAIGN] ❌ ${i + 1}/${recipients.length} failed: ${result.error}`)
        }

        // Update campaign progress every 5 emails
        if ((i + 1) % 5 === 0 || i === recipients.length - 1) {
          await updateCampaign(campaignId, {
            sent_count: sentCount,
            failed_count: failedCount,
          })
          console.log(`[SEND CAMPAIGN] Progress: ${sentCount} sent, ${failedCount} failed`)
        }

        // Rate limiting - wait between emails to avoid hitting limits
        if (i < recipients.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000)) // 1 second delay
        }
      } catch (emailError) {
        failedCount++
        console.error(`[SEND CAMPAIGN] Error sending to ${recipient.email}:`, emailError)

        // Update log
        await sql`
          UPDATE email_campaign_logs 
          SET status = 'failed', error_message = ${emailError instanceof Error ? emailError.message : "Unknown error"}
          WHERE campaign_id = ${campaignId} AND recipient_email = ${recipient.email}
        `
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

    const message = `Campaign completed. ${sentCount} sent, ${failedCount} failed out of ${recipients.length} total.`
    console.log(`[SEND CAMPAIGN] ${message}`)

    return {
      success: sentCount > 0,
      message,
    }
  } catch (error) {
    console.error("[SEND CAMPAIGN] Critical error:", error)

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
