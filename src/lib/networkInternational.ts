// Network International (N-Genius Online) REST API -- verified against
// docs.ngenius-payments.com. Server-only (fetch-based, no SDK), mirroring
// sendSms()/sendWhatsApp()'s "gated behind env vars, clear error when not
// configured" contract, but this one returns a payment redirect URL
// rather than sending a message, so its shape is closer to
// stripe.checkout.sessions.create().
const isLive = process.env.NETWORK_INTERNATIONAL_ENV === "live";
const API_BASE = isLive ? "https://api-gateway.ngenius-payments.com" : "https://api-gateway.sandbox.ngenius-payments.com";

async function getAccessToken(apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/identity/auth/access-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.ni-identity.v1+json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({ realmName: "ni" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.access_token as string) ?? null;
  } catch {
    return null;
  }
}

export async function createNetworkInternationalOrder(input: {
  amountAed: number;
  email: string;
  redirectUrl: string;
  cancelUrl: string;
}): Promise<{ orderReference: string; paymentUrl: string } | { error: string }> {
  const apiKey = process.env.NETWORK_INTERNATIONAL_API_KEY;
  const outletRef = process.env.NETWORK_INTERNATIONAL_OUTLET_REF;
  if (!apiKey || !outletRef) {
    return { error: "Network International is not configured." };
  }

  const token = await getAccessToken(apiKey);
  if (!token) {
    return { error: "Could not authenticate with Network International." };
  }

  try {
    const res = await fetch(`${API_BASE}/transactions/outlets/${outletRef}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.ni-payment.v2+json",
        Accept: "application/vnd.ni-payment.v2+json",
      },
      body: JSON.stringify({
        action: "SALE",
        amount: { currencyCode: "AED", value: Math.round(input.amountAed * 100) },
        emailAddress: input.email,
        merchantAttributes: { redirectUrl: input.redirectUrl, cancelUrl: input.cancelUrl },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `Network International order creation failed: ${text.slice(0, 300)}` };
    }

    const data = await res.json();
    const paymentUrl = data?._links?.payment?.href as string | undefined;
    const orderReference = data?.reference as string | undefined;
    if (!paymentUrl || !orderReference) {
      return { error: "Unexpected response from Network International." };
    }

    return { orderReference, paymentUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Network International error." };
  }
}
