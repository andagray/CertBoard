"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Trash2, Upload, Copy, FileText, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { getDocumentStatus, getStatusBadgeColor, getStatusLabel } from "@/lib/compliance"
import type { Subcontractor, Document } from "@/types/database"
import { TRADES, DOCUMENT_TYPES } from "@/types/database"

type SubWithDocs = Subcontractor & { documents: Document[] }

interface SubcontractorDetailProps {
  subcontractor: SubWithDocs
  userId: string
}

export function SubcontractorDetail({ subcontractor: initialSub, userId }: SubcontractorDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [sub, setSub] = useState(initialSub)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    company_name: sub.company_name,
    contact_name: sub.contact_name || "",
    email: sub.email || "",
    phone: sub.phone || "",
    trade: sub.trade || "",
    notes: sub.notes || "",
  })
  const [saving, setSaving] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    document_type: "COI" as string,
    expiration_date: "",
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const portalUrl = `${window.location.origin}/portal/${sub.upload_token}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl)
    toast.success("Portal link copied to clipboard")
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    const { error } = await supabase
      .from("subcontractors")
      .update({
        company_name: editForm.company_name,
        contact_name: editForm.contact_name || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        trade: editForm.trade || null,
        notes: editForm.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id)

    if (error) {
      toast.error("Failed to update subcontractor")
    } else {
      setSub(prev => ({ ...prev, ...editForm }))
      setEditing(false)
      toast.success("Subcontractor updated")
      router.refresh()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this subcontractor and all their documents?")) return
    const { error } = await supabase.from("subcontractors").delete().eq("id", sub.id)
    if (error) {
      toast.error("Failed to delete subcontractor")
    } else {
      toast.success("Subcontractor deleted")
      router.push("/subcontractors")
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("subcontractor_id", sub.id)
      formData.append("user_id", userId)
      formData.append("document_type", uploadForm.document_type)
      if (uploadForm.expiration_date) {
        formData.append("expiration_date", uploadForm.expiration_date)
      }

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      toast.success("Document uploaded")
      setUploadOpen(false)
      setUploadFile(null)
      setUploadForm({ document_type: "COI", expiration_date: "" })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleViewDocument = async (doc: Document) => {
    try {
      const res = await fetch(`/api/documents/sign-url?path=${encodeURIComponent(doc.file_url)}`)
      if (!res.ok) throw new Error("Failed to get URL")
      const { url } = await res.json()
      window.open(url, "_blank")
    } catch {
      toast.error("Failed to open document")
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Delete this document?")) return
    const { error } = await supabase.from("documents").delete().eq("id", docId)
    if (error) {
      toast.error("Failed to delete document")
    } else {
      setSub(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== docId),
      }))
      toast.success("Document deleted")
      router.refresh()
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/subcontractors"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{sub.company_name}</h1>
          {sub.trade && <p className="text-sm text-muted-foreground">{sub.trade}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </div>

      {/* Sub Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Company Name *</Label>
                <Input value={editForm.company_name} onChange={e => setEditForm(f => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input value={editForm.contact_name} onChange={e => setEditForm(f => ({ ...f, contact_name: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Trade</Label>
                <Select value={editForm.trade} onValueChange={v => setEditForm(f => ({ ...f, trade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                  <SelectContent>
                    {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button onClick={handleSaveEdit} disabled={saving || !editForm.company_name}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Contact:</span> {sub.contact_name || "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {sub.email || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {sub.phone || "—"}</div>
              <div><span className="text-muted-foreground">Trade:</span> {sub.trade || "—"}</div>
              {sub.notes && <div className="sm:col-span-2"><span className="text-muted-foreground">Notes:</span> {sub.notes}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Self-Service Portal Link */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <p className="text-sm font-medium mb-2">Self-Service Upload Portal</p>
          <p className="text-xs text-muted-foreground mb-3">
            Share this link with your subcontractor so they can upload documents directly.
          </p>
          <div className="flex items-center gap-2">
            <Input value={portalUrl} readOnly className="text-xs" />
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-1" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label>Document Type *</Label>
                  <Select value={uploadForm.document_type} onValueChange={v => setUploadForm(f => ({ ...f, document_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>File (PDF, JPG, PNG — max 10MB) *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <Label>Expiration Date {uploadForm.document_type === "W9" && "(optional for W9s)"}</Label>
                  <Input
                    type="date"
                    value={uploadForm.expiration_date}
                    onChange={e => setUploadForm(f => ({ ...f, expiration_date: e.target.value }))}
                  />
                </div>
                <Button type="submit" disabled={uploading || !uploadFile} className="w-full">
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {sub.documents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No documents uploaded yet. Upload a document or share the portal link with your sub.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Type</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">File</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground hidden sm:table-cell">Expires</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground hidden sm:table-cell">Uploaded By</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sub.documents.map(doc => {
                    const status = getDocumentStatus(doc)
                    return (
                      <tr key={doc.id} className="border-b last:border-0">
                        <td className="py-3 text-sm font-medium">{doc.document_type}</td>
                        <td className="py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">{doc.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground hidden sm:table-cell">
                          {doc.expiration_date ? format(new Date(doc.expiration_date), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground hidden sm:table-cell capitalize">
                          {doc.uploaded_by === "gc" ? "You" : "Sub"}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDocument(doc)} title="View/Download">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDocument(doc.id)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
