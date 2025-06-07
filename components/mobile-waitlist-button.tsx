"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { WaitlistForm } from "./waitlist-form"

export function MobileWaitlistButton() {
  const [isOpen, setIsOpen] = useState(false)

  const openWaitlistDialog = () => {
    const headerElement = document.querySelector("header")
    if (headerElement) {
      const event = new CustomEvent("openWaitlistDialog")
      headerElement.dispatchEvent(event)
    } else {
      // Fallback if header element is not found
      setIsOpen(true)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={openWaitlistDialog}
          className="bg-accent hover:bg-accent/90 text-white shadow-warm transition-all duration-300 h-14 px-6 rounded-full"
          size="lg"
        >
          Join the Waitlist
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="mobile-waitlist-dialog-description">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6 text-primary">Join Our Waitlist</h2>
            <p id="mobile-waitlist-dialog-description" className="text-center mb-6 text-gray-600">
              Be among the first to access our Elderly Care Concierge service when we launch in your city.
            </p>
            <WaitlistForm buttonText="Join Now" source="mobile-button" includeNameField={true} isDetailed={true} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
