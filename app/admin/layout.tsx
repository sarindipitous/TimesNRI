import type React from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { Home, Users, Settings, Mail } from "lucide-react"
import Link from "next/link"

interface Props {
  children: React.ReactNode
}

const AdminLayout = ({ children }: Props) => {
  const routes = [
    {
      icon: <Home className="h-4 w-4" />,
      label: "Dashboard",
      href: "/admin",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Users",
      href: "/admin/users",
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
      href: "/admin/settings",
    },
    {
      icon: <Mail className="h-4 w-4" />,
      label: "Email Config",
      href: "/admin/email",
    },
  ]

  return (
    <div className="flex">
      <Sidebar>
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            {route.icon}
            {route.label}
          </Link>
        ))}
      </Sidebar>
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}

export default AdminLayout
