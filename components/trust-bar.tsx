import { Shield, Users, Award, Check } from "lucide-react"

export function TrustBar() {
  return (
    <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Our Commitments</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-primary-light p-2 rounded-full">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Verified Caregivers</h4>
            <p className="text-xs text-gray-500">
              Background checks, training certification, and regular performance reviews
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-accent-light p-2 rounded-full">
            <Users className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h4 className="text-sm font-medium">1000+ Families</h4>
            <p className="text-xs text-gray-500">Serving NRI families across 6 countries and 12 time zones</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-primary-light p-2 rounded-full">
            <Check className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Transparent Communication</h4>
            <p className="text-xs text-gray-500">Real-time updates and detailed visit reports</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="bg-accent-light p-2 rounded-full">
            <Award className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Times Group Trusted</h4>
            <p className="text-xs text-gray-500">Backed by India's most respected media institution</p>
          </div>
        </div>
      </div>
    </div>
  )
}
