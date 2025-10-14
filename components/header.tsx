"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Handle hash navigation on mount and route changes
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      // Wait for content to load, then scroll
      setTimeout(() => {
        const id = hash.replace("#", "")
        scrollToSection(id)
      }, 300)
    }
  }, [pathname])

  const scrollToSection = (sectionId: string) => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        const headerOffset = 80
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        })

        // Ensure we stay at the correct position after animations
        setTimeout(() => {
          const finalElement = document.getElementById(sectionId)
          if (finalElement) {
            const finalPosition = finalElement.getBoundingClientRect().top
            const finalOffset = finalPosition + window.pageYOffset - headerOffset

            // Only adjust if we're not already at the right position
            if (Math.abs(window.pageYOffset - finalOffset) > 5) {
              window.scrollTo({
                top: finalOffset,
                behavior: "smooth",
              })
            }
          }
        }, 600)
      }
    })
  }

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)

    // Update URL
    window.history.pushState({}, "", `/#${sectionId}`)

    // Scroll to section with delay to allow any rendering
    setTimeout(() => {
      scrollToSection(sectionId)
    }, 100)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/images/times-nri-logo.png" alt="Times NRI Logo" width={120} height={40} className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <a
            href="/#about"
            className="transition-colors hover:text-primary cursor-pointer"
            onClick={(e) => handleSectionClick(e, "about")}
          >
            About
          </a>
          <a
            href="/#services"
            className="transition-colors hover:text-primary cursor-pointer"
            onClick={(e) => handleSectionClick(e, "services")}
          >
            Services
          </a>
          <a
            href="/#pricing"
            className="transition-colors hover:text-primary cursor-pointer"
            onClick={(e) => handleSectionClick(e, "pricing")}
          >
            Care Plans
          </a>
          <a
            href="/#testimonials"
            className="transition-colors hover:text-primary cursor-pointer"
            onClick={(e) => handleSectionClick(e, "testimonials")}
          >
            Testimonials
          </a>
          <a
            href="/#faq"
            className="transition-colors hover:text-primary cursor-pointer"
            onClick={(e) => handleSectionClick(e, "faq")}
          >
            FAQ
          </a>
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
            <a
              href="/#about"
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
              onClick={(e) => handleSectionClick(e, "about")}
            >
              About
            </a>
            <a
              href="/#services"
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
              onClick={(e) => handleSectionClick(e, "services")}
            >
              Services
            </a>
            <a
              href="/#pricing"
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
              onClick={(e) => handleSectionClick(e, "pricing")}
            >
              Care Plans
            </a>
            <a
              href="/#testimonials"
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
              onClick={(e) => handleSectionClick(e, "testimonials")}
            >
              Testimonials
            </a>
            <a
              href="/#faq"
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
              onClick={(e) => handleSectionClick(e, "faq")}
            >
              FAQ
            </a>
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
