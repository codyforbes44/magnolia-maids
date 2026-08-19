import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
      { auth: { persistSession: false } },
    );
  }
  return _supabase;
}

function iso(seconds: number | null | undefined) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("[payments] subscription without userId metadata", subscription.id);
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product ?? null;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: typeof productId === "string" ? productId : (productId?.id ?? null),
        price_id: priceId ?? null,
        plan_label: subscription.metadata?.planName ?? null,
        status: subscription.status,
        current_period_start: iso(periodStart),
        current_period_end: iso(periodEnd),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
}

async function markSubscriptionCanceled(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function markInvoicePaid(session: any, env: StripeEnv) {
  const linkId = session.metadata?.paymentLinkId;
  if (!linkId) return;
  await getSupabase()
    .from("payment_links")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
      environment: env,
      updated_at: new Date().toISOString(),
    })
    .eq("id", linkId);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await markSubscriptionCanceled(event.data.object, env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      // Delayed methods (SEPA, boleto) stay "unpaid" until settlement.
      if (session.payment_status !== "unpaid") await markInvoicePaid(session, env);
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await markInvoicePaid(event.data.object, env);
      break;
    case "checkout.session.async_payment_failed": {
      const linkId = event.data.object.metadata?.paymentLinkId;
      if (linkId) {
        await getSupabase()
          .from("payment_links")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", linkId);
      }
      break;
    }
    default:
      console.log("[payments] unhandled event", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[payments] webhook with invalid env", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[payments] webhook error", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});