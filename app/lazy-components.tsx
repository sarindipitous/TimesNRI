"use client"

import type React from "react"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"

// Lazy load components that are below the fold
export const LazyTestimonials = dynamic(
  () => import("../components/testimonials").then((mod) => ({ default: mod.Testimonials })),
  {
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <p>Loading testimonials...</p>
      </div>
    ),
    ssr: false,
  },
)

export const LazyFaq = dynamic(() => import("../components/faq").then((mod) => ({ default: mod.Faq })), {
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <p>Loading FAQ...</p>
    </div>
  ),
  ssr: false,
})

export const LazyCityMap = dynamic(() => import("../components/city-map").then((mod) => ({ default: mod.CityMap })), {
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <p>Loading service locations...</p>
    </div>
  ),
  ssr: false,
})

export const LazyHowItWorks = dynamic(
  () => import("../components/how-it-works").then((mod) => ({ default: mod.HowItWorks })),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    ),
    ssr: false,
  },
)

// Component to handle lazy loading with intersection observer
export function LazyLoadComponent({
  component: Component,
  placeholder,
  id,
}: {
  component: React.ComponentType
  placeholder: React.ReactNode
  id: string
}) {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "200px", // Load when within 200px of viewport
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setShouldLoad(true)
        observer.disconnect()
      }
    }, options)

    const targetElement = document.getElementById(id)
    if (targetElement) {
      observer.observe(targetElement)
    }

    return () => {
      observer.disconnect()
    }
  }, [id])

  return shouldLoad ? <Component /> : placeholder
}
