"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { TimesNriBadge } from "@/components/times-nri-badge"
import { MobileWaitlistButton } from "@/components/mobile-waitlist-button"
import { ArrowRight, Heart, Stethoscope, MessageCircle, Bell } from "lucide-react"
import Image from "next/image"
import { getBlobUrl } from "@/utils/image-utils"
import dynamic from "next/dynamic"
import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, useInView, useReducedMotion } from "framer-motion"
import { PricingSection } from "@/components/pricing-section"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

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

export default function Home() {
  // Define hero image with a fallback
  const heroImage = getBlobUrl("/images/hero-video-call.png")
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.05], [1, 0.8])
  const scale = useTransform(scrollYProgress, [0, 0.05], [1, 0.98])
  const searchParams = useSearchParams()

  // Inside the Home component, add these lines after the heroImage definition
  const prefersReducedMotion = useReducedMotion()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Check if user came from compare page with a plan selection
  useEffect(() => {
    const plan = searchParams.get("plan")
    if (plan) {
      // Redirect to waitlist page with the selected plan
      window.location.href = `/waitlist?plan=${plan}`
    }
  }, [searchParams])

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
              <div className="space-y-6">
                <motion.h1
                  className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl/none text-primary leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                >
                  You live far from home.
                  <br />
                  <motion.span
                    className="text-accent"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.1, ease: "easeOut" }}
                  >
                    Your heart stays behind.
                  </motion.span>
                </motion.h1>
                <motion.p
                  className="text-gray-700 text-lg leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                >
                  Every missed call from India spikes your chest. Every hospital WhatsApp shakes your spine.
                  <br />
                  <br />
                  <span className="font-medium text-primary">This isn't about guilt. It's about love.</span>
                </motion.p>
              </div>

              <motion.div
                className="pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/waitlist">
                    <Button
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 py-7 px-8 text-lg font-semibold"
                    >
                      Join Our Waitlist{" "}
                      <motion.span initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.3 }}>
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </motion.span>
                    </Button>
                  </Link>
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

      {/* Emotional Tension Section */}
      <AnimatedSection id="about" className="bg-secondary py-16 md:py-24 relative overflow-hidden">
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
              <div className="space-y-6">
                <motion.h2
                  className="text-3xl font-bold tracking-tight sm:text-4xl text-primary"
                  variants={itemVariants}
                >
                  You've told yourself, "I'll figure something out."
                </motion.h2>
                <motion.div className="space-y-4 text-gray-700 text-lg leading-relaxed" variants={itemVariants}>
                  <p>But there's nothing to figure. They're ageing. And you're not there.</p>
                  <p>You've built a life abroad. But your heart, a part of it, stays behind. With them.</p>
                  <p className="font-medium text-primary">And love, when you can't be there, looks like this.</p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* What We Do Section */}
      <AnimatedSection id="services" className="bg-white py-16 md:py-24 border-b border-gray-100">
        <div className="container px-4 md:px-6">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
            variants={itemVariants}
          >
            <motion.h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary" variants={itemVariants}>
              Times NRI is built around the four things that ageing parents truly need
            </motion.h2>
            <motion.p className="max-w-3xl text-gray-600 text-lg leading-relaxed" variants={itemVariants}>
              Not just helplines, but doctors and nurses who show up in person when it matters.
            </motion.p>
          </motion.div>

          <motion.div
            className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4"
            variants={itemVariants}
          >
            {[
              {
                title: "Emergency",
                description: "Not just helplines, but doctors and nurses who show up in person when it matters.",
                icon: <Stethoscope className="h-8 w-8 text-red-500" />,
                color: "red",
              },
              {
                title: "Health & Wellness",
                description:
                  "To extend their healthspan, preserve independence, and bring high quality care into the home.",
                icon: <Heart className="h-8 w-8 text-green-500" />,
                color: "green",
              },
              {
                title: "Engagement",
                description: "To fight loneliness with presence, purpose, and joy.",
                icon: <MessageCircle className="h-8 w-8 text-blue-500" />,
                color: "blue",
              },
              {
                title: "Convenience",
                description: "To take over the small stresses that grow big in their absence.",
                icon: <Bell className="h-8 w-8 text-purple-500" />,
                color: "purple",
              },
            ].map((pillar, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                whileHover={{
                  y: -10,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                  transition: { duration: 0.3 },
                }}
                className="bg-white p-8 rounded-2xl shadow-soft border border-gray-100 text-center"
              >
                <motion.div
                  className={`bg-${pillar.color}-50 p-4 rounded-2xl inline-flex mb-6`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {pillar.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{pillar.title}</h3>
                <p className="text-gray-600 leading-relaxed">{pillar.description}</p>
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

      {/* Care Plans Section */}
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
          <div className="max-w-4xl mx-auto text-center">
            <motion.div className="flex flex-col justify-center space-y-8" variants={itemVariants}>
              <div className="space-y-6">
                <motion.h2 className="text-4xl font-bold tracking-tight text-primary" variants={itemVariants}>
                  Times NRI
                </motion.h2>
                <motion.div
                  className="space-y-6 text-gray-700 text-xl leading-relaxed max-w-3xl mx-auto"
                  variants={itemVariants}
                >
                  <p>This isn't a healthcare service.</p>
                  <p className="font-semibold text-primary text-2xl">
                    This is what love looks like when you can't be there.
                  </p>
                  <p>
                    It's the answer to that 2am feeling NRIs know too well - the missed call, the WhatsApp from a
                    cousin, the helpless panic.
                  </p>
                  <p>It's a quiet promise, structured into a service:</p>
                  <p className="font-medium text-primary text-xl italic">
                    "I may not be with you physically, but you'll never be without care."
                  </p>
                </motion.div>
                <motion.div className="pt-8" variants={itemVariants}>
                  <Link href="/waitlist">
                    <Button
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-white transition-all duration-300 py-6 px-8 text-lg font-semibold"
                    >
                      Join Our Waitlist
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
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
