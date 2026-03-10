import { stripe } from "@/lib/stripe"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      // In development without webhook secret, parse the event directly
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown"}` }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (userId) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_status: "active",
          })
          .eq("id", userId)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (profile) {
        let status = "active"
        if (subscription.status === "past_due") status = "past_due"
        if (subscription.status === "canceled") status = "canceled"
        if (subscription.status === "unpaid") status = "canceled"

        await supabase
          .from("profiles")
          .update({
            subscription_status: status,
            stripe_subscription_id: subscription.id,
          })
          .eq("id", profile.id)
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from("profiles")
        .update({ subscription_status: "canceled" })
        .eq("stripe_customer_id", customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
