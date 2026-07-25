import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { createClient } from "@/lib/supabase/server";

export async function getCmsMetadata(slug: string) {
  const supabase = await createClient();
  const { data: content } = await supabase
    .from("site_content")
    .select("title, body")
    .eq("slug", slug)
    .maybeSingle();

  if (!content) return {};

  const title = `${content.title} | Dubai Property Map`;
  const description = content.body.slice(0, 160);

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export async function CmsPage({ slug }: { slug: string }) {
  const supabase = await createClient();
  const { data: content } = await supabase
    .from("site_content")
    .select("title, body")
    .eq("slug", slug)
    .maybeSingle();

  if (!content) notFound();

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold text-ink-100">{content.title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed whitespace-pre-line text-ink-300">
          {content.body}
        </div>
      </div>
    </PublicShell>
  );
}
