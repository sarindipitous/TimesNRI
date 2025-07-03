import { sql, hasDb } from "@/lib/db"

export interface EmailCampaign {
  id: number
  name: string
  subject: string
  from_name: string
  from_email: string
  html_content: string
  status: "draft" | "scheduled" | "sending" | "sent" | "paused"
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

// Helper to warn & bail out gracefully in preview
function noDb<T>(fallback: T, fnName: string): T {
  console.warn(`[lib/email-campaigns] ${fnName} skipped – DATABASE_URL not set. Returning fallback.`)
  return fallback
}

// Get all campaigns
export async function getAllCampaigns(): Promise<EmailCampaign[]> {
  if (!hasDb) return noDb([], "getAllCampaigns")

  try {
    const result = await sql`
      SELECT * FROM email_campaigns 
      ORDER BY created_at DESC
    `
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
    const result = await sql`
      SELECT * FROM email_campaigns 
      WHERE id = ${id}
    `
    return (result[0] as EmailCampaign) || null
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return null
  }
}

// Create new campaign
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

// Update campaign
export async function updateCampaign(id: number, data: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
  if (!hasDb) return noDb(null, "updateCampaign")

  try {
    const updates = Object.entries(data)
      .filter(([key]) => !["id", "created_at"].includes(key))
      .map(([key, value]) => {
        if (key === "target_criteria" || key === "selected_recipients") {
          return sql`${sql.identifier([key])} = ${JSON.stringify(value)}`
        }
        return sql`${sql.identifier([key])} = ${value}`
      })

    if (updates.length === 0) return null

    const setClause = updates.reduce((acc, curr) => sql`${acc}, ${curr}`)

    const result = await sql`
      UPDATE email_campaigns 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    return (result[0] as EmailCampaign) || null
  } catch (error) {
    console.error("Error updating campaign:", error)
    return null
  }
}

// Delete campaign
export async function deleteCampaign(id: number): Promise<boolean> {
  if (!hasDb) return noDb(false, "deleteCampaign")

  try {
    const result = await sql`
      DELETE FROM email_campaigns 
      WHERE id = ${id} AND status = 'draft'
    `
    return result.count > 0
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return false
  }
}

// Get campaign recipients based on target type
export async function getCampaignRecipients(campaign: EmailCampaign): Promise<Array<{ email: string; name?: string }>> {
  if (!hasDb) return noDb([], "getCampaignRecipients")

  try {
    if (campaign.target_type === "all") {
      const result = await sql`
        SELECT email, name FROM waitlist_submissions 
        ORDER BY created_at DESC
      `
      return result.map((r: any) => ({ email: r.email, name: r.name }))
    }

    if (campaign.target_type === "selected" && campaign.selected_recipients) {
      const emails = campaign.selected_recipients
      if (emails.length === 0) return []

      const result = await sql`
        SELECT email, name FROM waitlist_submissions 
        WHERE email = ANY(${emails})
      `
      return result.map((r: any) => ({ email: r.email, name: r.name }))
    }

    if (campaign.target_type === "filtered" && campaign.target_criteria) {
      // Add filtering logic based on criteria
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
      return result.map((r: any) => ({ email: r.email, name: r.name }))
    }

    return []
  } catch (error) {
    console.error("Error getting campaign recipients:", error)
    return []
  }
}

// FIXED: Campaign-specific email sending function
async function sendCampaignEmail(payload: {
  to: string
  from: string
  subject: string
  html: string
}): Promise<{ success: boolean; service?: string; error?: string; details?: any }> {
  const errors: string[] = []

  console.log(`[CAMPAIGN EMAIL] Sending to: ${payload.to}`)
  console.log(`[CAMPAIGN EMAIL] Subject: ${payload.subject}`)
  console.log(`[CAMPAIGN EMAIL] From: ${payload.from}`)

  // Try Resend FIRST (new recommended solution)
  if (process.env.RESEND_API_KEY) {
    console.log("Trying Resend for campaign email...")
    const result = await sendCampaignViaResend(payload)
    if (result.success) return result
    errors.push(`Resend: ${result.error}`)
  }

  // Try Mailgun as backup
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    console.log("Trying Mailgun for campaign email...")
    const result = await sendCampaignViaMailgun(payload)
    if (result.success) return result
    errors.push(`Mailgun: ${result.error}`)
  }

  // Try SendGrid as last resort
  if (process.env.SENDGRID_API_KEY) {
    console.log("Trying SendGrid for campaign email...")
    const result = await sendCampaignViaSendGrid(payload)
    if (result.success) return result
    errors.push(`SendGrid: ${result.error}`)
  }

  return {
    success: false,
    error: "All email services failed for campaign",
    details: {
      errors,
      availableServices: {
        resend: !!process.env.RESEND_API_KEY,
        mailgun: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
        sendgrid: !!process.env.SENDGRID_API_KEY,
      },
    },
  }
}

async function sendCampaignViaResend(payload: {
  to: string
  from: string
  subject: string
  html: string
}): Promise<{ success: boolean; service?: string; error?: string; details?: any }> {
  try {
    // Parse the from field to extract email and name
    const fromMatch = payload.from.match(/^(.+?)\s*<(.+)>$/)
    const fromEmail = fromMatch ? fromMatch[2].trim() : payload.from
    const fromName = fromMatch ? fromMatch[1].trim() : ""

    console.log("Campaign Resend payload details:", {
      originalFrom: payload.from,
      parsedFromEmail: fromEmail,
      parsedFromName: fromName,
      to: payload.to,
      subject: payload.subject,
      htmlLength: payload.html.length,
    })

    // Use verified timesnri.com domain
    let finalFromEmail = fromEmail
    if (!fromEmail.includes("@timesnri.com")) {
      finalFromEmail = "noreply@timesnri.com"
      console.log(`Using verified domain: ${fromEmail} → ${finalFromEmail}`)
    }

    const resendPayload = {
      from: `${fromName} <${finalFromEmail}>`,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }

    console.log("Sending campaign to Resend API:", JSON.stringify(resendPayload, null, 2))

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    })

    const responseData = await response.json()
    console.log("Campaign Resend response:", responseData)

    if (!response.ok) {
      return {
        success: false,
        service: "Resend",
        error: `HTTP ${response.status}: ${responseData.message || "Unknown error"}`,
        details: responseData,
      }
    }

    return {
      success: true,
      service: "Resend",
      details: {
        emailId: responseData.id,
        status: response.status,
        fromEmailUsed: resendPayload.from,
        responseData,
      },
    }
  } catch (error) {
    console.error("Campaign Resend error:", error)
    return {
      success: false,
      service: "Resend",
      error: error instanceof Error ? error.message : "Network error",
      details: error,
    }
  }
}

async function sendCampaignViaMailgun(payload: {
  to: string
  from: string
  subject: string
  html: string
}): Promise<{ success: boolean; service?: string; error?: string; details?: any }> {
  try {
    const formData = new FormData()
    formData.append("from", payload.from)
    formData.append("to", payload.to)
    formData.append("subject", payload.subject)
    formData.append("html", payload.html)

    const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")}`,
      },
      body: formData,
    })

    const responseData = await response.json()

    if (!response.ok) {
      return {
        success: false,
        service: "Mailgun",
        error: `HTTP ${response.status}: ${responseData.message || "Unknown error"}`,
        details: responseData,
      }
    }

    return {
      success: true,
      service: "Mailgun",
      details: responseData,
    }
  } catch (error) {
    return {
      success: false,
      service: "Mailgun",
      error: error instanceof Error ? error.message : "Network error",
      details: error,
    }
  }
}

