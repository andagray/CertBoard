import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import type { DocumentType, DocumentStatus } from "@/types/database"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const subcontractorId = formData.get("subcontractor_id") as string
    const documentType = formData.get("document_type") as string
    const expirationDate = formData.get("expiration_date") as string | null

    if (!file || !subcontractorId || !documentType) {
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

    // Generate unique file path
    const fileId = crypto.randomUUID()
    const ext = file.name.split(".").pop()
    const filePath = `${user.id}/${subcontractorId}/${fileId}.${ext}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: "Failed to upload file: " + uploadError.message }, { status: 500 })
    }

    // Determine status based on expiration date
    let status: DocumentStatus = "current"
    if (expirationDate) {
      const expDate = new Date(expirationDate)
      const now = new Date()
      const diffMs = expDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays < 0) status = "expired"
      else if (diffDays <= 30) status = "expiring_soon"
    }

    // Insert document record
    const { error: dbError } = await supabase
      .from("documents")
      .insert({
        subcontractor_id: subcontractorId,
        user_id: user.id,
        document_type: documentType as DocumentType,
        file_url: filePath,
        file_name: file.name,
        expiration_date: expirationDate || null,
        status,
        uploaded_by: "gc" as const,
      })

    if (dbError) {
      // Clean up uploaded file on DB error
      await supabase.storage.from("documents").remove([filePath])
      return NextResponse.json({ error: "Failed to save document record" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
