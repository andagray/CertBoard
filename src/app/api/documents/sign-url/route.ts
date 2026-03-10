import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const path = request.nextUrl.searchParams.get("path")
    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 })
    }

    // Verify the file belongs to this user (path starts with user_id)
    if (!path.startsWith(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 3600) // 1 hour expiry

    if (error) {
      return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
