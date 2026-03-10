import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar profile={profile} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
