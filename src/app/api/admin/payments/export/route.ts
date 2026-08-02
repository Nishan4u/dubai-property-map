import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { logAudit } from "@/lib/auditLog";

// Admin-only CSV export of every subscription payment across all four
// account types (developer/broker/salesperson/broker_agency) and all three
// payment paths (Stripe, bank transfer, wallet), with a VAT breakdown per
// row for filing purposes. VAT here is treated as already included in the
// price charged (this platform doesn't collect it as a separate line item
// from subscribers) -- so each row's "VAT (AED)" and "Net (AED)" are backed
// out of the gross amount using the plan's vat_percent at the time of
// export, not added on top of it.
type ExportRow = {
  date: string;
  accountType: string;
  accountName: string;
  paymentMethod: "stripe" | "bank_transfer" | "wallet";
  plan: string;
  gross: number;
  vat: number;
  net: number;
};

function vatBreakdown(gross: number, vatPercent: number | null | undefined) {
  const vp = Number(vatPercent ?? 0);
  if (!vp) return { vat: 0, net: gross };
  const net = gross / (1 + vp / 100);
  return { vat: gross - net, net };
}

function csvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from"); // yyyy-mm-dd
  const to = searchParams.get("to");
  const fromDate = from ? new Date(`${from}T00:00:00Z`) : null;
  const toDate = to ? new Date(`${to}T23:59:59Z`) : null;

  const admin = createAdminClient();
  const rows: ExportRow[] = [];

  // ---------- Lookups shared across all three payment sources ----------
  const [{ data: plans }, { data: brokers }, { data: salespersons }, { data: developers }, { data: brokerages }] = await Promise.all([
    admin.from("subscription_plans").select("key, plan_type, price_aed, vat_percent, stripe_price_id, promo_stripe_price_id"),
    admin.from("brokers").select("id, full_name, stripe_customer_id"),
    admin.from("salespersons").select("id, full_name, stripe_customer_id"),
    admin.from("developers").select("id, name, stripe_customer_id"),
    admin.from("brokerages").select("id, name, stripe_customer_id"),
  ]);

  type PlanRow = NonNullable<typeof plans>[number];
  const planByKey = new Map((plans ?? []).map((p) => [p.key, p]));
  const planByStripePriceId = new Map<string, PlanRow>();
  for (const p of plans ?? []) {
    if (p.stripe_price_id) planByStripePriceId.set(p.stripe_price_id, p);
    if (p.promo_stripe_price_id) planByStripePriceId.set(p.promo_stripe_price_id, p);
  }

  const accountByCustomerId = new Map<string, { type: string; name: string }>();
  for (const b of brokers ?? []) if (b.stripe_customer_id) accountByCustomerId.set(b.stripe_customer_id, { type: "broker", name: b.full_name });
  for (const s of salespersons ?? []) if (s.stripe_customer_id) accountByCustomerId.set(s.stripe_customer_id, { type: "salesperson", name: s.full_name });
  for (const d of developers ?? []) if (d.stripe_customer_id) accountByCustomerId.set(d.stripe_customer_id, { type: "developer", name: d.name });
  for (const a of brokerages ?? []) if (a.stripe_customer_id) accountByCustomerId.set(a.stripe_customer_id, { type: "broker_agency", name: a.name });

  const brokerById = new Map((brokers ?? []).map((b) => [b.id, b.full_name]));
  const salespersonById = new Map((salespersons ?? []).map((s) => [s.id, s.full_name]));
  const developerById = new Map((developers ?? []).map((d) => [d.id, d.name]));
  const brokerageById = new Map((brokerages ?? []).map((a) => [a.id, a.name]));

  // ---------- 1. Stripe invoices (paid) ----------
  try {
    const stripe = getStripe();
    const created: { gte?: number; lte?: number } = {};
    if (fromDate) created.gte = Math.floor(fromDate.getTime() / 1000);
    if (toDate) created.lte = Math.floor(toDate.getTime() / 1000);

    let startingAfter: string | undefined;
    let pages = 0;
    do {
      const page = await stripe.invoices.list({
        status: "paid",
        limit: 100,
        starting_after: startingAfter,
        created: Object.keys(created).length ? created : undefined,
      });
      for (const inv of page.data) {
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        const account = customerId ? accountByCustomerId.get(customerId) : undefined;
        const priceRef = inv.lines.data[0]?.pricing?.price_details?.price;
        const priceId = typeof priceRef === "string" ? priceRef : priceRef?.id;
        const plan = priceId ? planByStripePriceId.get(priceId) : undefined;
        const gross = (inv.total ?? 0) / 100;
        const { vat, net } = vatBreakdown(gross, plan?.vat_percent);
        rows.push({
          date: new Date(inv.created * 1000).toISOString().slice(0, 10),
          accountType: account?.type ?? "unknown",
          accountName: account?.name ?? "(unmatched Stripe customer)",
          paymentMethod: "stripe",
          plan: plan?.key ?? "",
          gross,
          vat,
          net,
        });
      }
      startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined;
      pages += 1;
      // Safety cap -- an admin re-running this for a huge date range
      // shouldn't be able to make the request hang indefinitely.
    } while (startingAfter && pages < 20);
  } catch {
    // STRIPE_SECRET_KEY not configured, or Stripe unreachable -- the export
    // still proceeds with bank transfer + wallet rows rather than failing
    // the whole request.
  }

  // ---------- 2. Bank transfers (approved) ----------
  let bankTransferQuery = admin
    .from("subscription_bank_transfers")
    .select("account_type, broker_id, salesperson_id, developer_id, brokerage_id, plan_key, amount_aed, reviewed_at, created_at")
    .eq("status", "paid");
  if (fromDate) bankTransferQuery = bankTransferQuery.gte("reviewed_at", fromDate.toISOString());
  if (toDate) bankTransferQuery = bankTransferQuery.lte("reviewed_at", toDate.toISOString());
  const { data: bankTransfers } = await bankTransferQuery;

  for (const bt of bankTransfers ?? []) {
    const plan = planByKey.get(bt.plan_key);
    const gross = Number(bt.amount_aed);
    const { vat, net } = vatBreakdown(gross, plan?.vat_percent);
    const accountName =
      bt.account_type === "broker"
        ? brokerById.get(bt.broker_id ?? "")
        : bt.account_type === "salesperson"
          ? salespersonById.get(bt.salesperson_id ?? "")
          : bt.account_type === "developer"
            ? developerById.get(bt.developer_id ?? "")
            : brokerageById.get(bt.brokerage_id ?? "");
    rows.push({
      date: (bt.reviewed_at ?? bt.created_at).slice(0, 10),
      accountType: bt.account_type,
      accountName: accountName ?? "(unknown account)",
      paymentMethod: "bank_transfer",
      plan: bt.plan_key,
      gross,
      vat,
      net,
    });
  }

  // ---------- 3. Wallet payments (renewal / new subscription) ----------
  let walletTxQuery = admin
    .from("broker_referral_wallet_transactions")
    .select("wallet_id, plan_key, amount_aed, created_at, broker_referral_wallets(account_type, broker_id, salesperson_id)")
    .in("type", ["used_for_renewal", "used_for_new_subscription"]);
  if (fromDate) walletTxQuery = walletTxQuery.gte("created_at", fromDate.toISOString());
  if (toDate) walletTxQuery = walletTxQuery.lte("created_at", toDate.toISOString());
  const { data: walletTx } = await walletTxQuery;

  for (const tx of walletTx ?? []) {
    const wallet = Array.isArray(tx.broker_referral_wallets) ? tx.broker_referral_wallets[0] : tx.broker_referral_wallets;
    const plan = tx.plan_key ? planByKey.get(tx.plan_key) : undefined;
    const gross = Number(tx.amount_aed);
    const { vat, net } = vatBreakdown(gross, plan?.vat_percent);
    const accountName =
      wallet?.account_type === "broker" ? brokerById.get(wallet.broker_id ?? "") : salespersonById.get(wallet?.salesperson_id ?? "");
    rows.push({
      date: tx.created_at.slice(0, 10),
      accountType: wallet?.account_type ?? "unknown",
      accountName: accountName ?? "(unknown account)",
      paymentMethod: "wallet",
      plan: tx.plan_key ?? "",
      gross,
      vat,
      net,
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  const header = "Date,Account Type,Account Name,Payment Method,Plan,Gross (AED),VAT (AED),Net (AED)";
  const body = rows
    .map((r) =>
      [r.date, r.accountType, csvField(r.accountName), r.paymentMethod, r.plan, r.gross.toFixed(2), r.vat.toFixed(2), r.net.toFixed(2)].join(",")
    )
    .join("\n");
  const csv = `${header}\n${body}\n`;

  await logAudit("payments.exported", "payments", null, { from, to, rowCount: rows.length }, { client: admin, actorId: user.id, actorEmail: user.email });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payments-export${from ? `-${from}` : ""}${to ? `-to-${to}` : ""}.csv"`,
    },
  });
}
