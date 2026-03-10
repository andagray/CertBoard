"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, FileText, Mail, Phone, Search } from "lucide-react"
import { TRADES } from "@/types/database"
import type { Subcontractor, Document } from "@/types/database"
import {
  getComplianceStatus,
  getComplianceBadgeColor,
  getComplianceLabel,
} from "@/lib/compliance"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type SubWithDocs = Subcontractor & { documents: Document[] }

interface SubcontractorsContentProps {
  subcontractors: SubWithDocs[]
}

export function SubcontractorsContent({ subcontractors }: SubcontractorsContentProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [tradeFilter, setTradeFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    trade: "",
    notes: "",
  })

  const filtered = useMemo(() => {
    return subcontractors.filter(sub => {
      const matchesSearch =
        !search ||
        sub.company_name.toLowerCase().includes(search.toLowerCase()) ||
        (sub.contact_name && sub.contact_name.toLowerCase().includes(search.toLowerCase())) ||
        (sub.email && sub.email.toLowerCase().includes(search.toLowerCase()))
      const matchesTrade = tradeFilter === "all" || sub.trade === tradeFilter
      return matchesSearch && matchesTrade
    })
  }, [subcontractors, search, tradeFilter])

  function resetForm() {
    setFormData({
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      trade: "",
      notes: "",
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.company_name.trim()) {
      toast.error("Company name is required.")
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in to add a subcontractor.")
        return
      }

      const { error } = await supabase.from("subcontractors").insert({
        user_id: user.id,
        company_name: formData.company_name.trim(),
        contact_name: formData.contact_name.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        trade: formData.trade || null,
        notes: formData.notes.trim() || null,
      })

      if (error) {
        toast.error("Failed to add subcontractor. Please try again.")
        return
      }

      toast.success("Subcontractor added successfully.")
      resetForm()
      setDialogOpen(false)
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Subcontractors</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Subcontractor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add Subcontractor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  placeholder="Enter company name"
                  value={formData.company_name}
                  onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  placeholder="Enter contact name"
                  value={formData.contact_name}
                  onChange={e => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade">Trade</Label>
                <Select
                  value={formData.trade}
                  onValueChange={value => setFormData(prev => ({ ...prev, trade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trade" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADES.map(trade => (
                      <SelectItem key={trade} value={trade}>
                        {trade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? "Adding..." : "Add Subcontractor"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative sm:max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subcontractors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tradeFilter} onValueChange={setTradeFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="All Trades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            {TRADES.map(trade => (
              <SelectItem key={trade} value={trade}>
                {trade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcontractor Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              {subcontractors.length === 0
                ? "No subcontractors yet. Click \"Add Subcontractor\" to get started."
                : "No subcontractors match your search or filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(sub => {
            const compliance = getComplianceStatus(sub.documents)
            const badgeColor = getComplianceBadgeColor(compliance)
            const badgeLabel = getComplianceLabel(compliance)

            return (
              <Link key={sub.id} href={`/subcontractors/${sub.id}`}>
                <Card className="hover:shadow-md hover:border-blue-200 transition-all cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold leading-tight">
                        {sub.company_name}
                      </CardTitle>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${badgeColor}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>
                    {sub.trade && (
                      <p className="text-sm text-muted-foreground">{sub.trade}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {sub.contact_name && (
                      <p className="text-sm text-foreground">{sub.contact_name}</p>
                    )}
                    {sub.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{sub.email}</span>
                      </div>
                    )}
                    {sub.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{sub.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {sub.documents.length} {sub.documents.length === 1 ? "document" : "documents"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
