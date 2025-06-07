import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
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
        <aside className="w-64 bg-gray-100 p-4 hidden md:block">
          <nav className="space-y-2">
            <Link href="/admin" className="block p-2 hover:bg-gray-200 rounded">
              Waitlist Entries
            </Link>
            <Link href="/admin/dashboard" className="block p-2 hover:bg-gray-200 rounded">
              Dashboard
            </Link>
            <Link href="/admin/seed" className="block p-2 hover:bg-gray-200 rounded">
              Seed Database
            </Link>
            <Link href="/api/test-db" target="_blank" className="block p-2 hover:bg-gray-200 rounded">
              Test Database
            </Link>
            <Link href="/api/setup-db" target="_blank" className="block p-2 hover:bg-gray-200 rounded">
              Setup Database
            </Link>
          </nav>
        </aside>

        <main className="flex-1 bg-white">{children}</main>
      </div>
    </div>
  )
}
