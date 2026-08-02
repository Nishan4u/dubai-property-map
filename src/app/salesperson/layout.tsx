import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SalespersonShellClient } from "@/components/salesperson/SalespersonShellClient";

export default async function SalespersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: profile } = await supabase
    .from("profiles")
    .select("*, salespersons!profiles_salesperson_id_fkey(*, developers(name))")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "salesperson") {
    redirect("/");
  }

  if (!profile.salesperson_id) {
    // First load after a self-registered salesperson confirms their email —
    // the developer/job-title/mobile/whatsapp collected at signup live in
    // auth user_metadata until now; finalize the salespersons row here.
    const meta = (user.user_metadata ?? {}) as {
      developer_id?: string;
      job_title?: string;
      mobile?: string;
      whatsapp?: string;
      referral_code?: string;
    };

    if (!meta.developer_id) {
      redirect("/");
    }

    const { error: claimError } = await supabase.rpc("claim_salesperson_profile", {
      p_developer_id: meta.developer_id,
      p_full_name: profile.full_name ?? "",
      p_job_title: meta.job_title ?? null,
      p_employee_id: null,
      p_mobile: meta.mobile ?? null,
      p_whatsapp: meta.whatsapp ?? null,
      p_referral_code: meta.referral_code ?? null,
    });

    if (claimError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
          <div className="w-full max-w-md rounded-2xl border border-rose-700/40 bg-navy-850 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold text-rose-400">Couldn&apos;t activate your account</h1>
            <p className="mt-2 text-sm text-ink-400">{claimError.message}</p>
          </div>
        </div>
      );
    }

    const refetched = await supabase
      .from("profiles")
      .select("*, salespersons!profiles_salesperson_id_fkey(*, developers(name))")
      .eq("id", user.id)
      .single();
    profile = refetched.data;
  }

  if (!profile || !profile.salespersons) {
    redirect("/");
  }

  const salesperson = profile.salespersons;

  if (salesperson.status === "inactive") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-700/40 bg-navy-850 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-rose-400">Account deactivated</h1>
          <p className="mt-2 text-sm text-ink-400">
            Your salesperson account has been deactivated by {salesperson.developers?.name ?? "your developer"}.
            Contact them for details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SalespersonShellClient userLabel={salesperson.full_name} userRole={salesperson.developers?.name ?? "Salesperson"}>
      {children}
    </SalespersonShellClient>
  );
}
