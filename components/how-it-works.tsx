"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Users, Bell, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { getBlobUrl } from "@/utils/image-utils"

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length)
    }, 8000) // Change step every 8 seconds

    return () => clearInterval(interval)
  }, [])

  const steps = [
    {
      title: "Tell us what you need.",
      description:
        "Chat with our concierge about your parent's requirements. We'll understand their specific needs and create a personalized care plan.",
      icon: <MessageSquare className="h-8 w-8" />,
      image: getBlobUrl("/images/whatsapp-consultation.png"),
      altText: "Woman using WhatsApp to coordinate care with Times NRI",
    },
    {
      title: "We coordinate everything.",
      description:
        "Our local partners step in and handle it all. From scheduling appointments to arranging transportation, we take care of the details.",
      icon: <Users className="h-8 w-8" />,
      image: getBlobUrl("/images/local-care-team.png"),
      altText: "Professional caregiver in blue scrubs assisting an elderly man with his walking cane",
    },
    {
      title: "You stay informed.",
      description:
        "Get real-time updates, bills, and visit summaries through our secure dashboard. Never wonder what's happening with your parents' care.",
      icon: <Bell className="h-8 w-8" />,
      image: getBlobUrl("/images/real-time-updates.jpg"),
      altText: "Smartphone showing real-time health updates after a doctor's visit",
    },
  ]

  const nextStep = () => {
    setActiveStep((current) => (current + 1) % steps.length)
  }

  const prevStep = () => {
    setActiveStep((current) => (current - 1 + steps.length) % steps.length)
  }

  return (
    <div className="mx-auto max-w-4xl py-12">
      {/* Step indicators with connecting lines */}
      <div className="relative flex justify-between mb-12">
        {/* Horizontal connecting line that spans the entire width */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200"></div>

        {steps.map((step, index) => (
          <div
            key={index}
            className="relative flex flex-col items-center cursor-pointer z-10"
            onClick={() => setActiveStep(index)}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 ${
                activeStep === index ? "bg-[#FF5722] text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {index + 1}
            </div>
            <p className="mt-2 text-sm font-medium text-center">{step.title}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4 order-2 md:order-1">
          <div className="inline-flex items-center justify-center rounded-lg bg-[#FF5722]/10 p-3">
            {steps[activeStep].icon}
          </div>
          <h3 className="text-2xl font-bold text-[#1E3A8A]">{steps[activeStep].title}</h3>
          <p className="text-gray-700">{steps[activeStep].description}</p>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={prevStep}
              className="rounded-full bg-white p-2 shadow-soft hover:bg-gray-100 transition-colors"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-5 w-5 text-primary" />
            </button>

            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full ${activeStep === index ? "bg-[#FF5722]" : "bg-gray-300"}`}
                  onClick={() => setActiveStep(index)}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              className="rounded-full bg-white p-2 shadow-soft hover:bg-gray-100 transition-colors"
              aria-label="Next step"
            >
              <ChevronRight className="h-5 w-5 text-primary" />
            </button>
          </div>
        </div>
        <div className="relative h-[250px] sm:h-[300px] rounded-lg overflow-hidden shadow-lg order-1 md:order-2">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/20 to-transparent z-10"></div>
          <div className="relative w-full h-full">
            <Image
              src={steps[activeStep].image || "/placeholder.svg"}
              alt={steps[activeStep].altText}
              fill
              className="object-cover"
              priority={activeStep === 1}
              unoptimized
            />
          </div>
          {activeStep === 0 && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
              <p className="text-sm font-medium text-[#1E3A8A]">WhatsApp Consultation</p>
            </div>
          )}
          {activeStep === 1 && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
              <p className="text-sm font-medium text-[#1E3A8A]">Verified Caregiver</p>
            </div>
          )}
          {activeStep === 2 && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
              <p className="text-sm font-medium text-[#1E3A8A]">Care Updates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
