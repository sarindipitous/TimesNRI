export function TimesNriBadge() {
  return (
    <div className="bg-accent-light text-accent py-2 w-full border-b border-accent/10">
      <div className="container mx-auto px-4 flex items-center justify-center md:justify-between">
        <p className="text-sm font-medium flex items-center">
          <span className="hidden md:inline-block text-gray-600">An initiative by</span>
          <span className="mx-2 font-bold text-accent">THE TIMES OF INDIA</span>
          <span className="text-gray-600 text-xs">Trusted since 1838</span>
        </p>
        <p className="hidden md:block text-xs text-gray-500">Designed with care for NRI families</p>
      </div>
    </div>
  )
}
