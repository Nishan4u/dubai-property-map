import { SignContractClient } from "@/components/contracts/SignContractClient";

export const dynamic = "force-dynamic";

export default async function SignContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SignContractClient token={token} />;
}
