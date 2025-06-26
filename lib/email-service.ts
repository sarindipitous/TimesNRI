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

    // Send email using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [data.email],
        subject: subject,
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Failed to send welcome email:", error)
      return false
    }

    console.log(`Welcome email sent successfully to ${data.email}`)
    return true
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return false
  }
}
