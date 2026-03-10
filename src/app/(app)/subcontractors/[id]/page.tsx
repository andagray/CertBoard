import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { SubcontractorDetail } from "./subcontractor-detail"

export default async function SubcontractorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: subcontractor } = await supabase
    .from("subcontractors")
    .select("*, documents(*)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!subcontractor) notFound()

  return <SubcontractorDetail subcontractor={subcontractor} userId={user.id} />
}
