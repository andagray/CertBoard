import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadToken = formData.get("upload_token") as string
    const documentType = formData.get("document_type") as string
    const expirationDate = formData.get("expiration_date") as string | null

    if (!file || !uploadToken || !documentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF, JPG, PNG allowed." }, { status: 400 })
    }

    // Look up subcontractor by upload_token
    const { data: sub, error: subError } = await supabase
      .from("subcontractors")
      .select("id, user_id")
      .eq("upload_token", uploadToken)
      .single()

    if (subError || !sub) {
      return NextResponse.json({ error: "Invalid upload token" }, { status: 404 })
    }

    // Generate unique file path
    const fileId = crypto.randomUUID()
    const ext = file.name.split(".").pop()
    const filePath = `${sub.user_id}/${sub.id}/${fileId}.${ext}`

    // Upload to Supabase Storage using service role
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Insert document record — always pending_review for portal uploads
    const { error: dbError } = await supabase
      .from("documents")
      .insert({
        subcontractor_id: sub.id,
        user_id: sub.user_id,
        document_type: documentType as "COI" | "W9" | "License" | "Bond" | "Other",
        file_url: filePath,
        file_name: file.name,
        expiration_date: expirationDate || null,
        status: "pending_review",
        uploaded_by: "subcontractor",
      })

    if (dbError) {
      await supabase.storage.from("documents").remove([filePath])
      return NextResponse.json({ error: "Failed to save document record" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
