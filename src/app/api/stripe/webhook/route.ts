import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { attributeReferral, recordCommission } from "@/lib/referrals";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const developerId = session.metadata?.developer_id;

      if (session.metadata?.kind === "ad_placement" && developerId) {
        const today = new Date();
        const endsAt = new Date(today);
        endsAt.setDate(endsAt.getDate() + 15);

        await supabase.from("ad_placements").insert({
          developer_id: developerId,
          title: session.metadata.title,
          placement_type: session.metadata.placement_type,
          target_url: session.metadata.target_url || null,
          project_id: session.metadata.project_id || null,
          community_id: session.metadata.community_id || null,
          status: "pending",
          starts_at: today.toISOString().slice(0, 10),
          ends_at: endsAt.toISOString().slice(0, 10),
        });
        break;
      }

      if (session.metadata?.kind === "broker_subscription") {
        const brokerId = session.metadata.broker_id;
        const plan = session.metadata.plan;
        if (!brokerId) break;

        let expiresAt: string | null = null;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          expiresAt = new Date(subscription.items.data[0].current_period_end * 1000)
            .toISOString()
            .slice(0, 10);
        }

        await supabase
          .from("brokers")
          .update({
            plan_key: plan ?? "broker-monthly",
            subscription_status: "active",
            subscription_expires_at: expiresAt,
            last_reminder_sent_days: null,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            payment_type: "stripe",
          })
          .eq("id", brokerId);

        await attributeReferral(session.metadata?.referral_code, "broker", brokerId);
        if (session.amount_total) {
          await recordCommission({
            accountType: "broker",
            accountId: brokerId,
            paymentId: (session.invoice as string) || session.id,
            paymentSource: "stripe",
            subscriptionAmount: session.amount_total / 100,
          });
        }

        const { data: broker } = await supabase.from("brokers").select("full_name, email").eq("id", brokerId).single();
        if (broker?.email) {
          await sendEmail({
            category: "subscription_activated",
            to: broker.email,
            subject: "Your Dubai Property Map subscription is active",
            html: `<p>Hi ${broker.full_name},</p><p>Your <strong>${plan ?? "broker-monthly"}</strong> subscription is now active${expiresAt ? ` and renews on ${expiresAt}` : ""}.</p>`,
          });
        }
        break;
      }

      if (session.metadata?.kind === "salesperson_subscription") {
        const salespersonId = session.metadata.salesperson_id;
        const plan = session.metadata.plan;
        if (!salespersonId) break;

        let expiresAt: string | null = null;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          expiresAt = new Date(subscription.items.data[0].current_period_end * 1000)
            .toISOString()
            .slice(0, 10);
        }

        await supabase
          .from("salespersons")
          .update({
            plan_key: plan ?? "salesperson-monthly",
            subscription_status: "active",
            subscription_expires_at: expiresAt,
            last_reminder_sent_days: null,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            payment_type: "stripe",
          })
          .eq("id", salespersonId);

        await attributeReferral(session.metadata?.referral_code, "salesperson", salespersonId);
        if (session.amount_total) {
          await recordCommission({
            accountType: "salesperson",
            accountId: salespersonId,
            paymentId: (session.invoice as string) || session.id,
            paymentSource: "stripe",
            subscriptionAmount: session.amount_total / 100,
          });
        }

        const { data: salesperson } = await supabase.from("salespersons").select("full_name, email").eq("id", salespersonId).single();
        if (salesperson?.email) {
          await sendEmail({
            category: "subscription_activated",
            to: salesperson.email,
            subject: "Your Dubai Property Map subscription is active",
            html: `<p>Hi ${salesperson.full_name},</p><p>Your <strong>${plan ?? "salesperson-monthly"}</strong> subscription is now active${expiresAt ? ` and renews on ${expiresAt}` : ""}.</p>`,
          });
        }
        break;
      }

      const plan = session.metadata?.plan;
      if (developerId) {
        let expiresAt: string | null = null;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          expiresAt = new Date(subscription.items.data[0].current_period_end * 1000)
            .toISOString()
            .slice(0, 10);
        }

        await supabase
          .from("developers")
          .update({
            plan_tier: plan ?? "starter",
            subscription_status: "active",
            subscription_expires_at: expiresAt,
            last_reminder_sent_days: null,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            payment_type: "stripe",
          })
          .eq("id", developerId);

        await attributeReferral(session.metadata?.referral_code, "developer", developerId);
        if (session.amount_total) {
          await recordCommission({
            accountType: "developer",
            accountId: developerId,
            paymentId: (session.invoice as string) || session.id,
            paymentSource: "stripe",
            subscriptionAmount: session.amount_total / 100,
          });
        }

        const { data: developer } = await supabase.from("developers").select("name, email").eq("id", developerId).single();
        if (developer?.email) {
          await sendEmail({
            category: "subscription_activated",
            to: developer.email,
            subject: "Your Dubai Property Map subscription is active",
            html: `<p>Hi ${developer.name},</p><p>Your <strong>${plan ?? "starter"}</strong> subscription is now active.</p>`,
          });
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const expiresAt = new Date(subscription.items.data[0].current_period_end * 1000)
        .toISOString()
        .slice(0, 10);

      const developerStatus = mapStripeStatusToDeveloperStatus(subscription.status);
      await supabase
        .from("developers")
        .update({ subscription_status: developerStatus, subscription_expires_at: expiresAt })
        .eq("stripe_subscription_id", subscription.id);

      const brokerStatus = mapStripeStatusToBrokerStatus(subscription.status);
      await supabase
        .from("brokers")
        .update({ subscription_status: brokerStatus, subscription_expires_at: expiresAt })
        .eq("stripe_subscription_id", subscription.id);
      await supabase
        .from("salespersons")
        .update({ subscription_status: brokerStatus, subscription_expires_at: expiresAt })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (!subscriptionId) break;

      // Only the recurring-cycle invoice counts as a "renewal" — the very
      // first invoice on a new subscription already gets the Activation
      // email from checkout.session.completed, so skip it here to avoid
      // sending both for the same payment.
      const isRenewal = invoice.billing_reason === "subscription_cycle";

      const { data: broker } = await supabase
        .from("brokers")
        .select("id, full_name, email")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();
      if (broker) {
        await supabase.from("broker_payments").insert({
          broker_id: broker.id,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: "paid",
          paid_at: new Date().toISOString(),
        });
        if (isRenewal) {
          await recordCommission({
            accountType: "broker",
            accountId: broker.id,
            paymentId: invoice.id ?? `${subscriptionId}-${invoice.created}`,
            paymentSource: "stripe",
            subscriptionAmount: invoice.amount_paid / 100,
          });
          if (broker.email) {
            await sendEmail({
              category: "subscription_renewed",
              to: broker.email,
              subject: "Your Dubai Property Map subscription has renewed",
              html: `<p>Hi ${broker.full_name},</p><p>Your subscription has renewed successfully. Amount charged: ${invoice.currency.toUpperCase()} ${(invoice.amount_paid / 100).toFixed(2)}.</p>`,
            });
          }
        }
        break;
      }

      const { data: salesperson } = await supabase
        .from("salespersons")
        .select("id, full_name, email")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();
      if (salesperson) {
        if (isRenewal) {
          await recordCommission({
            accountType: "salesperson",
            accountId: salesperson.id,
            paymentId: invoice.id ?? `${subscriptionId}-${invoice.created}`,
            paymentSource: "stripe",
            subscriptionAmount: invoice.amount_paid / 100,
          });
          if (salesperson.email) {
            await sendEmail({
              category: "subscription_renewed",
              to: salesperson.email,
              subject: "Your Dubai Property Map subscription has renewed",
              html: `<p>Hi ${salesperson.full_name},</p><p>Your subscription has renewed successfully. Amount charged: ${invoice.currency.toUpperCase()} ${(invoice.amount_paid / 100).toFixed(2)}.</p>`,
            });
          }
        }
        break;
      }

      if (isRenewal) {
        const { data: developer } = await supabase
          .from("developers")
          .select("id, name, email")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();
        if (developer) {
          await recordCommission({
            accountType: "developer",
            accountId: developer.id,
            paymentId: invoice.id ?? `${subscriptionId}-${invoice.created}`,
            paymentSource: "stripe",
            subscriptionAmount: invoice.amount_paid / 100,
          });
          if (developer.email) {
            await sendEmail({
              category: "subscription_renewed",
              to: developer.email,
              subject: "Your Dubai Property Map subscription has renewed",
              html: `<p>Hi ${developer.name},</p><p>Your subscription has renewed successfully. Amount charged: ${invoice.currency.toUpperCase()} ${(invoice.amount_paid / 100).toFixed(2)}.</p>`,
            });
          }
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (!subscriptionId) break;

      const { data: broker } = await supabase
        .from("brokers")
        .select("id, full_name, email")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();
      if (broker) {
        await supabase.from("brokers").update({ subscription_status: "payment_failed" }).eq("id", broker.id);
        await supabase.from("broker_payments").insert({
          broker_id: broker.id,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          status: "failed",
        });
        if (broker.email) {
          await sendEmail({
            category: "payment_failed",
            to: broker.email,
            subject: "Payment failed for your Dubai Property Map subscription",
            html: `<p>Hi ${broker.full_name},</p><p>We couldn't process your latest payment. Please update your payment method to keep your subscription active.</p>`,
          });
        }
        break;
      }

      const { data: salesperson } = await supabase
        .from("salespersons")
        .select("id, full_name, email")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();
      if (salesperson) {
        await supabase.from("salespersons").update({ subscription_status: "payment_failed" }).eq("id", salesperson.id);
        if (salesperson.email) {
          await sendEmail({
            category: "payment_failed",
            to: salesperson.email,
            subject: "Payment failed for your Dubai Property Map subscription",
            html: `<p>Hi ${salesperson.full_name},</p><p>We couldn't process your latest payment. Please update your payment method to keep your subscription active.</p>`,
          });
        }
        break;
      }

      const { data: developer } = await supabase
        .from("developers")
        .select("id, name, email")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();
      if (developer) {
        await supabase.from("developers").update({ subscription_status: "past_due" }).eq("id", developer.id);
        if (developer.email) {
          await sendEmail({
            category: "payment_failed",
            to: developer.email,
            subject: "Payment failed for your Dubai Property Map subscription",
            html: `<p>Hi ${developer.name},</p><p>We couldn't process your latest payment. Please update your payment method to keep your subscription active.</p>`,
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatusToDeveloperStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    default:
      return "inactive";
  }
}

function mapStripeStatusToBrokerStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "payment_failed";
    case "canceled":
    case "unpaid":
      return "cancelled";
    default:
      return "payment_pending";
  }
}

// Stripe's Invoice type exposes the parent subscription id under different
// shapes across API versions — this SDK's typings model it via `parent`.
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  if (parent?.type === "subscription_details" && parent.subscription_details?.subscription) {
    const sub = parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  return null;
}
