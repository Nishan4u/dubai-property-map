export const EXPIRING_SOON_DAYS = 7;

export function isExpiringSoon(subscriptionStatus: string, expiresAt: string | null | undefined) {
  if (subscriptionStatus !== "active" || !expiresAt) return false;
  const daysLeft = Math.round(
    (new Date(`${expiresAt}T00:00:00Z`).getTime() - Date.now()) / 86_400_000
  );
  return daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS;
}

// A plan's promo is "live" only while the admin has it switched on AND
// (if they set an end date) that date hasn't passed yet -- an expired
// promo_ends_at silently reverts to the normal price/Stripe price without
// needing the admin to remember to flip promo_active back off manually.
export function isPromoLive(plan: {
  promo_active?: boolean | null;
  promo_ends_at?: string | null;
  promo_price_label?: string | null;
}) {
  if (!plan.promo_active || !plan.promo_price_label) return false;
  if (!plan.promo_ends_at) return true;
  return new Date(`${plan.promo_ends_at}T23:59:59Z`).getTime() >= Date.now();
}
