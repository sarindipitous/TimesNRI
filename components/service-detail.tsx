"use client"

import { ShieldAlert, UserCheck, Home, Calendar, Stethoscope, Receipt, ArrowLeft, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"

interface ServiceDetailProps {
  title: string
  description: string
  icon: string
}

export function ServiceDetail({ title, description, icon }: ServiceDetailProps) {
  const getIcon = (): LucideIcon => {
    switch (icon) {
      case "shield-alert":
        return ShieldAlert
      case "user-check":
        return UserCheck
      case "home":
        return Home
      case "calendar":
        return Calendar
      case "stethoscope":
        return Stethoscope
      case "receipt":
        return Receipt
      default:
        return ShieldAlert
    }
  }

  const Icon = getIcon()

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <Link href="/services">
          <Button variant="ghost" className="mb-8 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Services
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
              <div className="shrink-0 rounded-full p-3 bg-accent text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold text-primary">{title}</h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed">{description}</p>

                <h2 className="text-xl font-semibold text-primary mt-8 mb-4">How It Works</h2>
                <p className="text-gray-700">
                  Our process is designed to be simple and effective, ensuring that your loved ones receive the care
                  they need without any hassle.
                </p>

                <h2 className="text-xl font-semibold text-primary mt-8 mb-4">Why Choose Us</h2>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-accent mt-1 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Verified and background-checked professionals</span>
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
                    <span>Transparent reporting and communication</span>
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
                    <span>Customized care plans based on individual needs</span>
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
                    <span>Backed by the trusted Times of India Group</span>
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
            <div className="bg-accent-light p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-primary mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800">How quickly can you respond to emergencies?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Our local teams can typically respond within 15-30 minutes in urban areas, depending on the specific
                    location.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Are your services available 24/7?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Yes, our emergency response and support services are available 24 hours a day, 7 days a week.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">How do I know the caregivers are trustworthy?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    All our caregivers undergo rigorous background checks, verification, and training before joining our
                    team.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-primary-light p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-primary mb-4">Contact Us</h3>
              <p className="text-sm text-gray-600 mb-4">
                Have questions about our {title.toLowerCase()} service? We're here to help.
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
