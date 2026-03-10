"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, Settings, LogOut, Shield, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import type { Profile } from "@/types/database"

interface AppSidebarProps {
  profile: Profile
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subcontractors", label: "Subcontractors", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white border-b px-4 h-14">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">CertBoard</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-white border-r flex flex-col transition-transform duration-200
        md:translate-x-0 md:static md:z-auto
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 h-16 border-b">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">CertBoard</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium mb-1 transition-colors
                  ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
                `}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t p-4">
          <p className="text-sm font-medium truncate">{profile.company_name}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start mt-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  )
}
