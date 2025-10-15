"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { WaitlistForm } from "./waitlist-form"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle smooth scrolling to sections with proper offset
  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)

    // If we're on a different page, navigate first
    if (window.location.pathname !== "/") {
      window.location.href = `/#${targetId}`
      return
    }

    const element = document.getElementById(targetId)
    if (element) {
      const headerOffset = 80 // Height of sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })

      // Double-check position after animations complete
      setTimeout(() => {
        const newPosition = element.getBoundingClientRect().top
        const newOffsetPosition = newPosition + window.pageYOffset - headerOffset

        if (Math.abs(window.pageYOffset - newOffsetPosition) > 10) {
          window.scrollTo({
            top: newOffsetPosition,
            behavior: "smooth",
          })
        }
      }, 600)

      // Update URL without reloading
      window.history.pushState({}, "", `#${targetId}`)
    }
  }

  // Handle scroll on page load if there's a hash
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      // Wait for content to load
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          const headerOffset = 80
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          })
        }
      }, 100)
    }
  }, [])

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-white"
        }`}
      >
        <div className="container flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/images/times-nri-logo.png" alt="Times NRI" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/#pricing"
              onClick={(e) => handleSectionClick(e, "pricing")}
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Care Plans
            </a>
            <Link href="/blog" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Resources
            </Link>
            <Button onClick={() => setIsWaitlistOpen(true)} className="bg-accent hover:bg-accent/90">
              Join Waitlist
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="container py-4 flex flex-col space-y-4">
              <a
                href="/#pricing"
                onClick={(e) => handleSectionClick(e, "pricing")}
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Care Plans
              </a>
              <Link
                href="/blog"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <Button
                onClick={() => {
                  setIsWaitlistOpen(true)
                  setIsMobileMenuOpen(false)
                }}
                className="bg-accent hover:bg-accent/90 w-full"
              >
                Join Waitlist
              </Button>
            </nav>
          </div>
        )}
      </header>

      <WaitlistForm isOpen={isWaitlistOpen} onOpenChange={setIsWaitlistOpen} source="header" isDetailed={true} />
    </>
  )
}
