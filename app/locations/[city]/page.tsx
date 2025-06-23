import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CityDetail } from "@/components/city-detail"
import { getCanonicalUrl } from "@/utils/url-utils"

// Define our cities data - update all to coming-soon
const cities = [
  {
    id: "delhi-ncr",
    name: "Delhi NCR",
    status: "coming-soon",
    description:
      "We're preparing to launch our services in Delhi NCR, covering the entire National Capital Region including Delhi, Gurgaon, Noida, Faridabad, and Ghaziabad.",
    longDescription:
      "Times NRI is preparing to launch comprehensive elderly care services throughout the Delhi National Capital Region. We're building relationships with top hospitals, specialists, and care providers across Delhi, Gurgaon, Noida, Faridabad, and Ghaziabad to ensure we can provide exceptional care when we launch.",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    status: "coming-soon",
    description:
      "We're preparing to launch our services in Mumbai, covering the entire Mumbai Metropolitan Region including Thane, Navi Mumbai, and surrounding areas.",
    longDescription:
      "Our Mumbai launch will provide exceptional elderly care services throughout the Mumbai Metropolitan Region. We're establishing partnerships with leading medical facilities and specialists across Mumbai, Thane, and Navi Mumbai to ensure comprehensive care coverage when we go live.",
  },
  {
    id: "bangalore",
    name: "Bangalore",
    status: "coming-soon",
    description:
      "We're preparing to launch our services in Bangalore, covering the entire city, including Electronic City, Whitefield, and surrounding areas.",
    longDescription:
      "Times NRI is preparing to launch comprehensive elderly care services throughout India's technology hub. We are establishing partnerships with leading healthcare providers and specialists across the city, including in areas like Electronic City, Whitefield, and Indiranagar. Our local coordinators understand the unique healthcare landscape of Bangalore and are preparing to navigate the city efficiently to provide timely support to your loved ones.",
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    status: "coming-soon",
    description:
      "We're preparing to launch our services in Hyderabad, covering the entire city, including Secunderabad, Cyberabad, and surrounding areas.",
    longDescription:
      "Our Hyderabad team is preparing to launch exceptional elderly care services throughout the city. We are establishing relationships with top healthcare providers in both the old and new parts of the city, including Secunderabad and Cyberabad. Our local coordinators will be familiar with Hyderabad's healthcare ecosystem and will efficiently manage all aspects of elderly care, from routine check-ups to emergency response.",
  },
  {
    id: "pune",
    name: "Pune",
    status: "coming-soon",
    description:
      "We're preparing to launch our services in Pune, covering the entire city, including Hinjewadi, Kharadi, and surrounding areas.",
    longDescription:
      "Times NRI's Pune team is preparing to launch comprehensive elderly care services throughout this cultural and educational hub. We are building strong relationships with leading healthcare providers and specialists across the city, including areas like Hinjewadi, Kharadi, and Koregaon Park. Our local coordinators understand Pune's unique healthcare landscape and will provide timely and efficient support to your loved ones.",
  },
]

// Generate metadata for each city page
export async function generateMetadata({
  params,
}: {
  params: { city: string }
}): Promise<Metadata> {
  const city = cities.find((c) => c.id === params.city)

  if (!city) {
    return {
      title: "Location Not Found - Times NRI",
      description: "The requested location could not be found.",
    }
  }

  return {
    title: `Elderly Care Services in ${city.name} - Times NRI`,
    description: city.description,
    alternates: {
      canonical: getCanonicalUrl(`/locations/${params.city}`),
    },
    openGraph: {
      title: `Elderly Care Services in ${city.name} - Times NRI`,
      description: city.description,
      url: getCanonicalUrl(`/locations/${params.city}`),
      siteName: "Times NRI",
      type: "website",
    },
  }
}

// Generate static paths for all cities
export async function generateStaticParams() {
  return cities.map((city) => ({
    city: city.id,
  }))
}

export default function CityPage({ params }: { params: { city: string } }) {
  const city = cities.find((c) => c.id === params.city)

  if (!city) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <CityDetail name={city.name} description={city.longDescription} status={city.status} />
      </main>
      <Footer />
    </div>
  )
}
