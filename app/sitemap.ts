import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://times-nri.vercel.app"

  // Define our services data
  const services = [
    { id: "emergency-assistance", title: "24x7 Emergency Assistance" },
    { id: "trained-attendants", title: "Trained Attendants" },
    { id: "at-home-visits", title: "At-Home Visits" },
    { id: "doctor-scheduling", title: "Doctor Scheduling" },
    { id: "accompanied-doctor-visits", title: "Accompanied Doctor Visits" },
    { id: "online-bill-payments", title: "Online Bill Payments" },
  ]

  // Define our cities data
  const cities = [
    { id: "delhi-ncr", name: "Delhi NCR", status: "active" },
    { id: "mumbai", name: "Mumbai", status: "active" },
    { id: "bangalore", name: "Bangalore", status: "active" },
    { id: "hyderabad", name: "Hyderabad", status: "active" },
    { id: "pune", name: "Pune", status: "active" },
    { id: "chennai", name: "Chennai", status: "coming-soon" },
    { id: "kolkata", name: "Kolkata", status: "coming-soon" },
  ]

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/locations`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...services.map((service) => ({
      url: `${baseUrl}/services/${service.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    })),
    ...cities.map((city) => ({
      url: `${baseUrl}/locations/${city.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  ]
}
