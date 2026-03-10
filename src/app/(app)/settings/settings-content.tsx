"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import { CreditCard, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/database"

interface SettingsContentProps {
  profile: Profile
}

export function SettingsContent({ profile }: SettingsContentProps) {
  const router = useRouter()
  const supabase = createClient()
  const [companyName, setCompanyName] = useState(profile.company_name)
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleSaveProfile = async () => {
    if (!companyName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .update({ company_name: companyName.trim() })
      .eq("id", profile.id)

    if (error) {
      toast.error("Failed to update profile")
    } else {
      toast.success("Profile updated")
      router.refresh()
    }
    setSaving(false)
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || "Failed to open billing portal")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setPortalLoading(false)
    }
  }

  const isTrialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()
  const isSubscribed = profile.subscription_status === "active"

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Account */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile.email} disabled />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving || !companyName.trim()}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium">
                {isSubscribed
                  ? "Active Subscription"
                  : isTrialActive
                    ? "Free Trial"
                    : profile.subscription_status === "canceled"
                      ? "Canceled"
                      : "Inactive"}
              </span>
            </div>

            {isTrialActive && profile.trial_ends_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trial ends</span>
                <span className="text-sm font-medium">
                  {format(new Date(profile.trial_ends_at), "MMM d, yyyy")}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="text-sm font-medium">$49/month</span>
            </div>

            <Separator />

            {profile.stripe_customer_id ? (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={portalLoading}
              >
                {portalLoading ? "Opening..." : "Manage Billing"}
              </Button>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  {isTrialActive
                    ? "Subscribe before your trial ends to keep access."
                    : "Subscribe to access CertBoard."}
                </p>
                <Button onClick={async () => {
                  const res = await fetch("/api/stripe/checkout", { method: "POST" })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                }}>
                  Subscribe — $49/month
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
