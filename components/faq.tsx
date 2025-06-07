"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

export function Faq() {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const faqs = [
    {
      question: "What is Times NRI's Elderly Care Concierge?",
      answer:
        "A premium, on-demand coordination service designed for NRIs to support their aging parents in India with emergency assistance, caregiving, and healthcare management.",
    },
    {
      question: "How do I know the caregivers and attendants are trustworthy?",
      answer:
        "All caregivers are thoroughly vetted, background-checked, and trained. We only work with verified partners to ensure professional, safe, and respectful care.",
    },
    {
      question: "Which Indian cities do you currently operate in?",
      answer:
        "We are currently live in Delhi NCR, Mumbai, Pune, Bangalore, and Hyderabad — with Chennai and more cities launching soon.",
    },
    {
      question: "Can I customise the care package for my parent's specific needs?",
      answer:
        "Absolutely. Our concierge team will help you create a care plan based on your parent's health, lifestyle, and preferences.",
    },
    {
      question: "Will I receive updates or reports about what's happening?",
      answer:
        "Yes. You'll get real-time updates, visit summaries, and billing reports directly to your email or dashboard.",
    },
    {
      question: "Can the concierge accompany my parent to doctor appointments?",
      answer: "Yes. Accompanied doctor visits are included in the core services.",
    },
    {
      question: "What happens in a medical emergency?",
      answer:
        "We initiate immediate response via local ambulances or medical services, and inform you instantly. Your parent's emergency contacts are also notified.",
    },
    {
      question: "Is this service available for short-term or trial basis?",
      answer:
        "We offer one-month trials in select cities. This helps you experience the service before making a longer-term commitment.",
    },
    {
      question: "Who is behind Times NRI?",
      answer:
        "Times NRI is powered by the Times of India Group — India's most trusted media group, ensuring credibility, reliability, and heritage you can count on.",
    },
  ]

  return (
    <Accordion type="single" collapsible className="w-full" value={openItem} onValueChange={setOpenItem}>
      {faqs.map((faq, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.1 : 0.3,
            delay: prefersReducedMotion ? 0 : index * 0.05,
          }}
        >
          <AccordionItem value={`item-${index}`} className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
            <AccordionTrigger className="text-left px-6 py-4 hover:bg-gray-50 text-primary font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 bg-white text-gray-700">
              <motion.div
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
              >
                {faq.answer}
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        </motion.div>
      ))}
    </Accordion>
  )
}
