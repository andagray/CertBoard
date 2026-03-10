import Link from "next/link"
import {
  Shield,
  Bell,
  Upload,
  FileCheck,
  ArrowRight,
  CheckCircle,
  LayoutDashboard,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="size-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CertBoard</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="lg" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Stop Chasing Subcontractors
            <br />
            for Expired Certs.
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            CertBoard tracks insurance, licenses, and W-9s for all your subs
            &mdash; and alerts everyone before anything lapses.
          </p>
          <div className="mt-10">
            <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base gap-2">
              <Link href="/signup">
                Start Free 14-Day Trial
                <ArrowRight className="size-5" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required. Set up in under 5 minutes.
          </p>
        </div>
      </section>

      {/* Benefit Blocks */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Everything you need to stay compliant
          </h2>
          <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">
            Replace spreadsheets, emails, and follow-up calls with one simple platform.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {/* Benefit 1 */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-100">
                <LayoutDashboard className="size-7 text-blue-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                One Dashboard for All Sub Compliance
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                See every subcontractor&apos;s insurance, licenses, and W-9
                status at a glance. Know instantly who&apos;s compliant and
                who needs attention.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-100">
                <Bell className="size-7 text-blue-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Automated Alerts at 60 / 30 / 7 Days
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Email reminders go out automatically before documents expire.
                No more manually tracking dates or chasing down renewals.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-100">
                <Upload className="size-7 text-blue-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Self-Service Portal for Subs
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Subcontractors upload their own documents through a simple
                portal. You review and approve &mdash; no back-and-forth emails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            How it works
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Get up and running in three simple steps.
          </p>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-600 text-white">
                <UserPlus className="size-8" />
              </div>
              <div className="mt-2 text-sm font-semibold text-blue-600">Step 1</div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                Add Your Subs
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Enter subcontractor details and invite them to the platform.
                They&apos;ll get a link to their own portal.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-600 text-white">
                <FileCheck className="size-8" />
              </div>
              <div className="mt-2 text-sm font-semibold text-blue-600">Step 2</div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                Upload Documents
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Subs upload insurance certificates, licenses, and W-9s.
                You can also upload on their behalf.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-600 text-white">
                <Bell className="size-8" />
              </div>
              <div className="mt-2 text-sm font-semibold text-blue-600">Step 3</div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                Get Alerts
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                CertBoard monitors expiration dates and sends automated
                reminders so nothing slips through the cracks.
              </p>
            </div>
          </div>

          {/* Connecting arrows between steps (visible on sm+) */}
          <div className="hidden sm:flex justify-center items-center gap-4 -mt-[11.5rem]">
            <div className="w-1/3" />
            <ArrowRight className="size-6 text-blue-300" />
            <div className="w-1/3" />
            <ArrowRight className="size-6 text-blue-300" />
            <div className="w-1/3" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-gray-600">
            One plan. Everything included. No hidden fees.
          </p>

          <div className="mt-12 rounded-2xl border-2 border-blue-200 bg-white p-10 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Pro Plan
            </div>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-gray-900">$49</span>
              <span className="text-lg text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">per company</p>

            <ul className="mt-8 space-y-4 text-left">
              {[
                "Unlimited subcontractors",
                "Automated 60/30/7-day email alerts",
                "Self-service sub upload portal",
                "Insurance, license & W-9 tracking",
                "Document storage & history",
                "Compliance dashboard & reports",
                "Email support",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-blue-600" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Button size="lg" asChild className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base">
                <Link href="/signup">Start Free 14-Day Trial</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-600 py-16 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to stop chasing paperwork?
          </h2>
          <p className="mt-4 text-blue-100">
            Join contractors who trust CertBoard to keep their subs compliant.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              asChild
              className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8 text-base gap-2"
            >
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-blue-600" />
              <span className="font-semibold text-gray-900">CertBoard</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <Link href="/login" className="hover:text-gray-900">
                Login
              </Link>
              <Link href="/signup" className="hover:text-gray-900">
                Sign Up
              </Link>
              <Link href="/pricing" className="hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/privacy" className="hover:text-gray-900">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-gray-900">
                Terms of Service
              </Link>
            </nav>
          </div>
          <div className="mt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} CertBoard. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
