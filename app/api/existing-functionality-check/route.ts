import { NextResponse } from "next/server"
import { getAllWaitlistSubmissions, getWaitlistStats } from "@/lib/db"
import { sendWelcomeEmailWithDetails } from "@/lib/email-service"
import { getEmailConfig } from "@/lib/email-config"

export const dynamic = "force-dynamic"

export async function GET() {
  const functionalityCheck = {
    timestamp: new Date().toISOString(),
    existing_features: {
      waitlist: {
        get_submissions: false,
        get_stats: false,
        data_integrity: false,
      },
      email_service: {
        welcome_email_function: false,
        email_config: false,
        service_availability: false,
      },
      admin_pages: {
        waitlist_management: false,
        email_configuration: false,
        blog_management: false,
      },
      api_routes: {
        waitlist_api: false,
        email_test_api: false,
        dashboard_data: false,
      },
    },
    issues: [] as string[],
    warnings: [] as string[],
    data_samples: {} as any,
  }

  try {
    // 1. Test Waitlist Functionality
    console.log("Testing existing waitlist functionality...")
    try {
      const submissions = await getAllWaitlistSubmissions(5, 0)
      functionalityCheck.existing_features.waitlist.get_submissions = true
      functionalityCheck.data_samples.waitlist_count = submissions.length

      // Check data integrity
      if (submissions.length > 0) {
        const firstSubmission = submissions[0]
        const hasRequiredFields = firstSubmission.email && firstSubmission.id
        functionalityCheck.existing_features.waitlist.data_integrity = hasRequiredFields
        functionalityCheck.data_samples.sample_submission = {
          id: firstSubmission.id,
          email: firstSubmission.email,
          has_name: !!firstSubmission.name,
          has_location: !!(firstSubmission.location || firstSubmission.parent_location),
        }
      }

      const stats = await getWaitlistStats()
      functionalityCheck.existing_features.waitlist.get_stats = true
      functionalityCheck.data_samples.waitlist_stats = stats
    } catch (error) {
      functionalityCheck.issues.push(`Waitlist functionality broken: ${error}`)
    }

    // 2. Test Email Service
    console.log("Testing email service functionality...")
    try {
      // Test if the function exists and is callable
      functionalityCheck.existing_features.email_service.welcome_email_function =
        typeof sendWelcomeEmailWithDetails === "function"

      // Test email configuration
      const emailEnabled = await getEmailConfig("welcome_email_enabled")
      const emailSubject = await getEmailConfig("welcome_email_subject")
      functionalityCheck.existing_features.email_service.email_config = !!(emailEnabled || emailSubject)
      functionalityCheck.data_samples.email_config = {
        enabled: emailEnabled,
        has_subject: !!emailSubject,
      }
    } catch (error) {
      functionalityCheck.issues.push(`Email service functionality broken: ${error}`)
    }

    // 3. Test API Routes
    console.log("Testing existing API routes...")
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    try {
      const waitlistResponse = await fetch(`${baseUrl}/api/waitlist`)
      functionalityCheck.existing_features.api_routes.waitlist_api = waitlistResponse.ok
      if (!waitlistResponse.ok) {
        functionalityCheck.issues.push(`Waitlist API broken: ${waitlistResponse.status}`)
      }
    } catch (error) {
      functionalityCheck.issues.push(`Waitlist API unreachable: ${error}`)
    }

    try {
      const emailTestResponse = await fetch(`${baseUrl}/api/email-test`)
      functionalityCheck.existing_features.api_routes.email_test_api = emailTestResponse.ok
      if (!emailTestResponse.ok) {
        functionalityCheck.warnings.push(`Email test API issue: ${emailTestResponse.status}`)
      }
    } catch (error) {
      functionalityCheck.warnings.push(`Email test API unreachable: ${error}`)
    }

    try {
      const dashboardResponse = await fetch(`${baseUrl}/api/dashboard-data`)
      functionalityCheck.existing_features.api_routes.dashboard_data = dashboardResponse.ok
      if (!dashboardResponse.ok) {
        functionalityCheck.warnings.push(`Dashboard API issue: ${dashboardResponse.status}`)
      }
    } catch (error) {
      functionalityCheck.warnings.push(`Dashboard API unreachable: ${error}`)
    }

    // 4. Check for any breaking changes
    const criticalIssues = functionalityCheck.issues.filter(
      (issue) =>
        issue.includes("Waitlist functionality broken") || issue.includes("Email service functionality broken"),
    )

    const overallHealth = {
      critical_systems_working: criticalIssues.length === 0,
      waitlist_functional: functionalityCheck.existing_features.waitlist.get_submissions,
      email_functional: functionalityCheck.existing_features.email_service.welcome_email_function,
      apis_functional: functionalityCheck.existing_features.api_routes.waitlist_api,
    }

    return NextResponse.json({
      healthy: overallHealth.critical_systems_working,
      summary: {
        critical_issues: criticalIssues.length,
        warnings: functionalityCheck.warnings.length,
        waitlist_working: overallHealth.waitlist_functional,
        email_working: overallHealth.email_functional,
        apis_working: overallHealth.apis_functional,
      },
      ...functionalityCheck,
      overall_health: overallHealth,
      recommendations: [
        ...(overallHealth.critical_systems_working
          ? ["✅ All critical systems functioning normally"]
          : ["🚨 Critical systems have issues - investigate immediately"]),
        ...(functionalityCheck.issues.length > 0 ? ["🔧 Fix critical issues before proceeding"] : []),
        ...(functionalityCheck.warnings.length > 0 ? ["⚠️ Review warnings for potential improvements"] : []),
        "🧪 Run additional tests after any fixes",
      ],
    })
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        critical: true,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
