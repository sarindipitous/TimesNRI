import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CityDetail } from "@/components/city-detail"
import { getCanonicalUrl } from "@/utils/url-utils"

// Define our cities data
const cities = [
  {
    id: "delhi-ncr",
    name: "Delhi NCR",
    status: "active",
    description:
      "Our services in Delhi NCR cover the entire National Capital Region, including Delhi, Gurgaon, Noida, Faridabad, and Ghaziabad.",
    longDescription:
      "Times NRI provides comprehensive elderly care services throughout the Delhi National Capital Region. Our local team is familiar with the unique challenges of navigating healthcare and support services in this bustling metropolitan area. We have established relationships with top hospitals, specialists, and care providers across Delhi, Gurgaon, Noida, Faridabad, and Ghaziabad.",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    status: "active",
    description:
      "Our Mumbai services cover the entire Mumbai Metropolitan Region, including Thane, Navi Mumbai, and surrounding areas.",
    longDescription:
      "Our Mumbai team provides exceptional elderly care services throughout the Mumbai Metropolitan Region. We understand the unique challenges of navigating healthcare in India's financial capital and have built strong relationships with leading medical facilities and specialists across Mumbai, Thane, and Navi Mumbai. Our local coordinators are familiar with the city's infrastructure and can efficiently manage transportation and logistics for your loved ones.",
  },
  {
    id: "bangalore",
    name: "Bangalore",
    status: "active",
    description:
      "Our Bangalore services cover the entire city, including Electronic City, Whitefield, and surrounding areas.",
    longDescription:
      "Times NRI's Bangalore team offers comprehensive elderly care services throughout India's technology hub. We have established partnerships with leading healthcare providers and specialists across the city, including in areas like Electronic City, Whitefield, and Indiranagar. Our local coordinators understand the unique healthcare landscape of Bangalore and can navigate the city efficiently to provide timely support to your loved ones.",
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    status: "active",
    description:
      "Our Hyderabad services cover the entire city, including Secunderabad, Cyberabad, and surrounding areas.",
    longDescription:
      "Our Hyderabad team provides exceptional elderly care services throughout the city. We have established relationships with top healthcare providers in both the old and new parts of the city, including Secunderabad and Cyberabad. Our local coordinators are familiar with Hyderabad's healthcare ecosystem and can efficiently manage all aspects of elderly care, from routine check-ups to emergency response.",
  },
  {
    id: "pune",
    name: "Pune",
    status: "active",
    description: "Our Pune services cover the entire city, including Hinjewadi, Kharadi, and surrounding areas.",
    longDescription:
      "Times NRI's Pune team offers comprehensive elderly care services throughout this cultural and educational hub. We have built strong relationships with leading healthcare providers and specialists across the city, including areas like Hinjewadi, Kharadi, and Koregaon Park. Our local coordinators understand Pune's unique healthcare landscape and can provide timely and efficient support to your loved ones.",
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
