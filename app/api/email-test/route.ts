import { NextResponse } from "next/server"

export async function GET() {
  const emailServices = []

  // Check which email services are configured
  if (process.env.RESEND_API_KEY) {
    emailServices.push({
      name: "Resend",
      configured: true,
      status: "✅ Ready",
      setup: "API key configured",
    })
  } else {
    emailServices.push({
      name: "Resend",
      configured: false,
      status: "❌ Missing",
      setup: "Add RESEND_API_KEY environment variable",
    })
  }

  if (process.env.SENDGRID_API_KEY) {
    emailServices.push({
      name: "SendGrid",
      configured: true,
      status: "✅ Ready",
      setup: "API key configured",
    })
  } else {
    emailServices.push({
      name: "SendGrid",
      configured: false,
      status: "❌ Missing",
      setup: "Add SENDGRID_API_KEY environment variable",
    })
  }

  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    emailServices.push({
      name: "Mailgun",
      configured: true,
      status: "✅ Ready",
      setup: "API key and domain configured",
    })
  } else {
    emailServices.push({
      name: "Mailgun",
      configured: false,
      status: "❌ Missing",
      setup: "Add MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables",
    })
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    emailServices.push({
      name: "SMTP",
      configured: true,
      status: "✅ Ready",
      setup: "SMTP credentials configured",
    })
  } else {
    emailServices.push({
      name: "SMTP",
      configured: false,
      status: "❌ Missing",
      setup: "Add SMTP_HOST, SMTP_USER, SMTP_PASS environment variables",
    })
  }

  const configuredServices = emailServices.filter((s) => s.configured)

  return NextResponse.json({
    success: true,
    emailServicesConfigured: configuredServices.length > 0,
    totalServices: emailServices.length,
    configuredCount: configuredServices.length,
    services: emailServices,
    recommendation:
      configuredServices.length === 0
        ? "Set up at least one email service to send emails"
        : `${configuredServices.length} email service(s) ready to use`,
  })
}
