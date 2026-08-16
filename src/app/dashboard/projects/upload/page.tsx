import { BrochureUploadForm } from "@/components/dashboard/BrochureUploadForm";
import { requireDeveloperProfile } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function UploadBrochurePage() {
  await requireDeveloperProfile();

  return (
    <div className="p-6">
      <BrochureUploadForm />
    </div>
  );
}
