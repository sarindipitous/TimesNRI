"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { WaitlistForm } from "./waitlist-form"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const isMobile = useMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)

  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleOpenWaitlistDialog = () => {
      setIsWaitlistOpen(true)
    }

    // Add event listener to the header element
    const headerElement = document.querySelector("header")
    if (headerElement) {
      headerElement.addEventListener("openWaitlistDialog", handleOpenWaitlistDialog)
    }

    return () => {
      // Clean up the event listener
      if (headerElement) {
        headerElement.removeEventListener("openWaitlistDialog", handleOpenWaitlistDialog)
      }
    }
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()

    // Close the mobile menu if it's open
    if (isMobile) {
      setIsMenuOpen(false)
    }

    // Get the target element and scroll to it
    const targetId = href.replace("#", "")
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80, // Offset for header height
        behavior: "smooth",
      })
    }
  }

  const handleWaitlistClick = () => {
    // Open the waitlist dialog
    setIsWaitlistOpen(true)

    // Close the mobile menu if it's open
    if (isMobile) {
      setIsMenuOpen(false)
    }
  }

  const getDisplayName = (id: string): string => {
    switch (id) {
      case "cities":
        return "Locations"
      case "story":
        return "Our Story"
      case "faq":
        return "FAQ"
      default:
        return id
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
    }
  }

  return (
    <>
      <motion.header
        className={`sticky top-0 z-50 w-full ${
          isScrolled ? "bg-white shadow-soft dark:bg-gray-900" : "bg-transparent"
        }`}
        initial={{ y: prefersReducedMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.1 : 0.5, ease: "easeOut" }}
      >
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              className="h-12"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img src="/images/times-nri-logo.png" alt="TimesNRI Elderly Care Concierge" className="h-12" />
            </motion.div>
          </Link>
          {isMobile ? (
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle Menu"
                  className="p-3 h-12 w-12" // Increased touch target
                >
                  <AnimatePresence mode="wait">
                    {isMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="h-6 w-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    className="absolute top-16 left-0 right-0 bg-white p-6 shadow-soft dark:bg-gray-900 border-t border-gray-100 z-50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
                  >
                    <nav className="flex flex-col gap-4">
                      {["about", "services", "how-it-works", "pricing", "testimonials", "cities", "story", "faq"].map(
                        (item, index) => (
                          <motion.a
                            key={item}
                            href={`#${item}`}
                            className="text-base font-medium hover:text-accent transition-colors p-3 -m-3" // Added padding for touch
                            onClick={(e) => handleNavClick(e, `#${item}`)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={prefersReducedMotion ? {} : { x: 5 }}
                          >
                            {getDisplayName(item)}
                          </motion.a>
                        ),
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.25 }}
                      >
                        <Button
                          className="w-full bg-accent hover:bg-accent/90 text-white mt-2 py-6" // Increased height for touch
                          onClick={handleWaitlistClick}
                        >
                          Join the Waitlist
                        </Button>
                      </motion.div>
                    </nav>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <motion.nav
                className="flex gap-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {["about", "services", "how-it-works", "pricing", "testimonials", "cities", "story", "faq"].map(
                  (item, index) => (
                    <motion.a
                      key={item}
                      href={`#${item}`}
                      className="text-sm font-medium hover:text-accent transition-colors p-2 -m-2" // Added padding for touch
                      onClick={(e) => handleNavClick(e, `#${item}`)}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getDisplayName(item)}
                    </motion.a>
                  ),
                )}
              </motion.nav>
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-accent hover:bg-accent/90 text-white py-6" onClick={handleWaitlistClick}>
                    Join the Waitlist
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.header>

      {/* Waitlist Dialog */}
      <Dialog open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="waitlist-dialog-description">
          <motion.div
            className="p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-center mb-6 text-primary">Join Our Waitlist</h2>
            <p id="waitlist-dialog-description" className="text-center mb-6 text-gray-600">
              Be among the first to access our Elderly Care Concierge service when we launch in your city.
            </p>
            <WaitlistForm buttonText="Join Now" source="header-cta" includeNameField={true} isDetailed={true} />
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  )
}
