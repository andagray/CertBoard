import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const user = data.user

  // Check if a profile already exists for this user
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  // If no profile exists, create one from the user metadata
  if (!existingProfile) {
    await supabase.from("profiles").insert({
      id: user.id,
      company_name: user.user_metadata?.company_name ?? "",
      email: user.email ?? "",
    })
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
