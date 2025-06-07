"use client"

import { useState } from "react"
import { ShieldAlert, UserCheck, Home, Calendar, Stethoscope, Receipt, ArrowRight, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"

interface ServiceCardProps {
  title: string
  description: string
  icon: string
  scenarios: string[]
  index?: number
}

export function ServiceCard({ title, description, icon, scenarios, index = 0 }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const prefersReducedMotion = useReducedMotion()

  const getIcon = (): LucideIcon => {
    switch (icon) {
      case "shield-alert":
        return ShieldAlert
      case "user-check":
        return UserCheck
      case "home":
        return Home
      case "calendar":
        return Calendar
      case "stethoscope":
        return Stethoscope
      case "receipt":
        return Receipt
      default:
        return ShieldAlert
    }
  }

  const Icon = getIcon()

  const scenarioVariants = {
    hidden: {
      opacity: 0,
      x: prefersReducedMotion ? 0 : -20,
    },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: prefersReducedMotion ? 0 : i * 0.05,
        duration: prefersReducedMotion ? 0.1 : 0.3,
      },
    }),
  }

  return (
    <Card
      className={`transition-all duration-300 overflow-hidden transform ${
        isExpanded ? "shadow-warm border-accent/20" : "shadow-soft hover:shadow-warm"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <motion.div
              className={`shrink-0 rounded-full p-3 transition-all duration-300 ${
                isExpanded || isHovered ? "bg-accent text-white" : "bg-accent-light text-accent"
              }`}
              whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
            </div>
          </div>

          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`mt-4 text-sm flex items-center gap-1 text-accent hover:text-accent/80 transition-colors ${
              isHovered ? "font-medium" : ""
            }`}
            whileHover={prefersReducedMotion ? {} : { x: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {isExpanded ? "Show less" : "How it works"}
            <motion.div
              animate={{ x: isExpanded ? 0 : isHovered ? 5 : 0, rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="h-3 w-3" />
            </motion.div>
          </motion.button>
        </div>

        {isExpanded && (
          <motion.div
            className="bg-accent-light/50 p-6 border-t border-accent/10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="text-sm font-medium mb-3 text-gray-700">Real Scenarios:</h4>
            <ul className="space-y-2">
              {scenarios.map((scenario, i) => (
                <motion.li
                  key={i}
                  className="text-sm text-gray-600 flex items-start gap-2"
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={scenarioVariants}
                >
                  <span className="text-accent mt-1">•</span>
                  <span>{scenario}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
