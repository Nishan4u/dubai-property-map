import { CmsPage, getCmsMetadata } from "@/components/public/CmsPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return getCmsMetadata("advertise");
}

export default function AdvertisePage() {
  return <CmsPage slug="advertise" />;
}
