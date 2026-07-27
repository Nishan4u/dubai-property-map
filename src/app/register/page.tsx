import { PublicShell } from "@/components/public/PublicShell";
import { RegisterFormClient } from "@/components/public/RegisterFormClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("registration_type_settings").select("account_type, enabled");
  const disabledTypes = (data ?? []).filter((r) => !r.enabled).map((r) => r.account_type);

  return (
    <PublicShell>
      <RegisterFormClient disabledTypes={disabledTypes} />
    </PublicShell>
  );
}
