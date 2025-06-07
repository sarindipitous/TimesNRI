"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/components/service-card"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { TimesNriBadge } from "@/components/times-nri-badge"
import { MobileWaitlistButton } from "@/components/mobile-waitlist-button"
import { ArrowRight, Clock, Shield, Users, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { getBlobUrl } from "@/utils/image-utils"
import dynamic from "next/dynamic"
import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, useInView, useReducedMotion } from "framer-motion"
import { PricingSection } from "@/components/pricing-section"

// Lazy load components that are below the fold
const LazyTestimonials = dynamic(
  () => import("../components/testimonials").then((mod) => ({ default: mod.Testimonials })),
  {
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <p>Loading testimonials...</p>
      </div>
    ),
    ssr: false,
  },
)

const LazyFaq = dynamic(() => import("../components/faq").then((mod) => ({ default: mod.Faq })), {
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <p>Loading FAQ...</p>
    </div>
  ),
  ssr: false,
})

const LazyCityMap = dynamic(() => import("../components/city-map").then((mod) => ({ default: mod.CityMap })), {
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <p>Loading service locations...</p>
    </div>
  ),
  ssr: false,
})

const LazyHowItWorks = dynamic(
  () => import("../components/how-it-works").then((mod) => ({ default: mod.HowItWorks })),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    ),
    ssr: false,
  },
)

// Component to handle lazy loading with intersection observer
function LazyLoadComponent({
  component: Component,
  placeholder,
  id,
}: {
  component: React.ComponentType
  placeholder: React.ReactNode
  id: string
}) {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "200px", // Load when within 200px of viewport
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setShouldLoad(true)
        observer.disconnect()
      }
    }, options)

    const targetElement = document.getElementById(id)
    if (targetElement) {
      observer.observe(targetElement)
    }

    return () => {
      observer.disconnect()
    }
  }, [id])

  return shouldLoad ? <Component /> : placeholder
}

// Add this function before the Home component
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    const listener = () => {
      setMatches(media.matches)
    }
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [matches, query])

  return matches
}

// Animated Section component
function AnimatedSection({
  children,
  className,
  id,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  id?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const prefersReducedMotion = useReducedMotion()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const sectionVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.6,
        ease: "easeOut",
        staggerChildren: prefersReducedMotion ? 0 : isMobile ? 0.1 : 0.2,
        delayChildren: prefersReducedMotion ? 0 : isMobile ? 0.1 : 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : isMobile ? 0.3 : 0.5,
        ease: "easeOut",
      },
    },
  }

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 30,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : isMobile ? 0.3 : 0.5,
        ease: "easeOut",
        delay: prefersReducedMotion ? 0 : isMobile ? i * 0.05 : i * 0.1,
      },
    }),
  }

  return (
    <motion.section
      id={id}
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={sectionVariants}
      custom={delay}
    >
      {children}
    </motion.section>
  )
}

// Update any references to the "join" section to point to a different section or handle it differently
// For example, update the scrollToJoin function and any onClick handlers that use it

// Find and update the scrollToJoin function:
const scrollToJoin = () => {
  // Instead of scrolling to the join section, open the waitlist dialog
  const headerElement = document.querySelector("header")
  if (headerElement) {
    const event = new CustomEvent("openWaitlistDialog")
    headerElement.dispatchEvent(event)
  }
}

// Also update any other places where scrollToJoin is used or where "#join" is referenced

