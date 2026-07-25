import { CmsPage, getCmsMetadata } from "@/components/public/CmsPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return getCmsMetadata("privacy");
}

export default function PrivacyPage() {
  return <CmsPage slug="privacy" />;
}
