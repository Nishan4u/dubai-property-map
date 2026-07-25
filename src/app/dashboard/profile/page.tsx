import { DeveloperProfileForm } from "@/components/dashboard/DeveloperProfileForm";
import { getDeveloperAwards, requireDeveloperProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { DeveloperRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DeveloperProfilePage() {
  const profile = await requireDeveloperProfile();
  const supabase = await createClient();
  const { data: developer } = await supabase
    .from("developers")
    .select("*")
    .eq("id", profile.developer_id)
    .single<DeveloperRow>();

  const awards = await getDeveloperAwards(profile.developer_id);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-ink-100">Company Profile</h1>
      <DeveloperProfileForm developer={developer!} awards={awards} />
    </div>
  );
}
