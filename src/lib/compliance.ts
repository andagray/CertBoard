import type { Document, ComplianceStatus, DocumentStatus } from "@/types/database"

export function getDocumentStatus(doc: { expiration_date: string | null; status: string }): DocumentStatus {
  if (!doc.expiration_date) return "current"
  const now = new Date()
  const exp = new Date(doc.expiration_date)
  const diffMs = exp.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "expired"
  if (diffDays <= 30) return "expiring_soon"
  return "current"
}

export function getComplianceStatus(documents: Document[]): ComplianceStatus {
  if (documents.length === 0) return "no_documents"

  const hasExpired = documents.some(d => {
    const status = getDocumentStatus(d)
    return status === "expired"
  })
  if (hasExpired) return "expired"

  const hasExpiring = documents.some(d => {
    const status = getDocumentStatus(d)
    return status === "expiring_soon"
  })
  if (hasExpiring) return "expiring"

  return "compliant"
}

export function getComplianceBadgeColor(status: ComplianceStatus): string {
  switch (status) {
    case "compliant": return "bg-green-100 text-green-800 border-green-200"
    case "expiring": return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "expired": return "bg-red-100 text-red-800 border-red-200"
    case "no_documents": return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

export function getComplianceLabel(status: ComplianceStatus): string {
  switch (status) {
    case "compliant": return "Compliant"
    case "expiring": return "Expiring Soon"
    case "expired": return "Expired"
    case "no_documents": return "No Documents"
  }
}

export function getStatusBadgeColor(status: DocumentStatus): string {
  switch (status) {
    case "current": return "bg-green-100 text-green-800"
    case "expiring_soon": return "bg-yellow-100 text-yellow-800"
    case "expired": return "bg-red-100 text-red-800"
    case "pending_review": return "bg-blue-100 text-blue-800"
  }
}

export function getStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case "current": return "Current"
    case "expiring_soon": return "Expiring Soon"
    case "expired": return "Expired"
    case "pending_review": return "Pending Review"
  }
}

export function getNextExpiringDate(documents: Document[]): string | null {
  const docsWithExpiry = documents.filter(d => d.expiration_date)
  if (docsWithExpiry.length === 0) return null
  docsWithExpiry.sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime())
  return docsWithExpiry[0].expiration_date
}
