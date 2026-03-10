"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import {
  getComplianceStatus,
  getComplianceBadgeColor,
  getComplianceLabel,
  getNextExpiringDate,
} from "@/lib/compliance"
import type { Subcontractor, Document } from "@/types/database"
import { TRADES } from "@/types/database"
import { format } from "date-fns"

type SubWithDocs = Subcontractor & { documents: Document[] }

interface DashboardContentProps {
  subcontractors: SubWithDocs[]
}

export function DashboardContent({ subcontractors }: DashboardContentProps) {
  const [search, setSearch] = useState("")
  const [tradeFilter, setTradeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const subsWithStatus = useMemo(() =>
    subcontractors.map(sub => ({
      ...sub,
      compliance: getComplianceStatus(sub.documents),
      nextExpiry: getNextExpiringDate(sub.documents),
    })),
    [subcontractors]
  )

  const stats = useMemo(() => {
    const total = subsWithStatus.length
    const compliant = subsWithStatus.filter(s => s.compliance === "compliant").length
    const expiring = subsWithStatus.filter(s => s.compliance === "expiring").length
    const expired = subsWithStatus.filter(s => s.compliance === "expired").length
    return { total, compliant, expiring, expired }
  }, [subsWithStatus])

  const filtered = useMemo(() => {
    return subsWithStatus.filter(sub => {
      if (search && !sub.company_name.toLowerCase().includes(search.toLowerCase())) return false
      if (tradeFilter !== "all" && sub.trade !== tradeFilter) return false
      if (statusFilter === "compliant" && sub.compliance !== "compliant") return false
      if (statusFilter === "expiring" && sub.compliance !== "expiring") return false
      if (statusFilter === "expired" && sub.compliance !== "expired") return false
      return true
    })
  }, [subsWithStatus, search, tradeFilter, statusFilter])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Compliance Dashboard</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Subs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.compliant}</p>
                <p className="text-sm text-muted-foreground">Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expiring}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expired}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search by company name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={tradeFilter} onValueChange={setTradeFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="All Trades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            {TRADES.map(trade => (
              <SelectItem key={trade} value={trade}>{trade}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subcontractor List */}
      <Card>
        <CardHeader>
          <CardTitle>Subcontractors</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {subcontractors.length === 0
                ? "No subcontractors yet. Add your first subcontractor to get started."
                : "No subcontractors match your filters."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Company</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground hidden sm:table-cell">Trade</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground hidden md:table-cell">Documents</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground hidden md:table-cell">Next Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => (
                    <tr key={sub.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="py-3">
                        <Link href={`/subcontractors/${sub.id}`} className="font-medium text-primary hover:underline">
                          {sub.company_name}
                        </Link>
                      </td>
                      <td className="py-3 hidden sm:table-cell text-sm text-muted-foreground">
                        {sub.trade || "—"}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getComplianceBadgeColor(sub.compliance)}`}>
                          {getComplianceLabel(sub.compliance)}
                        </span>
                      </td>
                      <td className="py-3 hidden md:table-cell text-sm text-muted-foreground">
                        {sub.documents.length}
                      </td>
                      <td className="py-3 hidden md:table-cell text-sm text-muted-foreground">
                        {sub.nextExpiry ? format(new Date(sub.nextExpiry), "MMM d, yyyy") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
