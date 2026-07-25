import { CmsPage, getCmsMetadata } from "@/components/public/CmsPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return getCmsMetadata("careers");
}

export default function CareersPage() {
  return <CmsPage slug="careers" />;
}
