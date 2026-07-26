export const EXPIRING_SOON_DAYS = 7;

export function isExpiringSoon(subscriptionStatus: string, expiresAt: string | null | undefined) {
  if (subscriptionStatus !== "active" || !expiresAt) return false;
  const daysLeft = Math.round(
    (new Date(`${expiresAt}T00:00:00Z`).getTime() - Date.now()) / 86_400_000
  );
  return daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS;
}
