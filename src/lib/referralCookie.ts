// Client-only: reads the dpm_ref cookie set by /s/[code] when a visitor
// follows a staff member's shared link, so checkout forms can pre-fill the
// optional referral code field instead of requiring it to be typed in.
export function getReferralCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((row) => row.startsWith("dpm_ref="));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}
