import { getEmailConfig } from "./email-config"

interface EmailData {
  name?: string
  email: string
  parent_location?: string
  care_plan?: string
  waitlist_number?: number
  referral_link?: string
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
      console.error("Missing email configuration")
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
    const emailSent = await tryEmailServices({
      to: data.email,
      from: `${fromName} <${fromEmail}>`,
      subject,
      html: emailHtml,
    })

    if (emailSent) {
      console.log(`Welcome email sent successfully to ${data.email}`)
      return true
    } else {
      console.error("All email services failed")
      return false
    }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return false
  }
}

interface EmailPayload {
  to: string
  from: string
  subject: string
  html: string
}

async function tryEmailServices(payload: EmailPayload): Promise<boolean> {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    console.log("Trying Resend...")
    const success = await sendViaResend(payload)
    if (success) return true
  }

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    console.log("Trying SendGrid...")
    const success = await sendViaSendGrid(payload)
    if (success) return true
  }

  // Try Nodemailer (SMTP)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log("Trying SMTP...")
    const success = await sendViaSMTP(payload)
    if (success) return true
  }

  // Try Mailgun
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    console.log("Trying Mailgun...")
    const success = await sendViaMailgun(payload)
    if (success) return true
  }

  return false
}

async function sendViaResend(payload: EmailPayload): Promise<boolean> {
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

    if (!response.ok) {
      const error = await response.text()
      console.error("Resend error:", error)
      return false
    }

    console.log("Email sent via Resend")
    return true
  } catch (error) {
    console.error("Resend failed:", error)
    return false
  }
}

async function sendViaSendGrid(payload: EmailPayload): Promise<boolean> {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: { email: payload.from.match(/<(.+)>/)?.[1] || payload.from, name: payload.from.split("<")[0].trim() },
        subject: payload.subject,
        content: [{ type: "text/html", value: payload.html }],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("SendGrid error:", error)
      return false
    }

    console.log("Email sent via SendGrid")
    return true
  } catch (error) {
    console.error("SendGrid failed:", error)
    return false
  }
}

async function sendViaSMTP(payload: EmailPayload): Promise<boolean> {
  try {
    // Note: This would require nodemailer package in a real implementation
    // For now, we'll just log that SMTP is configured
    console.log("SMTP configured but requires nodemailer package")
    return false
  } catch (error) {
    console.error("SMTP failed:", error)
    return false
  }
}

async function sendViaMailgun(payload: EmailPayload): Promise<boolean> {
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

    if (!response.ok) {
      const error = await response.text()
      console.error("Mailgun error:", error)
      return false
    }

    console.log("Email sent via Mailgun")
    return true
  } catch (error) {
    console.error("Mailgun failed:", error)
    return false
  }
}
