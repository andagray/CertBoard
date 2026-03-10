"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Shield, Upload, CheckCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getStatusBadgeColor, getStatusLabel } from "@/lib/compliance"
import { DOCUMENT_TYPES } from "@/types/database"
import type { DocumentStatus } from "@/types/database"

interface PortalDocument {
  id: string
  document_type: string
  status: string
  expiration_date: string | null
  created_at: string
}

interface PortalContentProps {
  gcCompanyName: string
  subCompanyName: string
  uploadToken: string
  documents: PortalDocument[]
}

export function PortalContent({ gcCompanyName, subCompanyName, uploadToken, documents }: PortalContentProps) {
  const [documentType, setDocumentType] = useState("COI")
  const [expirationDate, setExpirationDate] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_token", uploadToken)
      formData.append("document_type", documentType)
      if (expirationDate) formData.append("expiration_date", expirationDate)

      const res = await fetch("/api/portal/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">CertBoard</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Context */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Document Upload Portal</h1>
          <p className="text-muted-foreground">
            Upload documents for <span className="font-medium text-foreground">{gcCompanyName}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Uploading as: <span className="font-medium text-foreground">{subCompanyName}</span>
          </p>
        </div>

        {success ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Document Uploaded</h2>
                <p className="text-muted-foreground">
                  Your contractor will review it shortly.
                </p>
                <Button className="mt-6" onClick={() => { setSuccess(false); setFile(null); setExpirationDate(""); }}>
                  Upload Another Document
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Upload Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload a Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label>Document Type *</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>File (PDF, JPG, PNG — max 10MB) *</Label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <Input
                      type="date"
                      value={expirationDate}
                      onChange={e => setExpirationDate(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={uploading || !file} className="w-full">
                    {uploading ? "Uploading..." : "Upload Document"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Documents */}
            {documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Your Documents on File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{doc.document_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.expiration_date
                              ? `Expires: ${format(new Date(doc.expiration_date), "MMM d, yyyy")}`
                              : "No expiration date"}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(doc.status as DocumentStatus)}`}>
                          {getStatusLabel(doc.status as DocumentStatus)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
