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
    console.log("Starting sendWelcomeEmail for:", data.email)

    // Check if welcome emails are enabled
    const enabled = await getEmailConfig("welcome_email_enabled")
    console.log("Welcome emails enabled:", enabled)

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

    console.log("Email config loaded:", { subject, fromName, fromEmail, hasTemplate: !!template })

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

    console.log("Template variables replaced, attempting to send email...")

    // Try SendGrid first
    const emailSent = await sendViaSendGrid({
      to: data.email,
      from: `${fromName} <${fromEmail}>`,
      subject,
      html: emailHtml,
    })

    if (emailSent) {
      console.log(`Welcome email sent successfully to ${data.email}`)
      return true
    } else {
      console.error("Failed to send email via SendGrid")
      return false
    }
  } catch (error) {
    console.error("Error in sendWelcomeEmail:", error)
    return false
  }
}

interface EmailPayload {
  to: string
  from: string
  subject: string
  html: string
}

async function sendViaSendGrid(payload: EmailPayload): Promise<boolean> {
  try {
    console.log("Attempting to send via SendGrid...")

    if (!process.env.SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY not found in environment variables")
      return false
    }

    console.log("SendGrid API key found, preparing request...")

    // Extract email and name from the "from" field
    const fromMatch = payload.from.match(/^(.+?)\s*<(.+)>$/)
    const fromName = fromMatch ? fromMatch[1].trim() : "Times NRI"
    const fromEmail = fromMatch ? fromMatch[2].trim() : payload.from

    console.log("Parsed from field:", { fromName, fromEmail })

    const requestBody = {
      personalizations: [
        {
          to: [{ email: payload.to }],
          subject: payload.subject,
        },
      ],
      from: {
        email: fromEmail,
        name: fromName,
      },
      content: [
        {
          type: "text/html",
          value: payload.html,
        },
      ],
    }

    console.log("SendGrid request body prepared:", {
      to: payload.to,
      from: `${fromName} <${fromEmail}>`,
      subject: payload.subject,
      contentLength: payload.html.length,
    })

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("SendGrid response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("SendGrid error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      return false
    }

    const result = await response.text()
    console.log("SendGrid success response:", result)
    return true
  } catch (error) {
    console.error("SendGrid request failed:", error)
    return false
  }
}
