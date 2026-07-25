import { CmsPage, getCmsMetadata } from "@/components/public/CmsPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return getCmsMetadata("terms");
}

export default function TermsPage() {
  return <CmsPage slug="terms" />;
}
