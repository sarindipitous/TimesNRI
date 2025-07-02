import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CityDetail } from "@/components/city-detail"
import { getCanonicalUrl } from "@/utils/url-utils"

// Define our cities data - all coming-soon
const cities = [
  {
    id: "delhi-ncr",
    name: "Delhi NCR",
    status: "coming-soon",
    description:
      "We're preparing to launch our services in Delhi NCR, covering the entire National Capital Region including Delhi, Gurgaon, Noida, Faridabad, and Ghaziabad.",
    longDescription:
      "Times NRI is preparing to launch comprehensive senior care services throughout the Delhi National Capital Region. We're building relationships with top hospitals, specialists, and care providers across Delhi, Gurgaon, Noida, Faridabad, and Ghaziabad to ensure we can provide exceptional care when we launch.",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    status: "coming-soon",
    description:
      "We're preparing to launch our services in Mumbai, covering the entire Mumbai Metropolitan Region including Thane, Navi Mumbai, and surrounding areas.",
    longDescription:
      "Our Mumbai launch will provide exceptional senior care services throughout the Mumbai Metropolitan Region. We're establishing partnerships with leading medical facilities and specialists across Mumbai, Thane, and Navi Mumbai to ensure comprehensive care coverage when we go live.",
  },
  {
    id: "chennai",
    name: "Chennai",
    status: "coming-soon",
    description: "Our Chennai services will cover the entire city, including OMR, ECR, and surrounding areas.",
    longDescription:
      "Times NRI is preparing to launch comprehensive senior care services throughout Chennai, the cultural capital of South India. We are establishing partnerships with leading healthcare providers and specialists across the city, including areas like OMR, ECR, and T. Nagar. Our local coordinators understand Chennai's unique healthcare landscape and will provide timely and efficient support to your loved ones.",
  },
  {
    id: "kolkata",
    name: "Kolkata",
    status: "coming-soon",
    description:
      "Our Kolkata services will cover the entire city, including Salt Lake, New Town, and surrounding areas.",
    longDescription:
      "Our Kolkata team is preparing to launch exceptional senior care services throughout the City of Joy. We are establishing relationships with top healthcare providers across the city, including Salt Lake, New Town, and Park Street areas. Our local coordinators will be familiar with Kolkata's healthcare ecosystem and will efficiently manage all aspects of senior care, from routine check-ups to emergency response.",
  },
  {
    id: "bangalore",
    name: "Bangalore",
    status: "coming-soon",
    description:
      "We're preparing to launch our services in Bangalore, covering the entire city, including Electronic City, Whitefield, and surrounding areas.",
    longDescription:
      "Times NRI is preparing to launch comprehensive senior care services throughout India's technology hub. We are establishing partnerships with leading healthcare providers and specialists across the city, including in areas like Electronic City, Whitefield, and Indiranagar. Our local coordinators understand the unique healthcare landscape of Bangalore and are preparing to navigate the city efficiently to provide timely support to your loved ones.",
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    status: "coming-soon",
    description:
      "We're preparing to launch our services in Hyderabad, covering the entire city, including Secunderabad, Cyberabad, and surrounding areas.",
    longDescription:
      "Our Hyderabad team is preparing to launch exceptional senior care services throughout the city. We are establishing relationships with top healthcare providers in both the old and new parts of the city, including Secunderabad and Cyberabad. Our local coordinators will be familiar with Hyderabad's healthcare ecosystem and will efficiently manage all aspects of senior care, from routine check-ups to emergency response.",
  },
  {
    id: "pune",
    name: "Pune",
    status: "coming-soon",
    description: "Our Pune services will cover the entire city, including Hinjewadi, Kharadi, and surrounding areas.",
    longDescription:
      "Times NRI's Pune team is preparing to launch comprehensive senior care services throughout this cultural and educational hub. We are building strong relationships with leading healthcare providers and specialists across the city, including areas like Hinjewadi, Kharadi, and Koregaon Park. Our local coordinators understand Pune's unique healthcare landscape and will provide timely and efficient support to your loved ones.",
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    status: "coming-soon",
    description:
      "Our Ahmedabad services will cover the entire city, including Satellite, Vastrapur, and surrounding areas.",
    longDescription:
      "Times NRI is preparing to launch comprehensive senior care services throughout Ahmedabad, Gujarat's commercial capital. We are establishing partnerships with leading healthcare providers and specialists across the city, including areas like Satellite, Vastrapur, and Bopal. Our local coordinators understand Ahmedabad's healthcare landscape and will provide culturally sensitive and efficient support to your loved ones.",
  },
  {
    id: "surat",
    name: "Surat",
    status: "coming-soon",
    description: "Our Surat services will cover the entire city, including Adajan, Vesu, and surrounding areas.",
    longDescription:
      "Our Surat team is preparing to launch exceptional senior care services throughout this diamond city. We are establishing relationships with top healthcare providers across the city, including Adajan, Vesu, and Pal areas. Our local coordinators will be familiar with Surat's healthcare ecosystem and will efficiently manage all aspects of senior care, from routine check-ups to emergency response.",
  },
  {
    id: "chandigarh",
    name: "Chandigarh",
    status: "coming-soon",
    description:
      "Our Chandigarh services will cover the tricity area, including Mohali, Panchkula, and surrounding regions.",
    longDescription:
      "Times NRI is preparing to launch comprehensive senior care services throughout the beautiful tricity area of Chandigarh. We are establishing partnerships with leading healthcare providers and specialists across Chandigarh, Mohali, and Panchkula. Our local coordinators understand the unique healthcare landscape of this planned city and will provide timely and efficient support to your loved ones.",
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
    title: `Senior Care Services in ${city.name} - Times NRI`,
    description: city.description,
    alternates: {
      canonical: getCanonicalUrl(`/locations/${params.city}`),
    },
    openGraph: {
      title: `Senior Care Services in ${city.name} - Times NRI`,
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
