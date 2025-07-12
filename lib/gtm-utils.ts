// Google Tag Manager utility functions

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

// Initialize GTM dataLayer
export function initializeGTM() {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
  }
}

// Track waitlist signup conversion
export function trackWaitlistSignup(data: {
  email: string
  name: string
  source: string
  city?: string
  parentLocation?: string
  careNeeds?: string[]
  carePlanInterest?: string
  referralCode?: string
  waitlistNumber?: number
}) {
  if (typeof window !== "undefined" && window.dataLayer) {
    // Push the main conversion event
    window.dataLayer.push({
      event: "waitlist_signup",
      user_email: data.email,
      user_name: data.name,
      signup_source: data.source,
      user_city: data.city || "",
      parent_location: data.parentLocation || "",
      care_needs: data.careNeeds ? data.careNeeds.join(", ") : "",
      care_plan_interest: data.carePlanInterest || "",
      referral_code: data.referralCode || "",
      waitlist_number: data.waitlistNumber || 0,
      conversion_value: 1,
      currency: "USD",
      event_category: "engagement",
      event_label: "waitlist_signup",
    })

    // Also push a generic conversion event for Google Ads
    window.dataLayer.push({
      event: "conversion",
      conversion_id: "waitlist_signup",
      conversion_value: 1,
      currency: "USD",
    })

    console.log("GTM: Waitlist signup tracked", data)
  }
}

// Track form interactions
export function trackFormStart(formName: string) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "form_start",
      form_name: formName,
      event_category: "engagement",
      event_label: "form_interaction",
    })
  }
}

export function trackFormSubmit(formName: string, success: boolean) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "form_submit",
      form_name: formName,
      form_success: success,
      event_category: "engagement",
      event_label: "form_submission",
    })
  }
}

// Track button clicks
export function trackButtonClick(buttonName: string, location: string) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "button_click",
      button_name: buttonName,
      click_location: location,
      event_category: "engagement",
      event_label: "button_interaction",
    })
  }
}

// Track page views
export function trackPageView(pagePath: string, pageTitle: string) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "page_view",
      page_path: pagePath,
      page_title: pageTitle,
      event_category: "engagement",
      event_label: "page_navigation",
    })
  }
}
