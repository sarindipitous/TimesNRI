"use client"

import { ArrowLeft, MapPin, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { getBlobUrl } from "@/utils/image-utils"

interface CityDetailProps {
  name: string
  description: string
  status: "active" | "coming-soon"
}

export function CityDetail({ name, description, status }: CityDetailProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <Link href="/locations">
          <Button variant="ghost" className="mb-8 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Locations
          </Button>
        </Link>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-start gap-4 mb-6"
            >
              <div className="shrink-0 rounded-full p-3 bg-primary text-white">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary">{name}</h1>
                <div className="mt-2">
                  {status === "active" ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed">{description}</p>

                <h2 className="text-xl font-semibold text-primary mt-8 mb-4">Our Services in {name}</h2>
                <p className="text-gray-700">
                  We offer a comprehensive range of elderly care services in {name}, tailored to meet the specific needs
                  of your loved ones:
                </p>

                <ul className="space-y-2 mt-4">
                  <li className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-accent mt-1 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>24/7 Emergency Assistance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-accent mt-1 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Trained Attendants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-accent mt-1 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>At-Home Visits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-accent mt-1 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Doctor Scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-accent mt-1 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Accompanied Doctor Visits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-accent mt-1 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Online Bill Payments</span>
                  </li>
                </ul>
              </div>

              <div className="mt-12">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-white"
                  onClick={() => {
                    const headerElement = document.querySelector("header")
                    if (headerElement) {
                      const event = new CustomEvent("openWaitlistDialog")
                      headerElement.dispatchEvent(event)
                    }
                  }}
                >
                  Join the Waitlist
                </Button>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="relative h-[250px] rounded-lg overflow-hidden shadow-lg mb-6">
              <Image
                src={getBlobUrl(`/images/service-locations-map.png`) || "/placeholder.svg"}
                alt={`Map showing Times NRI service coverage in ${name}`}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent flex items-end">
                <div className="p-4 text-white">
                  <p className="font-medium">{name} Coverage Area</p>
                </div>
              </div>
            </div>

            <div className="bg-accent-light p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-primary mb-4">Local Healthcare Partners</h3>
              <p className="text-sm text-gray-600 mb-4">
                We've established relationships with leading healthcare providers in {name} to ensure your loved ones
                receive the best care possible.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg
                    className="h-4 w-4 text-accent mt-1 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Top hospitals and clinics</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="h-4 w-4 text-accent mt-1 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Specialist doctors and consultants</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="h-4 w-4 text-accent mt-1 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Emergency services and ambulances</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="h-4 w-4 text-accent mt-1 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Pharmacies and medical suppliers</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 bg-primary-light p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-primary mb-4">Contact Us</h3>
              <p className="text-sm text-gray-600 mb-4">
                Have questions about our services in {name}? We're here to help.
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  const headerElement = document.querySelector("header")
                  if (headerElement) {
                    const event = new CustomEvent("openWaitlistDialog")
                    headerElement.dispatchEvent(event)
                  }
                }}
              >
                Get in Touch
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
