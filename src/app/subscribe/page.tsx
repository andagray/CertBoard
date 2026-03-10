"use client"

import { useState } from "react"
import { Shield, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  "Unlimited subcontractors",
  "Automated expiration alerts",
  "Self-service upload portal",
  "Insurance, license & W-9 tracking",
  "Secure document storage",
  "Compliance dashboard",
]

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Failed to start checkout")
      }
    } catch {
      alert("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl">CertBoard</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">Your trial has expired</h1>
          <p className="text-muted-foreground">
            Subscribe to continue tracking your subcontractor compliance.
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>
              <span className="text-4xl font-bold">$49</span>
              <span className="text-muted-foreground text-base font-normal">/month</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {features.map(feature => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "Redirecting to checkout..." : "Subscribe Now"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
