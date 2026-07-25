import { CmsPage, getCmsMetadata } from "@/components/public/CmsPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return getCmsMetadata("contact");
}

export default function ContactPage() {
  return <CmsPage slug="contact" />;
}
