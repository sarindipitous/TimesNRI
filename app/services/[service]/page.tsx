import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServiceDetail } from "@/components/service-detail"
import { getCanonicalUrl } from "@/utils/url-utils"

// Define our services data
const services = [
  {
    id: "emergency-assistance",
    title: "24x7 Emergency Assistance",
    description: "Immediate local help when emergencies strike, no matter your time zone.",
    longDescription:
      "Our emergency assistance service provides immediate local help when emergencies strike, regardless of your time zone. We have a dedicated team available 24/7 to respond to any situation that may arise with your loved ones in India.",
    icon: "shield-alert",
  },
  {
    id: "trained-attendants",
    title: "Trained Attendants",
    description: "Certified support for daily care or recovery needs with detailed reporting.",
    longDescription:
      "Our trained attendants provide certified support for daily care or recovery needs with detailed reporting. All attendants undergo rigorous background checks and training to ensure they can provide the highest quality of care.",
    icon: "user-check",
  },
  {
    id: "at-home-visits",
    title: "At-Home Visits",
    description: "Regular wellness checks with photo documentation and detailed reports.",
    longDescription:
      "Our at-home visit service includes regular wellness checks with photo documentation and detailed reports. Our staff will visit your loved ones regularly to ensure they are doing well and provide you with updates.",
    icon: "home",
  },
  {
    id: "doctor-scheduling",
    title: "Doctor Scheduling",
    description: "We research specialists, book appointments, and coordinate transportation.",
    longDescription:
      "Our doctor scheduling service includes researching specialists, booking appointments, and coordinating transportation. We take care of all the logistics so your loved ones can focus on their health.",
    icon: "calendar",
  },
  {
    id: "accompanied-doctor-visits",
    title: "Accompanied Doctor Visits",
    description: "Our coordinators attend appointments, take notes, and ask questions on your behalf.",
    longDescription:
      "With our accompanied doctor visits service, our coordinators attend appointments, take notes, and ask questions on your behalf. This ensures that you have all the information you need about your loved one's health.",
    icon: "stethoscope",
  },
  {
    id: "online-bill-payments",
    title: "Online Bill Payments",
    description: "Utilities, services, or medicines — paid and tracked with complete transparency.",
    longDescription:
      "Our online bill payments service covers utilities, services, or medicines — all paid and tracked with complete transparency. You'll never have to worry about your loved ones missing a payment again.",
    icon: "receipt",
  },
]

// Generate metadata for each service page
export async function generateMetadata({
  params,
}: {
  params: { service: string }
}): Promise<Metadata> {
  const service = services.find((s) => s.id === params.service)

  if (!service) {
    return {
      title: "Service Not Found - Times NRI",
      description: "The requested service could not be found.",
    }
  }

  return {
    title: `${service.title} - Times NRI Elderly Care`,
    description: service.description,
    alternates: {
      canonical: getCanonicalUrl(`/services/${params.service}`),
    },
    openGraph: {
      title: `${service.title} - Times NRI Elderly Care`,
      description: service.description,
      url: getCanonicalUrl(`/services/${params.service}`),
      siteName: "Times NRI",
      type: "website",
    },
  }
}

// Generate static paths for all services
export async function generateStaticParams() {
  return services.map((service) => ({
    service: service.id,
  }))
}

export default function ServicePage({ params }: { params: { service: string } }) {
  const service = services.find((s) => s.id === params.service)

  if (!service) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <ServiceDetail title={service.title} description={service.longDescription} icon={service.icon} />
      </main>
      <Footer />
    </div>
  )
}
