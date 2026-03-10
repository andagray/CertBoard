import { createServiceRoleClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PortalContent } from "./portal-content"

export default async function PortalPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createServiceRoleClient()

  // Look up subcontractor by upload token
  const { data: sub } = await supabase
    .from("subcontractors")
    .select("id, company_name, user_id, upload_token")
    .eq("upload_token", params.token)
    .single()

  if (!sub) notFound()

  // Get GC's company name
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name")
    .eq("id", sub.user_id)
    .single()

  // Get existing documents for this sub (no file URLs)
  const { data: documents } = await supabase
    .from("documents")
    .select("id, document_type, status, expiration_date, created_at")
    .eq("subcontractor_id", sub.id)
    .order("created_at", { ascending: false })

  return (
    <PortalContent
      gcCompanyName={profile?.company_name || "Your Contractor"}
      subCompanyName={sub.company_name}
      uploadToken={sub.upload_token}
      documents={documents || []}
    />
  )
}
