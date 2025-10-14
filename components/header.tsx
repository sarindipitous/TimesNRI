"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/images/times-nri-logo.png" alt="Times NRI Logo" width={120} height={40} className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/#about" className="transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/#services" className="transition-colors hover:text-primary">
            Services
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-primary">
            Care Plans
          </Link>
          <Link href="/#testimonials" className="transition-colors hover:text-primary">
            Testimonials
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-primary">
            FAQ
          </Link>
          <Link href="/blog" className="transition-colors hover:text-primary">
            Blog
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/waitlist" className="hidden md:inline-block">
            <Button className="bg-accent hover:bg-accent/90">Join Waitlist</Button>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="flex flex-col space-y-4 p-4">
            <Link
              href="/#about"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={toggleMobileMenu}
            >
              About
            </Link>
            <Link
              href="/#services"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={toggleMobileMenu}
            >
              Services
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={toggleMobileMenu}
            >
              Care Plans
            </Link>
            <Link
              href="/#testimonials"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={toggleMobileMenu}
            >
              Testimonials
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={toggleMobileMenu}
            >
              FAQ
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={toggleMobileMenu}
            >
              Blog
            </Link>
            <Link href="/waitlist" onClick={toggleMobileMenu}>
              <Button className="w-full bg-accent hover:bg-accent/90">Join Waitlist</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
