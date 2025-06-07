"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"
import Image from "next/image"
import { getBlobUrl } from "@/utils/image-utils"

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  const testimonials = [
    {
      name: "Rajiv Mehta",
      location: "San Francisco, USA",
      occupation: "Software Engineer",
      quote:
        "After my mother's fall last year, I spent weeks coordinating care from San Francisco, taking emergency leave and making frantic calls at 2 AM. Times NRI has transformed this experience. Their team in Mumbai not only arranged immediate physiotherapy but also installed safety modifications in her home. The detailed reports after each visit, including photos and medical notes, give me confidence that she's receiving care that I would provide myself if I were there.",
      image: getBlobUrl("/images/testimonial-rajiv.jpg"),
      rating: 5,
      relationship: "Caring for mother in Mumbai",
      duration: "Client for 8 months",
    },
    {
      name: "Priya Sharma",
      location: "Toronto, Canada",
      occupation: "Healthcare Consultant",
      quote:
        "When my father needed cardiac surgery, I was stuck in Toronto during a critical project. The Times NRI team didn't just find a specialist—they researched the best cardiac surgeons in Delhi, arranged second opinions, and negotiated hospital rates. Their medical coordinator attended every appointment, asked questions I would have asked, and sent me video summaries. During recovery, they coordinated home nursing and physiotherapy. They became my father's advocates when I couldn't be there physically.",
      image: getBlobUrl("/images/testimonial-priya.jpg"),
      rating: 5,
      relationship: "Caring for father in Delhi",
      duration: "Client for 14 months",
    },
    {
      name: "Anand Patel",
      location: "Chicago, USA",
      occupation: "Financial Analyst",
      quote:
        "The guilt of moving abroad while my parents aged was overwhelming. Weekly video calls weren't enough, especially when I could see my father struggling with basic tasks but insisting everything was fine. Times NRI provided something invaluable—honest assessment and intervention. Their care coordinator noticed my father's mobility issues during routine visits and arranged for a geriatric assessment that identified early Parkinson's. This early diagnosis has made all the difference in managing his condition. The transparency is what I value most.",
      image: getBlobUrl("/images/testimonial-anand.jpg"),
      rating: 4,
      relationship: "Caring for both parents in Bangalore",
      duration: "Client for 11 months",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length)
    }, 10000)

    return () => clearInterval(interval)
  }, [testimonials.length])

  const nextTestimonial = () => {
    setActiveIndex((current) => (current + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((current) => (current - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-xl bg-white shadow-soft">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={index} className="min-w-full p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-accent-light">
                    <Image
                      src={testimonial.image || "/placeholder.svg"}
                      alt={`${testimonial.name} - Testimonial`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="mt-4">
                    <p className="font-bold text-primary">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                    <p className="text-xs text-gray-400">{testimonial.occupation}</p>

                    <div className="flex mt-2 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < testimonial.rating ? "text-accent fill-accent" : "text-gray-300"}`}
                        />
                      ))}
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-xs text-gray-600">{testimonial.relationship}</p>
                      <p className="text-xs text-gray-600">{testimonial.duration}</p>
                    </div>
                  </div>
                </div>

                <div className="md:w-2/3">
                  <div className="relative">
                    <Quote className="h-8 w-8 text-accent/20 absolute -top-4 -left-2" />
                    <blockquote className="text-gray-700 italic relative z-10 pl-2">"{testimonial.quote}"</blockquote>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={prevTestimonial}
          className="rounded-full bg-white p-2 shadow-soft hover:bg-gray-100 transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-6 w-6 text-primary" />
        </button>

        <div className="flex space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                activeIndex === index ? "bg-accent" : "bg-accent/20"
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextTestimonial}
          className="rounded-full bg-white p-2 shadow-soft hover:bg-gray-100 transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-6 w-6 text-primary" />
        </button>
      </div>
    </div>
  )
}
