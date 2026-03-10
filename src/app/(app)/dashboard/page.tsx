import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardContent } from "./dashboard-content"

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: subcontractors } = await supabase
    .from("subcontractors")
    .select("*, documents(*)")
    .eq("user_id", user.id)
    .order("company_name")

  return <DashboardContent subcontractors={subcontractors || []} />
}
