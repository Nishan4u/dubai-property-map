import { Code2 } from "lucide-react";
import { EmbedCodeGenerator } from "@/components/dashboard/EmbedCodeGenerator";
import { requireDeveloperProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DeveloperEmbedPage() {
  const profile = await requireDeveloperProfile();
  const supabase = await createClient();
  // Pre-migration (patch_125 not yet applied) the embed_views column
  // doesn't exist -- select("*") degrades gracefully rather than throwing,
  // and embedViews just falls back to 0 below (same pattern as every other
  // optional-column read this session).
  const { data: developer } = await supabase
    .from("developers")
    .select("slug, embed_views")
    .eq("id", profile.developer_id)
    .maybeSingle();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-100">
          <Code2 className="h-5 w-5" /> Embed Widget
        </h1>
        <p className="text-sm text-ink-400">
          Show a live map of your own properties on your own website.
        </p>
      </div>
      {developer?.slug ? (
        <EmbedCodeGenerator developerSlug={developer.slug} embedViews={developer.embed_views ?? 0} />
      ) : (
        <p className="text-sm text-ink-500">Complete your company profile first to get your embed code.</p>
      )}
    </div>
  );
}
