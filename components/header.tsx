"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Image from "next/image"

interface HeaderProps {
  referralParam?: string | null
}

export function Header({ referralParam }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const getWaitlistUrl = () => {
    const baseUrl = "/waitlist"
    if (referralParam) {
      return `${baseUrl}?ref=${encodeURIComponent(referralParam)}`
    }
    return baseUrl
  }

  const handleWaitlistClick = () => {
    console.log("🔗 Header waitlist clicked with referral:", referralParam)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/images/times-nri-logo.png"
            alt="Times NRI"
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/services" className="text-sm font-medium hover:text-primary transition-colors">
            Services
          </Link>
          <Link href="/compare" className="text-sm font-medium hover:text-primary transition-colors">
            Compare Plans
          </Link>
          <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">
            Blog
          </Link>
          <Link href={getWaitlistUrl()}>
            <Button className="bg-accent hover:bg-accent/90 text-white" onClick={handleWaitlistClick}>
              Join Waitlist
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="flex flex-col space-y-4 p-4">
            <Link
              href="/services"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/compare"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Compare Plans
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link href={getWaitlistUrl()}>
              <Button
                className="bg-accent hover:bg-accent/90 text-white w-full"
                onClick={() => {
                  handleWaitlistClick()
                  setIsMenuOpen(false)
                }}
              >
                Join Waitlist
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