export default function Home() {
  // Define hero image with a fallback
  const heroImage = getBlobUrl("/images/hero-video-call.png")
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.05], [1, 0.8])
  const scale = useTransform(scrollYProgress, [0, 0.05], [1, 0.98])

  // Inside the Home component, add these lines after the heroImage definition
  const prefersReducedMotion = useReducedMotion()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Define variants here inside the component to use hooks properly
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : isMobile ? 0.3 : 0.5,
        ease: "easeOut",
      },
    },
  }

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 30,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : isMobile ? 0.3 : 0.5,
        ease: "easeOut",
        delay: prefersReducedMotion ? 0 : isMobile ? i * 0.05 : i * 0.1,
      },
    }),
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* Hero Section */}
      <motion.section
        id="hero"
        className="relative bg-gradient-to-r from-secondary to-white py-16 md:py-24 overflow-hidden"
        style={{ opacity, scale }}
      >
        {/* Animated background elements */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-primary-light rounded-full -translate-y-1/2 translate-x-1/2 opacity-30"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-accent-light rounded-full translate-y-1/2 -translate-x-1/2 opacity-30"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 1,
          }}
        />

        <TimesNriBadge />
        <div className="container px-4 md:px-6">
          <motion.div
            className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20 items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="flex flex-col justify-center space-y-8 max-w-xl"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <div className="space-y-5">
                <motion.h1
                  className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl/none text-primary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                >
                  When you can&apos;t be there,{" "}
                  <motion.span
                    className="text-accent"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.1, ease: "easeOut" }}
                  >
                    we will
                  </motion.span>
                  .
                </motion.h1>
                <motion.p
                  className="text-gray-700 text-lg leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                >
                  A verified, on-demand care concierge for your parents in India. We provide the support they need, with
                  the transparency you deserve.
                </motion.p>
              </div>

              <motion.div
                className="grid grid-cols-2 gap-4 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              >
                <motion.div
                  className="flex items-start gap-3"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <Clock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium">24/7 Support</h3>
                    <p className="text-xs text-gray-500">Across all time zones</p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-start gap-3"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium">Verified Caregivers</h3>
                    <p className="text-xs text-gray-500">Background checked</p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-start gap-3"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <Users className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium">1000+ Families</h3>
                    <p className="text-xs text-gray-500">Trust our services</p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-start gap-3"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium">Times Group</h3>
                    <p className="text-xs text-gray-500">Backed by legacy</p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                className="pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 py-7 px-6" // Increased touch target
                    onClick={() => {
                      const headerElement = document.querySelector("header")
                      if (headerElement) {
                        // Access the header component's waitlist dialog open function
                        const event = new CustomEvent("openWaitlistDialog")
                        headerElement.dispatchEvent(event)
                      }
                    }}
                  >
                    Join the Waitlist{" "}
                    <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.3 }}>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.span>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
            <motion.div
              className="flex items-center justify-center lg:justify-end"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <motion.div
                className="relative h-[350px] w-full max-w-md overflow-hidden rounded-2xl shadow-warm sm:h-[450px]"
                whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent z-10"></div>
                <Image
                  src={heroImage || "/placeholder.svg"}
                  alt="NRI professional on a video call with his mother in India, showing the time difference between countries"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  priority
                  unoptimized
                />
                <motion.div
                  className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-soft z-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <p className="text-sm font-medium text-primary">8:30 AM (US) | 7:00 PM (India)</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Trust & Verification Section */}
      <AnimatedSection className="bg-white py-12 border-y border-gray-100" id="trust">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div className="flex flex-col items-center text-center space-y-4 mb-8" variants={itemVariants}>
              <motion.div
                className="inline-flex items-center justify-center rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary mb-2"
                whileHover={{ scale: 1.05 }}
                variants={itemVariants}
              >
                Our Commitment to Trust
              </motion.div>
              <motion.h2 className="text-2xl font-bold text-gray-900" variants={itemVariants}>
                How We Verify Our Caregivers
              </motion.h2>
              <motion.p className="text-gray-600" variants={itemVariants}>
                We understand that trust is paramount when it comes to caring for your loved ones.
              </motion.p>
            </motion.div>

            <motion.div className="grid md:grid-cols-3 gap-6" variants={itemVariants}>
              {[
                {
                  icon: <Shield className="h-6 w-6 text-primary" />,
                  title: "Background Verification",
                  description:
                    "Criminal background checks, address verification, and employment history validation for all caregivers.",
                },
                {
                  icon: <Users className="h-6 w-6 text-accent" />,
                  title: "Skill Certification",
                  description:
                    "Verification of medical credentials, specialized training certification, and regular skill assessments.",
                },
                {
                  icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
                  title: "Ongoing Monitoring",
                  description:
                    "Regular performance reviews, client feedback integration, and continuous professional development.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="bg-white p-6 rounded-xl shadow-soft border border-gray-100 transition-all duration-300"
                  variants={cardVariants}
                  custom={i}
                  whileHover={{
                    y: -8,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                    transition: { duration: 0.3 },
                  }}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <motion.div
                      className={`bg-${i % 2 === 0 ? "primary" : "accent"}-light p-3 rounded-full`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {item.icon}
                    </motion.div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div className="mt-8 text-center" variants={itemVariants}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary-light transition-all duration-300 py-6 px-6" // Increased touch target
                  onClick={() => {
                    const servicesSection = document.getElementById("services")
                    if (servicesSection) {
                      servicesSection.scrollIntoView({ behavior: "smooth" })
                    }
                  }}
                >
                  Learn more about our services{" "}
                  <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.3 }}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.span>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Emotional Tension Section */}
      <AnimatedSection id="about" className="bg-secondary py-16 md:py-24 relative overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-accent-light rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"
          animate={{
            y: ["-50%", "-48%", "-50%"],
            x: ["50%", "52%", "50%"],
          }}
          transition={{
            duration: 10,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-primary-light rounded-full translate-y-1/2 -translate-x-1/2 opacity-50"
          animate={{
            y: ["50%", "48%", "50%"],
            x: ["-50%", "-48%", "-50%"],
          }}
          transition={{
            duration: 10,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 1,
          }}
        />
        <div className="container px-4 md:px-6 relative z-10">
          <motion.div className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20 items-center" variants={itemVariants}>
            <motion.div className="flex items-center justify-center order-2 lg:order-1" variants={itemVariants}>
              <motion.div
                className="relative h-[350px] w-full max-w-md overflow-hidden rounded-2xl shadow-warm sm:h-[450px]"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src="/images/worried-parent.png"
                  alt="Elderly Indian father looking concerned while checking his smartphone"
                  fill
                  className="object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <div className="p-6 text-white">
                    <motion.p
                      className="text-lg font-medium"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                    >
                      "I don't want to worry my children, but I need help..."
                    </motion.p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
            <motion.div className="flex flex-col justify-center space-y-6 order-1 lg:order-2" variants={itemVariants}>
              <div className="space-y-5">
                <motion.h2
                  className="text-3xl font-bold tracking-tight sm:text-4xl text-primary"
                  variants={itemVariants}
                >
                  You&apos;re thousands of miles away. But your parents still need you.
                </motion.h2>
                <motion.p className="text-gray-700 text-lg leading-relaxed" variants={itemVariants}>
                  You moved abroad to build a better life. But every missed call or medical scare pulls you right back
                  into worry. The guilt of distance can be overwhelming.
                </motion.p>
                <motion.p className="text-gray-700 text-lg leading-relaxed" variants={itemVariants}>
                  That&apos;s why we created Elderly Care Concierge — a verified, local support system built for NRIs
                  who care deeply, even from far away. We become your presence when you can't be there physically.
                </motion.p>
                <motion.div className="pt-4" variants={itemVariants}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 py-7 px-6" // Increased touch target
                      onClick={() => {
                        const howItWorksSection = document.getElementById("how-it-works")
                        if (howItWorksSection) {
                          howItWorksSection.scrollIntoView({ behavior: "smooth" })
                        }
                      }}
                    >
                      Learn How It Works{" "}
                      <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.3 }}>
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </motion.span>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Services Overview */}
      <AnimatedSection id="services" className="bg-white py-16 md:py-24 border-b border-gray-100">
        <div className="container px-4 md:px-6">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            variants={itemVariants}
          >
            <motion.div
              className="inline-flex items-center justify-center rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent mb-2"
              whileHover={{ scale: 1.05 }}
              variants={itemVariants}
            >
              Our Services
            </motion.div>
            <motion.h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary" variants={itemVariants}>
              Everything they need. Handled by people you can trust.
            </motion.h2>
            <motion.p className="max-w-[700px] text-gray-600 text-lg" variants={itemVariants}>
              Professional, verified services designed specifically for elderly parents in India.
            </motion.p>
          </motion.div>
          <motion.div
            className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-8 sm:grid-cols-2 md:grid-cols-3"
            variants={itemVariants}
          >
            {[
              {
                title: "24x7 Emergency Assistance",
                description: "Immediate local help when emergencies strike, no matter your time zone.",
                icon: "shield-alert",
                scenarios: [
                  "Your father falls at night and needs immediate medical attention",
                  "Your mother experiences chest pain and needs emergency transport",
                  "A sudden power outage leaves your parents without electricity for hours",
                ],
              },
              {
                title: "Trained Attendants",
                description: "Certified support for daily care or recovery needs with detailed reporting.",
                icon: "user-check",
                scenarios: [
                  "Post-surgery recovery requiring specialized care",
                  "Regular assistance with medication management and daily activities",
                  "Companionship and cognitive stimulation for parents with memory issues",
                ],
              },
              {
                title: "At-Home Visits",
                description: "Regular wellness checks with photo documentation and detailed reports.",
                icon: "home",
                scenarios: [
                  "Weekly home safety assessments with photo documentation",
                  "Regular health monitoring including vitals and medication compliance",
                  "Companionship visits to reduce isolation and improve mental wellbeing",
                ],
              },
              {
                title: "Doctor Scheduling",
                description: "We research specialists, book appointments, and coordinate transportation.",
                icon: "calendar",
                scenarios: [
                  "Finding the right specialist based on medical history and current needs",
                  "Securing priority appointments with top doctors in their specialty",
                  "Coordinating follow-up care and prescription management",
                ],
              },
              {
                title: "Accompanied Doctor Visits",
                description: "Our coordinators attend appointments, take notes, and ask questions on your behalf.",
                icon: "stethoscope",
                scenarios: [
                  "Medical coordinator attends specialist appointments and provides detailed summaries",
                  "Video calls with you during critical consultations for real-time involvement",
                  "Translation of medical terminology and treatment plans into clear language",
                ],
              },
              {
                title: "Online Bill Payments",
                description: "Utilities, services, or medicines — paid and tracked with complete transparency.",
                icon: "receipt",
                scenarios: [
                  "Utility bill management with payment verification and receipt documentation",
                  "Medication refill and delivery coordination",
                  "Property maintenance payments and service scheduling",
                ],
              },
            ].map((service, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                whileHover={{
                  y: -10,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                  transition: { duration: 0.3 },
                }}
              >
                <ServiceCard
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  scenarios={service.scenarios}
                  index={i}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* How It Works */}
      <AnimatedSection id="how-it-works" className="bg-secondary py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            variants={itemVariants}
          >
            <motion.div
              className="inline-flex items-center justify-center rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary mb-2"
              whileHover={{ scale: 1.05 }}
              variants={itemVariants}
            >
              The Process
            </motion.div>
            <motion.h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary" variants={itemVariants}>
              Simple. Human. Reliable.
            </motion.h2>
            <motion.p className="max-w-[700px] text-gray-600 text-lg" variants={itemVariants}>
              We've designed a seamless experience that gives you peace of mind, no matter the distance.
            </motion.p>
          </motion.div>
          <motion.div variants={itemVariants}>
            <LazyLoadComponent
              component={LazyHowItWorks}
              placeholder={
                <div className="h-64 flex items-center justify-center">
                  <p>Loading...</p>
                </div>
              }
              id="how-it-works"
            />
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Pricing Section */}
      <AnimatedSection id="pricing" className="bg-secondary py-16 md:py-24 border-t border-gray-100">
        <PricingSection />
      </AnimatedSection>

      {/* Testimonials */}
      <AnimatedSection id="testimonials" className="bg-primary text-white py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            variants={itemVariants}
          >
            <motion.h2 className="text-3xl font-bold tracking-tight sm:text-4xl" variants={itemVariants}>
              Real Stories from NRIs Like You
            </motion.h2>
            <motion.p className="max-w-[700px] text-gray-300 text-lg" variants={itemVariants}>
              Hear from families who've found peace of mind with our services.
            </motion.p>
          </motion.div>
          <motion.div variants={itemVariants}>
            <LazyLoadComponent
              component={LazyTestimonials}
              placeholder={
                <div className="h-96 flex items-center justify-center">
                  <p>Loading testimonials...</p>
                </div>
              }
              id="testimonials"
            />
          </motion.div>
        </div>
      </AnimatedSection>

      {/* City Coverage */}
      <AnimatedSection id="cities" className="bg-white py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            variants={itemVariants}
          >
            <motion.h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary" variants={itemVariants}>
              Where We Operate
            </motion.h2>
            <motion.p className="max-w-[700px] text-gray-600 text-lg" variants={itemVariants}>
              Currently serving major Indian cities, with more locations coming soon.
            </motion.p>
          </motion.div>
          <motion.div variants={itemVariants}>
            <LazyLoadComponent
              component={LazyCityMap}
              placeholder={
                <div className="h-64 flex items-center justify-center">
                  <p>Loading service locations...</p>
                </div>
              }
              id="cities"
            />
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Founder's Note */}
      <AnimatedSection id="story" className="bg-secondary py-16 md:py-24 border-t border-gray-100">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div className="flex flex-col justify-center space-y-6" variants={itemVariants}>
              <motion.div
                className="inline-flex items-center justify-center w-fit rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent mb-2"
                whileHover={{ scale: 1.05 }}
                variants={itemVariants}
              >
                Our Story
              </motion.div>
              <div className="space-y-5">
                <motion.h2
                  className="text-3xl font-bold tracking-tight sm:text-4xl text-primary"
                  variants={itemVariants}
                >
                  Why we built this
                </motion.h2>
                <motion.p className="text-gray-700 text-lg leading-relaxed" variants={itemVariants}>
                  We&apos;re NRIs too. We&apos;ve faced the helplessness, the frustration, the fear of not being there
                  when it mattered most. The 3 AM phone calls that leave you feeling powerless.
                </motion.p>
                <motion.p className="text-gray-700 text-lg leading-relaxed" variants={itemVariants}>
                  That&apos;s why we built Times NRI — to bring verified, reliable services to the people we love most.
                  To create the support system we wished we had when our own parents needed help.
                </motion.p>
                <motion.div className="pt-6" variants={itemVariants}>
                  <Button
                    variant="outline"
                    className="text-primary border-primary hover:bg-primary-light transition-all duration-300"
                    onClick={() => {
                      scrollToJoin()
                    }}
                  >
                    Join Our Waitlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* FAQs */}
      <AnimatedSection id="faq" className="bg-white py-16 md:py-24 border-t border-gray-100">
        <div className="container px-4 md:px-6">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
            variants={itemVariants}
          >
            <motion.div
              className="inline-flex items-center justify-center rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent mb-2"
              whileHover={{ scale: 1.05 }}
              variants={itemVariants}
            >
              FAQ
            </motion.div>
            <motion.h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary" variants={itemVariants}>
              Frequently Asked Questions
            </motion.h2>
            <motion.p className="max-w-[700px] text-gray-600 text-lg" variants={itemVariants}>
              Everything you need to know about our elderly care services.
            </motion.p>
          </motion.div>
          <motion.div className="mx-auto max-w-3xl py-8" variants={itemVariants}>
            <LazyLoadComponent
              component={LazyFaq}
              placeholder={
                <div className="h-64 flex items-center justify-center">
                  <p>Loading FAQ...</p>
                </div>
              }
              id="faq"
            />
          </motion.div>
        </div>
      </AnimatedSection>

      <Footer />
      <MobileWaitlistButton />
    </div>
  )
}
