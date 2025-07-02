export function CityMap() {
  const cities = [
    { name: "Delhi NCR", status: "coming-soon" },
    { name: "Mumbai", status: "coming-soon" },
    { name: "Chennai", status: "coming-soon" },
    { name: "Kolkata", status: "coming-soon" },
    { name: "Bangalore", status: "coming-soon" },
    { name: "Hyderabad", status: "coming-soon" },
    { name: "Pune", status: "coming-soon" },
    { name: "Ahmedabad", status: "coming-soon" },
    { name: "Surat", status: "coming-soon" },
    { name: "Chandigarh", status: "coming-soon" },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold mb-6 text-[#1E3A8A] text-center">Service Locations</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {cities.map((city) => (
          <div key={city.name} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium">{city.name}</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                Coming Soon
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-gray-500 text-center">
        We're launching soon in these major Indian cities. Join the waitlist to be notified when we go live in your
        location.
      </p>
    </div>
  )
}
