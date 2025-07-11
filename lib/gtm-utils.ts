// Google Tag Manager utility functions
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

// Initialize dataLayer if it doesn't exist
export const initializeGTM = () => {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || []
  }
}

// Track waitlist signup conversion
export const trackWaitlistSignup = (data: {
  email: string
  name?: string
  source?: string
  city?: string
  parentLocation?: string
  careNeeds?: string
  carePlan?: string
  referredBy?: string
  waitlistNumber?: number
}) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    // Push the conversion event to dataLayer
    window.dataLayer.push({
      event: "waitlist_signup",
      event_category: "conversion",
      event_label: "waitlist_join",
      user_email: data.email,
      user_name: data.name || "",
      signup_source: data.source || "unknown",
      user_city: data.city || "",
      parent_location: data.parentLocation || "",
      care_needs: data.careNeeds || "",
      care_plan: data.carePlan || "",
      referred_by: data.referredBy || "",
      waitlist_number: data.waitlistNumber || 0,
      conversion_value: 1,
      currency: "USD",
    })

    // Also push a generic conversion event for Google Ads
    window.dataLayer.push({
      event: "conversion",
      google_conversion_id: "AW-CONVERSION_ID", // You can update this with your actual conversion ID
      google_conversion_label: "waitlist_signup",
      value: 1,
      currency: "USD",
    })

    console.log("GTM: Waitlist signup tracked", data)
  }
}

// Track page views
export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "page_view",
      page_path: pagePath,
      page_title: pageTitle,
    })
  }
}

// Track custom events
export const trackCustomEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    })
  }
}