async function sendCampaignViaSendGrid(payload: {
  to: string
  from: string
  subject: string
  html: string
}): Promise<{ success: boolean; service?: string; error?: string; details?: any }> {
  try {
    const fromMatch = payload.from.match(/^(.+?)\s*<(.+)>$/)
    const fromEmail = fromMatch ? fromMatch[2].trim() : payload.from
    const fromName = fromMatch ? fromMatch[1].trim() : ""

    const verifiedEmail = "timesnri@timesinternet.in"

    const sendGridPayload = {
      personalizations: [
        {
          to: [{ email: payload.to }],
          subject: payload.subject,
        },
      ],
      from: {
        email: verifiedEmail,
        name: fromName || "Times NRI Team",
      },
      content: [
        {
          type: "text/html",
          value: payload.html,
        },
      ],
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendGridPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      return {
        success: false,
        service: "SendGrid",
        error: `HTTP ${response.status}: ${errorData.errors?.[0]?.message || errorData.message || "Unknown error"}`,
        details: errorData,
      }
    }

    const messageId = response.headers.get("x-message-id")

    return {
      success: true,
      service: "SendGrid",
      details: {
        messageId,
        status: response.status,
        fromEmailUsed: verifiedEmail,
      },
    }
  } catch (error) {
    return {
      success: false,
      service: "SendGrid",
      error: error instanceof Error ? error.message : "Network error",
      details: error,
    }
  }
}

