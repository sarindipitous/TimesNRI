import { NextResponse } from "next/server"
import { getEmailConfig } from "@/lib/email-config"

export async function GET() {
  try {
    const template = await getEmailConfig("welcome_email_template")

    if (!template) {
      return new NextResponse("No email template configured", { status: 404 })
    }

    // Replace variables with sample data for preview
    let html = template
    html = html.replace(/\{\{name\}\}/g, "John Doe")
    html = html.replace(/\{\{email\}\}/g, "john.doe@example.com")
    html = html.replace(/\{\{parent_location\}\}/g, "Mumbai, India")
    html = html.replace(/\{\{care_plan\}\}/g, "Peace Plan - $50/month")
    html = html.replace(/\{\{waitlist_number\}\}/g, "42")
    html = html.replace(/\{\{referral_link\}\}/g, "https://timesnri.com?ref=john.doe@example.com")

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error generating email preview:", error)
    return new NextResponse("Error generating preview", { status: 500 })
  }
}
