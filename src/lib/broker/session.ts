import { randomBytes, createHash } from "crypto";

export const DEVICE_TOKEN_COOKIE = "broker_device_token";

export function generateDeviceToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Lightweight heuristic label, not a full UA parser — just enough for a
// broker to recognize "is this my device" on the Security page.
export function parseDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";

  const os = userAgent.includes("iPhone") || userAgent.includes("iPad")
    ? "iOS"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("Mac OS")
        ? "macOS"
        : userAgent.includes("Windows")
          ? "Windows"
          : userAgent.includes("Linux")
            ? "Linux"
            : "Unknown OS";

  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Unknown browser";

  return `${browser} on ${os}`;
}
