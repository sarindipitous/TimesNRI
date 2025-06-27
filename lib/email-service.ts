import { getEmailConfig } from "./email-config"

interface EmailData {
  name?: string
  email: string
  parent_location?: string
  care_plan?: string
  waitlist_number?: number
  referral_link?: string
}

interface EmailResult {
  success: boolean
  service?: string
  error?: string
  details?: any
}

export async function sendWelcomeEmail(data: EmailData): Promise<boolean> {
  try {
    // Check if welcome emails are enabled
    const enabled = await getEmailConfig("welcome_email_enabled")
    if (enabled !== "true") {
      console.log("Welcome emails are disabled")
      return false
    }

    // Get email configuration
    const [subject, fromName, fromEmail, template] = await Promise.all([
      getEmailConfig("welcome_email_subject"),
      getEmailConfig("welcome_email_from_name"),
      getEmailConfig("welcome_email_from_email"),
      getEmailConfig("welcome_email_template"),
    ])

    if (!subject || !fromEmail || !template) {
      console.error("Missing email configuration:", {
        subject: !!subject,
        fromEmail: !!fromEmail,
        template: !!template,
      })
      return false
    }

    // Replace template variables
    let emailHtml = template
    emailHtml = emailHtml.replace(/\{\{name\}\}/g, data.name || "Valued Member")
    emailHtml = emailHtml.replace(/\{\{email\}\}/g, data.email)
    emailHtml = emailHtml.replace(/\{\{parent_location\}\}/g, data.parent_location || "your area")
    emailHtml = emailHtml.replace(/\{\{care_plan\}\}/g, data.care_plan || "Not specified")
    emailHtml = emailHtml.replace(/\{\{waitlist_number\}\}/g, data.waitlist_number?.toString() || "TBD")
    emailHtml = emailHtml.replace(/\{\{referral_link\}\}/g, data.referral_link || "#")

    // Try different email services in order of preference
    const result = await tryEmailServices({
      to: data.email,
      from: `${fromName} <${fromEmail}>`,
      subject,
      html: emailHtml,
    })

    if (result.success) {
      console.log(`Welcome email sent successfully to ${data.email} via ${result.service}`)
      return true
    } else {
      console.error("All email services failed:", result.error)
      return false
    }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return false
  }
}

// Enhanced version that returns detailed results for debugging
export async function sendWelcomeEmailWithDetails(data: EmailData): Promise<EmailResult> {
  try {
    // Check if welcome emails are enabled
    const enabled = await getEmailConfig("welcome_email_enabled")
    if (enabled !== "true") {
      return { success: false, error: "Welcome emails are disabled in configuration" }
    }

    // Get email configuration
    const [subject, fromName, fromEmail, template] = await Promise.all([
      getEmailConfig("welcome_email_subject"),
      getEmailConfig("welcome_email_from_name"),
      getEmailConfig("welcome_email_from_email"),
      getEmailConfig("welcome_email_template"),
    ])

    if (!subject || !fromEmail || !template) {
      return {
        success: false,
        error: "Missing email configuration",
        details: { subject: !!subject, fromEmail: !!fromEmail, template: !!template },
      }
    }

    // Replace template variables
    let emailHtml = template
    emailHtml = emailHtml.replace(/\{\{name\}\}/g, data.name || "Valued Member")
    emailHtml = emailHtml.replace(/\{\{email\}\}/g, data.email)
    emailHtml = emailHtml.replace(/\{\{parent_location\}\}/g, data.parent_location || "your area")
    emailHtml = emailHtml.replace(/\{\{care_plan\}\}/g, data.care_plan || "Not specified")
    emailHtml = emailHtml.replace(/\{\{waitlist_number\}\}/g, data.waitlist_number?.toString() || "TBD")
    emailHtml = emailHtml.replace(/\{\{referral_link\}\}/g, data.referral_link || "#")

    // Try different email services in order of preference
    const result = await tryEmailServices({
      to: data.email,
      from: `${fromName} <${fromEmail}>`,
      subject,
      html: emailHtml,
    })

    return result
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      details: error,
    }
  }
}

interface EmailPayload {
  to: string
  from: string
  subject: string
  html: string
}

async function tryEmailServices(payload: EmailPayload): Promise<EmailResult> {
  const errors: string[] = []

  // Try SendGrid first since you have it configured
  if (process.env.SENDGRID_API_KEY) {
    console.log("Trying SendGrid...")
    const result = await sendViaSendGrid(payload)
    if (result.success) return result
    errors.push(`SendGrid: ${result.error}`)
  }

  // Try Resend as backup
  if (process.env.RESEND_API_KEY) {
    console.log("Trying Resend...")
    const result = await sendViaResend(payload)
    if (result.success) return result
    errors.push(`Resend: ${result.error}`)
  }

  // Try Mailgun as backup
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    console.log("Trying Mailgun...")
    const result = await sendViaMailgun(payload)
    if (result.success) return result
    errors.push(`Mailgun: ${result.error}`)
  }

  return {
    success: false,
    error: "All email services failed",
    details: {
      errors,
      availableServices: {
        sendgrid: !!process.env.SENDGRID_API_KEY,
        resend: !!process.env.RESEND_API_KEY,
        mailgun: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
      },
    },
  }
}

async function sendViaSendGrid(payload: EmailPayload): Promise<EmailResult> {
  try {
    // Parse the from field to extract email and name
    const fromMatch = payload.from.match(/^(.+?)\s*<(.+)>$/)
    const fromEmail = fromMatch ? fromMatch[2].trim() : payload.from
    const fromName = fromMatch ? fromMatch[1].trim() : ""

    console.log("SendGrid payload:", {
      to: payload.to,
      fromEmail,
      fromName,
      subject: payload.subject,
      htmlLength: payload.html.length,
    })

    const sendGridPayload = {
      personalizations: [
        {
          to: [{ email: payload.to }],
          subject: payload.subject,
        },
      ],
      from: {
        email: fromEmail,
        name: fromName || undefined,
      },
      content: [
        {
          type: "text/html",
          value: payload.html,
        },
      ],
    }

    console.log("Sending to SendGrid API...")
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendGridPayload),
    })

    console.log("SendGrid response status:", response.status)
    console.log("SendGrid response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("SendGrid error response:", errorText)

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
        details: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorData,
          payload: sendGridPayload,
        },
      }
    }

    const messageId = response.headers.get("x-message-id")
    console.log("SendGrid success! Message ID:", messageId)

    return {
      success: true,
      service: "SendGrid",
      details: {
        messageId,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      },
    }
  } catch (error) {
    console.error("SendGrid network error:", error)
    return {
      success: false,
      service: "SendGrid",
      error: error instanceof Error ? error.message : "Network error",
      details: {
        error: error,
        payload: payload,
      },
    }
  }
}

async function sendViaResend(payload: EmailPayload): Promise<EmailResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    })

    const responseData = await response.json()

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
      details: responseData,
    }
  } catch (error) {
    return {
      success: false,
      service: "Resend",
      error: error instanceof Error ? error.message : "Network error",
      details: error,
    }
  }
}

async function sendViaMailgun(payload: EmailPayload): Promise<EmailResult> {
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
