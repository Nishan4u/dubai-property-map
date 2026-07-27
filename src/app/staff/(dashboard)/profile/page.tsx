import { getStaffSelfData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink-100">{value || "—"}</p>
    </div>
  );
}

export default async function StaffProfilePage() {
  const { staff } = await getStaffSelfData();
  if (!staff) return null;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink-100">My Profile</h1>
        <p className="text-sm text-ink-400">
          Your target, commission rate, and referral attribution are managed by admin — contact them for any changes.
        </p>
      </div>

      <div className="grid max-w-lg grid-cols-2 gap-4 rounded-xl border border-navy-700 bg-navy-850 p-5">
        <Field label="Full Name" value={staff.full_name} />
        <Field label="Staff ID" value={staff.staff_code} />
        <Field label="Email" value={staff.email} />
        <Field label="Phone" value={staff.phone ?? ""} />
        <Field label="Position" value={staff.position ?? ""} />
        <Field label="Joining Date" value={new Date(staff.joining_date).toLocaleDateString()} />
        <Field label="Status" value={staff.status} />
        <Field label="Commission" value={staff.commission_type === "flat" ? `AED ${staff.commission_rate} flat` : `${staff.commission_rate}%`} />
      </div>
    </div>
  );
}
