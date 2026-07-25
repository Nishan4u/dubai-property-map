import { CmsPage, getCmsMetadata } from "@/components/public/CmsPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return getCmsMetadata("faq");
}

export default function FaqPage() {
  return <CmsPage slug="faq" />;
}
