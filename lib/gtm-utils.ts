// Google Tag Manager utility functions for tracking events

declare global {
  interface Window {
    dataLayer: any[]
  }
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== "undefined") {
  window.dataLayer = window.dataLayer || []
}

// Generic function to push events to dataLayer
export function trackEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    })
  }
}

// Track waitlist signup
export function trackWaitlistSignup(email: string, source = "unknown") {
  trackEvent("waitlist_signup", {
    email_provided: !!email,
    signup_source: source,
    timestamp: new Date().toISOString(),
  })
}

// Track form interactions
export function trackFormStart(formName: string) {
  trackEvent("form_start", {
    form_name: formName,
    timestamp: new Date().toISOString(),
  })
}

export function trackFormSubmit(formName: string, success = true) {
  trackEvent("form_submit", {
    form_name: formName,
    success: success,
    timestamp: new Date().toISOString(),
  })
}

// Track button clicks
export function trackButtonClick(buttonName: string, location = "unknown") {
  trackEvent("button_click", {
    button_name: buttonName,
    button_location: location,
    timestamp: new Date().toISOString(),
  })
}

// Track page views (for SPA navigation)
export function trackPageView(pagePath: string, pageTitle: string) {
  trackEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle,
    timestamp: new Date().toISOString(),
  })
}
