// Supabase Edge Function: check-expirations
// Runs daily via cron to check document expirations and send alerts
// Deploy with: supabase functions deploy check-expirations
// Schedule with SQL: select cron.schedule('check-expirations', '0 8 * * *', $$select net.http_post(url:='<FUNCTION_URL>', headers:='{"Authorization": "Bearer <ANON_KEY>"}'); $$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface AlertCheck {
  type: "60_day" | "30_day" | "7_day" | "expired"
  days: number
}

const ALERT_THRESHOLDS: AlertCheck[] = [
  { type: "60_day", days: 60 },
  { type: "30_day", days: 30 },
  { type: "7_day", days: 7 },
  { type: "expired", days: 0 },
]

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[SKIP EMAIL] No RESEND_API_KEY. Would send to ${to}: ${subject}`)
    return
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CertBoard <notifications@certboard.app>",
        to: [to],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      console.error(`Failed to send email to ${to}:`, await res.text())
    }
  } catch (err) {
    console.error(`Error sending email to ${to}:`, err)
  }
}

Deno.serve(async (_req) => {
  try {
    // Fetch all documents with expiration dates, plus related sub and profile info
    const { data: documents, error } = await supabase
      .from("documents")
      .select(`
        id,
        document_type,
        expiration_date,
        status,
        subcontractor_id,
        user_id,
        subcontractors!inner(company_name, email, upload_token),
        profiles!inner(email, company_name)
      `)
      .not("expiration_date", "is", null)

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    const now = new Date()
    let alertsSent = 0
    let statusesUpdated = 0

    for (const doc of documents || []) {
      const expDate = new Date(doc.expiration_date!)
      const diffMs = expDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      // Update document status
      let newStatus = "current"
      if (diffDays < 0) newStatus = "expired"
      else if (diffDays <= 30) newStatus = "expiring_soon"

      if (doc.status !== newStatus && doc.status !== "pending_review") {
        await supabase
          .from("documents")
          .update({ status: newStatus })
          .eq("id", doc.id)
        statusesUpdated++
      }

      // Check alert thresholds
      for (const threshold of ALERT_THRESHOLDS) {
        let shouldAlert = false

        if (threshold.type === "expired" && diffDays <= 0) {
          shouldAlert = true
        } else if (threshold.type === "7_day" && diffDays > 0 && diffDays <= 7) {
          shouldAlert = true
        } else if (threshold.type === "30_day" && diffDays > 7 && diffDays <= 30) {
          shouldAlert = true
        } else if (threshold.type === "60_day" && diffDays > 30 && diffDays <= 60) {
          shouldAlert = true
        }

        if (!shouldAlert) continue

        // Check if this alert was already sent
        const { data: existingAlert } = await supabase
          .from("alert_log")
          .select("id")
          .eq("document_id", doc.id)
          .eq("alert_type", threshold.type)
          .single()

        if (existingAlert) continue

        const sub = (doc as any).subcontractors
        const profile = (doc as any).profiles
        const daysText = threshold.type === "expired"
          ? "has expired"
          : `expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}`
        const appUrl = Deno.env.get("APP_URL") || "https://certboard.app"

        // Send email to GC
        if (profile?.email) {
          const subject = `[CertBoard] ${sub.company_name}'s ${doc.document_type} ${daysText}`
          const html = `
            <div style="font-family: sans-serif; max-width: 600px;">
              <h2 style="color: #1e40af;">CertBoard Alert</h2>
              <p><strong>${sub.company_name}</strong>'s <strong>${doc.document_type}</strong> ${daysText}.</p>
              <p><strong>Expiration date:</strong> ${expDate.toLocaleDateString()}</p>
              <p><a href="${appUrl}/dashboard" style="color: #1e40af;">View in CertBoard →</a></p>
            </div>
          `
          await sendEmail(profile.email, subject, html)
        }

        // Send email to subcontractor
        if (sub?.email) {
          const portalUrl = `${appUrl}/portal/${sub.upload_token}`
          const subject = `[CertBoard] Your ${doc.document_type} for ${profile.company_name} ${daysText}`
          const html = `
            <div style="font-family: sans-serif; max-width: 600px;">
              <h2 style="color: #1e40af;">CertBoard Alert</h2>
              <p>Your <strong>${doc.document_type}</strong> on file with <strong>${profile.company_name}</strong> ${daysText}.</p>
              <p><strong>Expiration date:</strong> ${expDate.toLocaleDateString()}</p>
              <p>Please upload an updated document:</p>
              <p><a href="${portalUrl}" style="color: #1e40af;">Upload Updated Document →</a></p>
            </div>
          `
          await sendEmail(sub.email, subject, html)
        }

        // Log the alert
        await supabase.from("alert_log").insert({
          document_id: doc.id,
          alert_type: threshold.type,
        })
        alertsSent++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        documents_checked: documents?.length || 0,
        alerts_sent: alertsSent,
        statuses_updated: statusesUpdated,
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
