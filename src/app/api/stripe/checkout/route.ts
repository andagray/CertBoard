import { createServerSupabaseClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, company_name")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.company_name,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?checkout=canceled`,
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create checkout session" }, { status: 500 })
  }
}
