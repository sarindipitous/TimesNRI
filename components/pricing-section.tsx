import Link from "next/link"

import { Button } from "@/components/ui/button"

interface PricingProps {
  className?: string
}

export function PricingSection({ className }: PricingProps) {
  return (
    <section className="bg-gray-100 py-16">
      <div className="container mx-auto text-center">
        <Link href="/compare">
          <Button variant="outline" className="mb-8">
            Compare All Care Plans
          </Button>
        </Link>
        <h2 className="text-3xl font-semibold mb-8">Choose the Perfect Care Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Basic</h3>
            <div className="text-4xl font-bold text-primary mb-4">$19/month</div>
            <p className="text-gray-600 mb-4">Essential care for your peace of mind.</p>
            <ul className="list-disc list-inside text-gray-700 mb-4">
              <li>24/7 Monitoring</li>
              <li>Emergency Assistance</li>
              <li>Basic Reporting</li>
            </ul>
            <Link href="/signup?plan=basic">
              <button className="bg-primary text-white font-semibold px-6 py-2 rounded-md hover:bg-primary-dark transition-colors">
                Get Started
              </button>
            </Link>
            <div className="mt-4">
              <Link href="/compare" className="text-xs text-gray-500 hover:text-gray-700">
                See all features →
              </Link>
            </div>
          </div>

          {/* Standard Plan */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Standard</h3>
            <div className="text-4xl font-bold text-primary mb-4">$49/month</div>
            <p className="text-gray-600 mb-4">Enhanced care with personalized support.</p>
            <ul className="list-disc list-inside text-gray-700 mb-4">
              <li>Everything in Basic</li>
              <li>Personalized Care Plan</li>
              <li>Medication Reminders</li>
            </ul>
            <Link href="/signup?plan=standard">
              <button className="bg-primary text-white font-semibold px-6 py-2 rounded-md hover:bg-primary-dark transition-colors">
                Get Started
              </button>
            </Link>
            <div className="mt-4">
              <Link href="/compare" className="text-xs text-gray-500 hover:text-gray-700">
                See all features →
              </Link>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Premium</h3>
            <div className="text-4xl font-bold text-primary mb-4">$99/month</div>
            <p className="text-gray-600 mb-4">Comprehensive care with advanced features.</p>
            <ul className="list-disc list-inside text-gray-700 mb-4">
              <li>Everything in Standard</li>
              <li>Virtual Doctor Visits</li>
              <li>Advanced Health Monitoring</li>
            </ul>
            <Link href="/signup?plan=premium">
              <button className="bg-primary text-white font-semibold px-6 py-2 rounded-md hover:bg-primary-dark transition-colors">
                Get Started
              </button>
            </Link>
            <div className="mt-4">
              <Link href="/compare" className="text-xs text-gray-500 hover:text-gray-700">
                See all features →
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/compare">
            <Button
              variant="outline"
              className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300 font-semibold px-6 py-2"
            >
              Compare All Care Plans in Detail
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
