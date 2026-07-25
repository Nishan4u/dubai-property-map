import { LeadsTableClient } from "@/components/dashboard/LeadsTableClient";
import { getLeadsForDeveloper, requireDeveloperProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DeveloperLeadsPage() {
  const profile = await requireDeveloperProfile();
  const developerId = profile.developer_id;
  const supabase = await createClient();

  const [leads, { data: teamMembers }] = await Promise.all([
    getLeadsForDeveloper(developerId),
    supabase
      .from("team_members")
      .select("name")
      .eq("developer_id", developerId)
      .eq("status", "active"),
  ]);

  return <LeadsTableClient leads={leads} agents={teamMembers ?? []} />;
}
