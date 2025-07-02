"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"

const menuItems = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "care-companion", label: "Care Companion" },
  { id: "pricing", label: "Care Packages" },
  { id: "testimonials", label: "Testimonials" },
  { id: "cities", label: "Locations" },
  { id: "story", label: "Our Mission" },
  { id: "faq", label: "FAQ" },
  { id: "blog", label: "Blog" },
]

function getDisplayName(id: string): string {
  switch (id) {
    case "faq":
      return "FAQ"
    case "pricing":
      return "Care Packages"
    case "story":
      return "Our Mission"
    case "care-companion":
      return "Care Companion"
    default:
      return menuItems.find((item) => item.id === id)?.label || id
  }
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    if (sectionId === "blog") {
      window.location.href = "/blog"
      return
    }

    // Check if we're on the main page
    const isOnMainPage = window.location.pathname === "/"

    if (!isOnMainPage) {
      // If we're not on the main page, navigate to main page with hash
      window.location.href = `/#${sectionId}`
      return
    }

    // If we're on the main page, scroll to the section
    const element = document.getElementById(sectionId)
    if (element) {
      const headerHeight = 100

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const elementPosition = element.offsetTop - headerHeight
        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        })

        // Add a small delay to handle any lazy loading content shifts
        setTimeout(() => {
          const newElementPosition = element.offsetTop - headerHeight
          if (Math.abs(window.scrollY - newElementPosition) > 50) {
            window.scrollTo({
              top: newElementPosition,
              behavior: "smooth",
            })
          }
        }, 500)
      })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex flex-col">
              <span className="font-bold text-lg text-primary">Times NRI</span>
              <span className="text-xs text-gray-600 -mt-1">Senior Care & Wellness Membership</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                {getDisplayName(item.id)}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/waitlist">
              <Button className="bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-2">Join Waitlist</Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b">
                  <div className="flex items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-primary">Times NRI</span>
                      <span className="text-xs text-gray-600 -mt-1">Senior Care & Wellness Membership</span>
                    </div>
                  </div>
                </div>
                <nav className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        {getDisplayName(item.id)}
                      </button>
                    ))}
                  </div>
                </nav>
                <div className="p-6 border-t">
                  <Link href="/waitlist">
                    <Button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3"
                    >
                      Join Waitlist
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
