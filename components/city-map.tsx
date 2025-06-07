import Image from "next/image"
import { getBlobUrl } from "@/utils/image-utils"

export function CityMap() {
  const cities = [
    { name: "Delhi NCR", status: "active" },
    { name: "Mumbai", status: "active" },
    { name: "Bangalore", status: "active" },
    { name: "Hyderabad", status: "active" },
    { name: "Pune", status: "active" },
    { name: "Chennai", status: "coming-soon" },
    { name: "Kolkata", status: "coming-soon" },
    { name: "Ahmedabad", status: "coming-soon" },
    { name: "Jaipur", status: "coming-soon" },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div className="relative h-[400px] rounded-xl overflow-hidden shadow-lg">
        <Image
          src={getBlobUrl("/images/service-locations-map.png") || "/placeholder.svg"}
          alt="Healthcare team members holding signs showing service locations: Delhi NCR, Mumbai, Bangalore, Hyderabad, and Pune"
          fill
          className="object-contain bg-white"
          unoptimized
        />
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-6 text-[#1E3A8A]">Service Locations</h3>
        <div className="grid grid-cols-2 gap-4">
          {cities.map((city) => (
            <div
              key={city.name}
              className={`p-4 rounded-lg border ${
                city.status === "active" ? "border-[#1E3A8A] bg-[#1E3A8A]/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{city.name}</span>
                {city.status === "active" ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    Coming Soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-gray-500">
          Don't see your city? Join the waitlist and we'll notify you when we expand to your location.
        </p>
      </div>
    </div>
  )
}
