import { TeamTable } from "@/components/dashboard/TeamTable";
import { createClient } from "@/lib/supabase/server";
import { requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const profile = await requireDeveloperProfile();
  const developerId = profile.developer_id;

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("team_members")
    .select("*")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  return <TeamTable members={members ?? []} />;
}
