import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { getCanonicalUrl } from "@/utils/url-utils"
import { MapPin, CheckCircle, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Our Service Locations - Times NRI Elderly Care",
  description:
    "Explore our service locations across India. We currently serve Delhi NCR, Mumbai, Bangalore, Hyderabad, and Pune, with more cities coming soon.",
  alternates: {
    canonical: getCanonicalUrl("/locations"),
  },
  openGraph: {
    title: "Our Service Locations - Times NRI Elderly Care",
    description:
      "Explore our service locations across India. We currently serve Delhi NCR, Mumbai, Bangalore, Hyderabad, and Pune, with more cities coming soon.",
    url: getCanonicalUrl("/locations"),
    siteName: "Times NRI",
    type: "website",
  },
}

// Define our cities data
const cities = [
  {
    id: "delhi-ncr",
    name: "Delhi NCR",
    status: "active",
    description:
      "Our services in Delhi NCR cover the entire National Capital Region, including Delhi, Gurgaon, Noida, Faridabad, and Ghaziabad.",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    status: "active",
    description:
      "Our Mumbai services cover the entire Mumbai Metropolitan Region, including Thane, Navi Mumbai, and surrounding areas.",
  },
  {
    id: "bangalore",
    name: "Bangalore",
    status: "active",
    description:
      "Our Bangalore services cover the entire city, including Electronic City, Whitefield, and surrounding areas.",
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    status: "active",
    description:
      "Our Hyderabad services cover the entire city, including Secunderabad, Cyberabad, and surrounding areas.",
  },
  {
    id: "pune",
    name: "Pune",
    status: "active",
    description: "Our Pune services cover the entire city, including Hinjewadi, Kharadi, and surrounding areas.",
  },
  {
    id: "chennai",
    name: "Chennai",
    status: "coming-soon",
    description: "Our Chennai services will cover the entire city, including OMR, ECR, and surrounding areas.",
  },
  {
    id: "kolkata",
    name: "Kolkata",
    status: "coming-soon",
    description:
      "Our Kolkata services will cover the entire city, including Salt Lake, New Town, and surrounding areas.",
  },
]

export default function LocationsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-white py-16 md:py-24 border-b border-gray-100">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-flex items-center justify-center rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary mb-2">
                Our Locations
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary">Where We Provide Care</h1>
              <p className="max-w-[700px] text-gray-600 text-lg">
                Currently serving major Indian cities, with more locations coming soon.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {cities.map((city) => (
                <Link
                  href={`/locations/${city.id}`}
                  key={city.id}
                  className="block transition-all hover:-translate-y-2"
                >
                  <div
                    className={`p-6 rounded-lg border ${
                      city.status === "active" ? "border-primary bg-primary/5" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-5 w-5 ${city.status === "active" ? "text-primary" : "text-gray-400"}`} />
                        <h3 className="font-medium text-lg">{city.name}</h3>
                      </div>
                      {city.status === "active" ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          <Clock className="mr-1 h-3 w-3" /> Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{city.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-500">
                Don't see your city? Join the waitlist and we'll notify you when we expand to your location.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
