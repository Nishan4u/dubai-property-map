import QRCode from "qrcode";

// Same call shape as the project-share QR code in ShareButton.tsx, reused
// here for referral links -- kept as its own tiny wrapper rather than
// importing from a component file.
export async function generateReferralQrCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 176,
    margin: 1,
    color: { dark: "#0a0f1e", light: "#ffffff" },
  });
}
