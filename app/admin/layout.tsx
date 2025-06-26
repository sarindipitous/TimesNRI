import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SidebarProvider } from "@/components/sidebar-provider"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col">
        {/* (rest of the layout unchanged) */}
        <header className="bg-primary text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Times NRI Admin</h1>
            <nav className="flex gap-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-primary/80">
                  Back to Site
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex flex-1">
          {/* sidebar + main stay the same */}
          {/* … */}
        </div>
      </div>
    </SidebarProvider>
  )
}