// FIXED: Send campaign with proper content and recipient targeting
export async function sendCampaign(campaignId: number): Promise<{ success: boolean; message: string }> {
  if (!hasDb) return noDb({ success: false, message: "Database not available" }, "sendCampaign")

  try {
    console.log(`[CAMPAIGN] Starting campaign ${campaignId}`)

    const campaign = await getCampaignById(campaignId)
    if (!campaign) {
      return { success: false, message: "Campaign not found" }
    }

    if (campaign.status !== "draft" && campaign.status !== "paused") {
      return { success: false, message: "Campaign cannot be sent in current status" }
    }

    // Get recipients based on campaign targeting
    const recipients = await getCampaignRecipients(campaign)
    console.log(`[CAMPAIGN] Found ${recipients.length} recipients for campaign ${campaignId}`)
    console.log(`[CAMPAIGN] Target type: ${campaign.target_type}`)

    if (campaign.target_type === "selected") {
      console.log(`[CAMPAIGN] Selected recipients: ${JSON.stringify(campaign.selected_recipients)}`)
      console.log(`[CAMPAIGN] Actual recipients: ${recipients.map((r) => r.email).join(", ")}`)
    }

    if (recipients.length === 0) {
      return { success: false, message: "No recipients found for this campaign" }
    }

    // Update campaign status to sending
    await updateCampaign(campaignId, {
      status: "sending",
      total_recipients: recipients.length,
      started_at: new Date(),
    })

    // Create campaign logs for all recipients
    for (const recipient of recipients) {
      await sql`
        INSERT INTO email_campaign_logs (campaign_id, recipient_email, recipient_name, status)
        VALUES (${campaignId}, ${recipient.email}, ${recipient.name || null}, 'pending')
      `
    }

    // Send emails with ACTUAL campaign content
    let sentCount = 0
    let failedCount = 0

    for (const recipient of recipients) {
      try {
        console.log(`[CAMPAIGN] Sending to: ${recipient.email}`)

        // Replace template variables in the CAMPAIGN HTML content
        let htmlContent = campaign.html_content
        htmlContent = htmlContent.replace(/\{\{name\}\}/g, recipient.name || "Valued Member")
        htmlContent = htmlContent.replace(/\{\{email\}\}/g, recipient.email)
        htmlContent = htmlContent.replace(/\{\{subject\}\}/g, campaign.subject)

        // FIXED: Use campaign email sending function, not welcome email
        const result = await sendCampaignEmail({
          to: recipient.email,
          from: `${campaign.from_name} <${campaign.from_email}>`,
          subject: campaign.subject,
          html: htmlContent,
        })

        if (result.success) {
          sentCount++
          console.log(`[CAMPAIGN] ✅ Sent to ${recipient.email} via ${result.service}`)
          await sql`
            UPDATE email_campaign_logs 
            SET status = 'sent', sent_at = CURRENT_TIMESTAMP, email_service = ${result.service || "unknown"}
            WHERE campaign_id = ${campaignId} AND recipient_email = ${recipient.email}
          `
        } else {
          failedCount++
          console.log(`[CAMPAIGN] ❌ Failed to send to ${recipient.email}: ${result.error}`)
          await sql`
            UPDATE email_campaign_logs 
            SET status = 'failed', error_message = ${result.error || "Unknown error"}
            WHERE campaign_id = ${campaignId} AND recipient_email = ${recipient.email}
          `
        }
      } catch (error) {
        failedCount++
        console.error(`[CAMPAIGN] Error sending to ${recipient.email}:`, error)
        await sql`
          UPDATE email_campaign_logs 
          SET status = 'failed', error_message = ${error instanceof Error ? error.message : "Unknown error"}
          WHERE campaign_id = ${campaignId} AND recipient_email = ${recipient.email}
        `
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Update campaign with final status
    await updateCampaign(campaignId, {
      status: "sent",
      sent_count: sentCount,
      failed_count: failedCount,
      completed_at: new Date(),
    })

    console.log(`[CAMPAIGN] Completed campaign ${campaignId}: ${sentCount} sent, ${failedCount} failed`)

    return {
      success: true,
      message: `Campaign sent successfully. ${sentCount} sent, ${failedCount} failed.`,
    }
  } catch (error) {
    console.error("Error sending campaign:", error)

    // Update campaign status to failed
    await updateCampaign(campaignId, {
      status: "draft", // Reset to draft so it can be retried
    })

    return {
      success: false,
      message: `Failed to send campaign: ${error instanceof Error ? error.message : "Unknown error"}`,
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
