"use client"
import type React from "react"
import { createContext, useContext, useState } from "react"

type SidebarCtx = { collapsed: boolean; setCollapsed: (v: boolean) => void }

const SidebarContext = createContext<SidebarCtx | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return <SidebarContext.Provider value={{ collapsed, setCollapsed }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider.")
  return ctx
}
