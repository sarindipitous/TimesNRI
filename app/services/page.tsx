import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServiceCard } from "@/components/service-card"
import Link from "next/link"
import { getCanonicalUrl } from "@/utils/url-utils"

export const metadata: Metadata = {
  title: "Our Services - Times NRI Elderly Care",
  description:
    "Explore our range of elderly care services designed specifically for NRI families with parents in India.",
  alternates: {
    canonical: getCanonicalUrl("/services"),
  },
  openGraph: {
    title: "Our Services - Times NRI Elderly Care",
    description:
      "Explore our range of elderly care services designed specifically for NRI families with parents in India.",
    url: getCanonicalUrl("/services"),
    siteName: "Times NRI",
    type: "website",
  },
}

// Define our services data
const services = [
  {
    id: "emergency-assistance",
    title: "24x7 Emergency Assistance",
    description: "Immediate local help when emergencies strike, no matter your time zone.",
    icon: "shield-alert",
    scenarios: [
      "Your father falls at night and needs immediate medical attention",
      "Your mother experiences chest pain and needs emergency transport",
      "A sudden power outage leaves your parents without electricity for hours",
    ],
  },
  {
    id: "trained-attendants",
    title: "Trained Attendants",
    description: "Certified support for daily care or recovery needs with detailed reporting.",
    icon: "user-check",
    scenarios: [
      "Post-surgery recovery requiring specialized care",
      "Regular assistance with medication management and daily activities",
      "Companionship and cognitive stimulation for parents with memory issues",
    ],
  },
  {
    id: "at-home-visits",
    title: "At-Home Visits",
    description: "Regular wellness checks with photo documentation and detailed reports.",
    icon: "home",
    scenarios: [
      "Weekly home safety assessments with photo documentation",
      "Regular health monitoring including vitals and medication compliance",
      "Companionship visits to reduce isolation and improve mental wellbeing",
    ],
  },
  {
    id: "doctor-scheduling",
    title: "Doctor Scheduling",
    description: "We research specialists, book appointments, and coordinate transportation.",
    icon: "calendar",
    scenarios: [
      "Finding the right specialist based on medical history and current needs",
      "Securing priority appointments with top doctors in their specialty",
      "Coordinating follow-up care and prescription management",
    ],
  },
  {
    id: "accompanied-doctor-visits",
    title: "Accompanied Doctor Visits",
    description: "Our coordinators attend appointments, take notes, and ask questions on your behalf.",
    icon: "stethoscope",
    scenarios: [
      "Medical coordinator attends specialist appointments and provides detailed summaries",
      "Video calls with you during critical consultations for real-time involvement",
      "Translation of medical terminology and treatment plans into clear language",
    ],
  },
  {
    id: "online-bill-payments",
    title: "Online Bill Payments",
    description: "Utilities, services, or medicines — paid and tracked with complete transparency.",
    icon: "receipt",
    scenarios: [
      "Utility bill management with payment verification and receipt documentation",
      "Medication refill and delivery coordination",
      "Property maintenance payments and service scheduling",
    ],
  },
]

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-white py-16 md:py-24 border-b border-gray-100">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-flex items-center justify-center rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent mb-2">
                Our Services
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary">
                Everything they need. Handled by people you can trust.
              </h1>
              <p className="max-w-[700px] text-gray-600 text-lg">
                Professional, verified services designed specifically for elderly parents in India.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-8 sm:grid-cols-2 md:grid-cols-3">
              {services.map((service, i) => (
                <Link
                  href={`/services/${service.id}`}
                  key={service.id}
                  className="block transition-all hover:-translate-y-2"
                >
                  <ServiceCard
                    title={service.title}
                    description={service.description}
                    icon={service.icon}
                    scenarios={service.scenarios}
                    index={i}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
