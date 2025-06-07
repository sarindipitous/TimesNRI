"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMobile } from "@/hooks/use-mobile"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Check, Copy, Share2 } from "lucide-react"

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isPulsing, setPulsing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useMobile()
  const prefersReducedMotion = useReducedMotion()
  const [referralLink, setReferralLink] = useState<string | null>(null)
  const [referralCopied, setReferralCopied] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsVisible(scrollPosition > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setPulsing(true)
        setTimeout(() => setPulsing(false), 1000)
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [isVisible])

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setReferralCopied(true)
      setTimeout(() => setReferralCopied(false), 2000)
    }
  }

  const handleWaitlistSuccess = (data: any) => {
    setReferralLink(data.referral_link)
    setEmail(data.email)
  }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50, scale: prefersReducedMotion ? 1 : 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 50, scale: prefersReducedMotion ? 1 : 0.8 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
          >
            {/* Mobile-only quick call button */}
            {/* {isMobile && (
              <motion.a
                href="tel:+918000123456"
                className="bg-primary text-white p-4 rounded-full shadow-warm hover:bg-primary/90 transition-all duration-300"
                aria-label="Call us now"
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Phone className="h-6 w-6" />
              </motion.a>
            )} */}

            <motion.div animate={isPulsing ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.5 }}>
              <Button
                onClick={() => setIsOpen(true)}
                className="bg-accent hover:bg-accent/90 text-white shadow-warm transition-all duration-300 h-14 px-6"
                size="lg"
              >
                Join the Waitlist
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="floating-waitlist-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">You're on the list!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="rounded-full bg-green-100 p-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p id="floating-waitlist-dialog-description" className="text-center text-lg">
              We'll reach out when your city is live.
            </p>

            {referralLink && (
              <div className="w-full space-y-3">
                <p className="text-center">Want priority access? Refer 3 friends.</p>
                <div className="flex items-center space-x-2 rounded-md border p-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-transparent text-sm outline-none p-2" // Added padding
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyReferralLink}
                    className="h-10 w-10 p-2" // Increased touch target
                  >
                    {referralCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex justify-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1 h-12 px-4" // Increased touch target
                    onClick={() => {
                      window.open(
                        `https://wa.me/?text=I'm joining the Times NRI waitlist for elderly care services in India. Join me: ${referralLink}`,
                        "_blank",
                      )
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </Button>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500">Email: {email}</p>
            <Button className="mt-4 bg-primary h-12 px-6" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
