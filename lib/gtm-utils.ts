// Google Tag Manager utility functions
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
export function trackWaitlistSignup(planName?: string, source?: string) {
  trackEvent("waitlist_signup", {
    plan_name: planName || "unknown",
    source: source || "unknown",
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
export function trackButtonClick(buttonName: string, location?: string) {
  trackEvent("button_click", {
    button_name: buttonName,
    location: location || "unknown",
    timestamp: new Date().toISOString(),
  })
}
