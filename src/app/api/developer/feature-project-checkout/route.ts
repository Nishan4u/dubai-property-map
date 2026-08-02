import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const FEATURE_PRICE_AED = 50;
const FEATURE_DAYS = 15;

// Deliberately separate from /api/stripe/ad-checkout -- that route also
// enforces per-plan feature-limit gates (max_featured_pins,
// homepage_banner_allowed) since ad_placements is a plan perk. Featuring
// your own already-live project isn't a plan perk here: developers get
// free/unlimited listing (the Global Free Access "Developer" toggle,
// patch_88) and pay a flat AED 50 per 15-day boost regardless of plan, so
// this route never checks subscription_status or plan_tier at all.
export async function POST(request: NextRequest) {
  const { projectId } = (await request.json()) as { projectId?: string };
  if (!projectId) {
    return NextResponse.json({ error: "No project specified." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("developer_id").eq("id", user.id).single();
  if (!profile?.developer_id) {
    return NextResponse.json({ error: "No developer account found." }, { status: 403 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, developer_id, status")
    .eq("id", projectId)
    .single();
  if (!project || project.developer_id !== profile.developer_id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  if (!["published", "featured"].includes(project.status)) {
    return NextResponse.json({ error: "Only a live (published) project can be featured." }, { status: 400 });
  }

  const { data: developer } = await supabase
    .from("developers")
    .select("stripe_customer_id")
    .eq("id", profile.developer_id)
    .single();

  try {
    const stripe = getStripe();
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "aed",
            unit_amount: FEATURE_PRICE_AED * 100,
            product_data: {
              name: `Feature Project — ${project.name}`,
              description: `${FEATURE_DAYS}-day featured placement on the homepage`,
            },
          },
          quantity: 1,
        },
      ],
      customer: developer?.stripe_customer_id ?? undefined,
      customer_email: developer?.stripe_customer_id ? undefined : user.email,
      client_reference_id: profile.developer_id,
      metadata: {
        kind: "project_featured",
        developer_id: profile.developer_id,
        project_id: project.id,
      },
      success_url: `${origin}/dashboard/packages?feature_checkout=success`,
      cancel_url: `${origin}/dashboard/packages?feature_checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe error" },
      { status: 500 }
    );
  }
}
