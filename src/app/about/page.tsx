import { CmsPage, getCmsMetadata } from "@/components/public/CmsPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return getCmsMetadata("about");
}

export default function AboutPage() {
  return <CmsPage slug="about" />;
}
