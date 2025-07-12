// Google Tag Manager utility functions for tracking events

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== "undefined") {
  window.dataLayer = window.dataLayer || []
}

// Generic GTM event tracking function
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    })
    console.log("GTM Event Tracked:", eventName, parameters)
  }
}

// Track waitlist signup conversion
export const trackWaitlistSignup = (userData: {
  email: string
  name: string
  city?: string
  parentLocation?: string
  careNeeds?: string[]
  carePlanInterest?: string
  referralCode?: string
  source?: string
}) => {
  const eventData = {
    event: "waitlist_signup",
    event_category: "conversion",
    event_label: "waitlist_join",
    user_email: userData.email,
    user_name: userData.name,
    user_city: userData.city || "",
    parent_location: userData.parentLocation || "",
    care_needs: userData.careNeeds?.join(", ") || "",
    care_plan_interest: userData.carePlanInterest || "",
    referral_code: userData.referralCode || "",
    signup_source: userData.source || "direct",
    conversion_value: 1,
    currency: "USD",
  }

  trackEvent("waitlist_signup", eventData)

  // Also track as a generic conversion for Google Ads
  trackEvent("conversion", {
    send_to: "AW-CONVERSION_ID/CONVERSION_LABEL", // Replace with actual conversion ID
    value: 1,
    currency: "USD",
    event_category: "conversion",
    event_label: "waitlist_signup",
  })
}

// Track page views
export const trackPageView = (pagePath: string, pageTitle: string) => {
  trackEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  })
}

// Track button clicks
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent("button_click", {
    button_name: buttonName,
    click_location: location,
  })
}

// Track form interactions
export const trackFormStart = (formName: string) => {
  trackEvent("form_start", {
    form_name: formName,
  })
}

export const trackFormSubmit = (formName: string, success: boolean) => {
  trackEvent("form_submit", {
    form_name: formName,
    success: success,
  })
}
