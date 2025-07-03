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

// Update campaign - COMPLETELY REWRITTEN to fix SQL construction
export async function updateCampaign(id: number, data: Partial<EmailCampaign>): Promise<EmailCampaign | null> {
  if (!hasDb) return noDb(null, "updateCampaign")

  try {
    console.log(`[UPDATE CAMPAIGN] Updating campaign ${id} with data:`, data)

    // Handle each possible field update explicitly
    if (data.status && data.total_recipients !== undefined && data.started_at) {
      // This is the "sending" status update
      const result = await sql`
        UPDATE email_campaigns 
        SET status = ${data.status}, 
            total_recipients = ${data.total_recipients}, 
            started_at = ${data.started_at}
        WHERE id = ${id}
        RETURNING *
      `
      return (result[0] as EmailCampaign) || null
    }

    if (data.status && data.sent_count !== undefined && data.failed_count !== undefined && data.completed_at) {
      // This is the "sent" status update
      const result = await sql`
        UPDATE email_campaigns 
        SET status = ${data.status}, 
            sent_count = ${data.sent_count}, 
            failed_count = ${data.failed_count}, 
            completed_at = ${data.completed_at}
        WHERE id = ${id}
        RETURNING *
      `
      return (result[0] as EmailCampaign) || null
    }

    if (data.status === "draft") {
      // This is the reset to draft status
      const result = await sql`
        UPDATE email_campaigns 
        SET status = ${data.status}
        WHERE id = ${id}
        RETURNING *
      `
      return (result[0] as EmailCampaign) || null
    }

    // Handle other single field updates
    if (data.name) {
      const result = await sql`
        UPDATE email_campaigns 
        SET name = ${data.name}
        WHERE id = ${id}
        RETURNING *
      `
      return (result[0] as EmailCampaign) || null
    }

    if (data.subject) {
      const result = await sql`
        UPDATE email_campaigns 
        SET subject = ${data.subject}
        WHERE id = ${id}
        RETURNING *
      `
      return (result[0] as EmailCampaign) || null
    }

    if (data.html_content) {
      const result = await sql`
        UPDATE email_campaigns 
        SET html_content = ${data.html_content}
        WHERE id = ${id}
        RETURNING *
      `
      return (result[0] as EmailCampaign) || null
    }

    if (data.target_type) {
      const result = await sql`
        UPDATE email_campaigns 
        SET target_type = ${data.target_type}
        WHERE id = ${id}
        RETURNING *
      `
      return (result[0] as EmailCampaign) || null
    }

    if (data.selected_recipients) {
      const result = await sql`
        UPDATE email_campaigns 
        SET selected_recipients = ${JSON.stringify(data.selected_recipients)}
        WHERE id = ${id}
        RETURNING *
      `
      return (result[0] as EmailCampaign) || null
    }

    console.log(`[UPDATE CAMPAIGN] No matching update pattern for data:`, data)
    return null
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

// Get campaign recipients with proper targeting logic
export async function getCampaignRecipients(campaign: EmailCampaign): Promise<Array<{ email: string; name?: string }>> {
  if (!hasDb) return noDb([], "getCampaignRecipients")

  try {
    console.log(`[TARGETING] Campaign ${campaign.id} - Type: ${campaign.target_type}`)

    if (campaign.target_type === "all") {
      console.log(`[TARGETING] Selecting ALL waitlist members`)
      const result = await sql`
        SELECT email, name FROM waitlist_submissions 
        ORDER BY created_at DESC
      `
      console.log(`[TARGETING] Found ${result.length} total waitlist members`)
      return result.map((r: any) => ({ email: r.email, name: r.name }))
    }

    if (campaign.target_type === "selected") {
      let selectedEmails = campaign.selected_recipients

      console.log(`[TARGETING] Selected recipients raw:`, selectedEmails)

      // Handle different data types for selected_recipients
      if (typeof selectedEmails === "string") {
        try {
          selectedEmails = JSON.parse(selectedEmails)
          console.log(`[TARGETING] Parsed from JSON string:`, selectedEmails)
        } catch (e) {
          console.error(`[TARGETING] Failed to parse selected_recipients as JSON:`, e)
          return []
        }
      }

      // Ensure it's an array
      if (!Array.isArray(selectedEmails)) {
        console.error(`[TARGETING] selected_recipients is not an array:`, selectedEmails)
        return []
      }

      if (selectedEmails.length === 0) {
        console.log(`[TARGETING] No recipients selected, returning empty array`)
        return []
      }

      console.log(`[TARGETING] Filtering waitlist for ${selectedEmails.length} selected emails:`, selectedEmails)

      const result = await sql`
        SELECT email, name FROM waitlist_submissions 
        WHERE email = ANY(${selectedEmails})
      `

      console.log(`[TARGETING] Found ${result.length} matching recipients in waitlist`)
      console.log(
        `[TARGETING] Matching emails:`,
        result.map((r: any) => r.email),
      )

      // CRITICAL CHECK: Verify we're not accidentally selecting all users
      const allWaitlistCount = await sql`SELECT COUNT(*) as count FROM waitlist_submissions`
      const totalWaitlist = Number(allWaitlistCount[0].count)

      if (result.length === totalWaitlist && selectedEmails.length < totalWaitlist) {
        console.error(
          `[TARGETING] CRITICAL ERROR: Selected ${selectedEmails.length} recipients but query returned ALL ${totalWaitlist} waitlist members!`,
        )
        console.error(`[TARGETING] This indicates a serious targeting bug!`)
        // Return empty to prevent mass email
        return []
      }

      return result.map((r: any) => ({ email: r.email, name: r.name }))
    }

    if (campaign.target_type === "filtered" && campaign.target_criteria) {
      console.log(`[TARGETING] Applying filter criteria:`, campaign.target_criteria)

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
      console.log(`[TARGETING] Filtered query returned ${result.length} recipients`)
      return result.map((r: any) => ({ email: r.email, name: r.name }))
    }

    console.log(`[TARGETING] No valid targeting configuration, returning empty array`)
    return []
  } catch (error) {
    console.error("Error getting campaign recipients:", error)
    return []
  }
}

// Campaign-specific email sending function
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

// Send campaign with enhanced targeting verification
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

    // Get recipients with enhanced logging
    const recipients = await getCampaignRecipients(campaign)
    console.log(`[CAMPAIGN] Campaign ${campaignId} targeting analysis:`)
    console.log(`[CAMPAIGN] - Target type: ${campaign.target_type}`)
    console.log(`[CAMPAIGN] - Selected recipients: ${JSON.stringify(campaign.selected_recipients)}`)
    console.log(`[CAMPAIGN] - Final recipient count: ${recipients.length}`)
    console.log(`[CAMPAIGN] - Final recipient emails: ${recipients.map((r) => r.email).join(", ")}`)

    // CRITICAL SAFETY CHECK: Prevent accidental mass emails
    if (campaign.target_type === "selected") {
      const selectedEmails = campaign.selected_recipients || []
      const totalWaitlist = await sql`SELECT COUNT(*) as count FROM waitlist_submissions`
      const totalWaitlistCount = Number(totalWaitlist[0].count)

      if (recipients.length === totalWaitlistCount && selectedEmails.length < totalWaitlistCount) {
        console.error(
          `[CAMPAIGN] CRITICAL SAFETY STOP: Campaign ${campaignId} was configured for ${selectedEmails.length} selected recipients but would send to ALL ${totalWaitlistCount} waitlist members!`,
        )
        return {
          success: false,
          message: `SAFETY STOP: Campaign configured for ${selectedEmails.length} recipients but would send to ALL ${totalWaitlistCount} users. Campaign blocked to prevent mass email.`,
        }
      }

      if (recipients.length > selectedEmails.length) {
        console.error(
          `[CAMPAIGN] CRITICAL SAFETY STOP: Campaign ${campaignId} configured for ${selectedEmails.length} recipients but would send to ${recipients.length} recipients!`,
        )
        return {
          success: false,
          message: `SAFETY STOP: Campaign configured for ${selectedEmails.length} recipients but would send to ${recipients.length}. Campaign blocked.`,
        }
      }
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

        // Use campaign email sending function, not welcome email
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
