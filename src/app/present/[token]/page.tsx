import { PresentationClient } from "@/components/public/PresentationClient";

export const dynamic = "force-dynamic";

export default async function PresentationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PresentationClient token={token} />;
}
