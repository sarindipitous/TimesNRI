"use client"

import { useState } from "react"
import { Heart, Phone, Clock, Shield, User, MessageSquare } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

export function CareCompanionSection() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: <User className="h-6 w-6" />,
      title: "Your Dedicated Point Person",
      description: "One person who knows your family's story, your parents' preferences, and your concerns.",
      detail:
        "No more explaining your situation to different people every time. Your Care Companion becomes an extension of your family.",
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Always Reachable",
      description: "WhatsApp, call, or message - your Care Companion is available when you need them most.",
      detail: "Whether it's 2 AM your time or a routine check-in, you have a direct line to someone who cares.",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Proactive Care Coordination",
      description: "They don't wait for problems. They anticipate needs and coordinate care before issues arise.",
      detail:
        "From scheduling appointments to following up on treatments, they handle the details so you don't have to worry.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Your Parents' Advocate",
      description: "Someone who speaks up for your parents when you can't be there in person.",
      detail: "They ensure your parents get the attention and care they deserve, every single time.",
    },
  ]

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center justify-center rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent mb-4">
            The Heart of Our Service
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary mb-6">Meet Your Care Companion</h2>
          <p className="max-w-3xl mx-auto text-gray-600 text-lg leading-relaxed">
            This isn't a call center or chatbot. It's a real person who becomes part of your family's care journey -
            someone who knows your parents by name, understands their needs, and acts as your eyes and ears in India.
          </p>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Image Section */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="relative h-[400px] w-full overflow-hidden rounded-2xl shadow-warm">
              <Image
                src="/images/local-care-team.png"
                alt="Care companion providing personalized care to elderly gentleman in comfortable home setting"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>

              {/* Floating notification */}
              <motion.div
                className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-[280px]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-primary">Care Update</span>
                </div>
                <p className="text-xs text-gray-600">
                  "Just confirmed tomorrow's physiotherapy session with Dr. Sharma. I'll be there to assist."
                </p>
                <p className="text-xs text-accent font-medium mt-1">- Priya, Your Care Companion</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  activeFeature === index
                    ? "border-accent bg-accent/5 shadow-lg"
                    : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                }`}
                onClick={() => setActiveFeature(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      activeFeature === index ? "bg-accent text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
                    <p className="text-gray-600 mb-3">{feature.description}</p>
                    <motion.div
                      initial={false}
                      animate={{
                        height: activeFeature === index ? "auto" : 0,
                        opacity: activeFeature === index ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-gray-500 italic border-l-2 border-accent pl-4">{feature.detail}</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16 p-8 bg-secondary rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-accent" />
            <MessageSquare className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-2xl font-bold text-primary mb-4">It's not just care coordination.</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            It's having someone in India who genuinely cares about your parents' wellbeing - and understands the weight
            of responsibility you carry as their child living abroad.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
